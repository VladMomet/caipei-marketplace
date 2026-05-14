/**
 * POST /api/telegram/webhook
 *
 * Принимает обновления от Telegram (нажатия кнопок смены статуса).
 *
 * Регистрация webhook (выполнить один раз после деплоя):
 *   curl -F "url=https://caipei.ru/api/telegram/webhook" \
 *        -F "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
 *        "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook"
 *
 * Telegram передаёт секрет в заголовке X-Telegram-Bot-Api-Secret-Token —
 * проверяем, чтобы посторонние не дёргали наш endpoint.
 *
 * Формат callback_data:
 *   order:<number>:<new_status>
 *   pick:<number>:<new_status>
 *
 * После клика:
 *   1. Обновляем статус в БД
 *   2. answerCallbackQuery (убрать крутилку)
 *   3. editMessageText — добавить в сообщение строку "✓ <статус> — менеджер <имя>"
 *      и убрать кнопки (чтобы повторно не жали)
 */

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders, sourcingRequests } from '@/db/schema'
import { answerCallbackQuery, editTelegramMessage } from '@/lib/telegram'

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
}

interface TgUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

interface TgCallbackQuery {
  id: string
  from: TgUser
  message?: {
    message_id: number
    chat: { id: number }
    text?: string
  }
  data?: string
}

interface TgUpdate {
  update_id: number
  callback_query?: TgCallbackQuery
}

function displayName(u: TgUser): string {
  if (u.username) return `@${u.username}`
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  return name || `id${u.id}`
}

export async function POST(req: Request) {
  // Проверка секрета
  if (SECRET) {
    const sentSecret = req.headers.get('x-telegram-bot-api-secret-token')
    if (sentSecret !== SECRET) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  let update: TgUpdate
  try {
    update = (await req.json()) as TgUpdate
  } catch {
    return new NextResponse('Bad JSON', { status: 400 })
  }

  const cq = update.callback_query
  if (!cq || !cq.data || !cq.message) {
    // Не наш кейс — просто 200, чтобы Telegram не ретраил
    return NextResponse.json({ ok: true })
  }

  // Разбираем callback_data
  const parts = cq.data.split(':')
  if (parts.length !== 3) {
    await answerCallbackQuery(cq.id, 'Некорректный формат')
    return NextResponse.json({ ok: true })
  }
  const [entityType, number, newStatus] = parts
  const statusLabel = STATUS_LABELS[newStatus]
  if (!statusLabel) {
    await answerCallbackQuery(cq.id, 'Неизвестный статус')
    return NextResponse.json({ ok: true })
  }

  // Обновляем БД
  try {
    if (entityType === 'order') {
      const [updated] = await db
        .update(orders)
        .set({
          status: newStatus as 'in_progress' | 'completed' | 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(orders.number, number))
        .returning()
      if (!updated) {
        await answerCallbackQuery(cq.id, `Заказ ${number} не найден`)
        return NextResponse.json({ ok: true })
      }
    } else if (entityType === 'pick') {
      const [updated] = await db
        .update(sourcingRequests)
        .set({ status: newStatus as 'in_progress' | 'completed' | 'cancelled' })
        .where(eq(sourcingRequests.number, number))
        .returning()
      if (!updated) {
        await answerCallbackQuery(cq.id, `Заявка ${number} не найдена`)
        return NextResponse.json({ ok: true })
      }
    } else {
      await answerCallbackQuery(cq.id, 'Неизвестный тип')
      return NextResponse.json({ ok: true })
    }
  } catch (e) {
    console.error('[TG Webhook] DB update failed:', e)
    await answerCallbackQuery(cq.id, 'Ошибка БД')
    return NextResponse.json({ ok: true })
  }

  // Отвечаем на callback (убираем крутилку)
  await answerCallbackQuery(cq.id, `✓ ${statusLabel}`)

  // Дописываем к сообщению строку статуса и убираем кнопки
  const oldText = cq.message.text ?? ''
  const ts = new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
  const newText = `${oldText}\n\n────────\n✓ ${statusLabel} — ${displayName(cq.from)} · ${ts}`
  await editTelegramMessage(cq.message.chat.id, cq.message.message_id, newText)

  return NextResponse.json({ ok: true })
}
