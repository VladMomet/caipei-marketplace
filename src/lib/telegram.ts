/**
 * Telegram-уведомления менеджеру.
 *
 * Это весь "бэк-офис" — менеджер получает заказы и заявки в Telegram и работает оттуда.
 * Никакой веб-админки в MVP нет.
 *
 * Все вызовы делаются ПОСЛЕ успешного сохранения в БД. Если Telegram упал —
 * заказ всё равно создан, ошибка только логируется.
 */

import { formatRub, pluralize } from './utils'

const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TG_CHAT_ID = process.env.TELEGRAM_MANAGER_CHAT_ID

const TG_API = TG_BOT_TOKEN ? `https://api.telegram.org/bot${TG_BOT_TOKEN}` : ''

/** Полезная нагрузка для уведомления о новом заказе */
export interface OrderNotificationPayload {
  number: string // CP-238472
  userName: string
  userPhone: string
  userType: 'physical' | 'legal'
  companyName?: string
  companyInn?: string
  cityName: string
  comment?: string | null
  items: Array<{
    title: string
    qty: number
    unitPriceRub: number
    totalPriceRub: number
    /** Источник 1688 — для менеджера. Опционально. */
    sourceUrl?: string | null
  }>
  totalRub: number
}

/** Полезная нагрузка для уведомления о заявке на подбор */
export interface SourcingNotificationPayload {
  number: string // SRC-654321
  userName: string
  userPhone: string
  /** Физ или юр лицо. Для юр — также передаются companyName и companyInn. */
  userType: 'physical' | 'legal'
  companyName?: string | null
  companyInn?: string | null
  /** Город доставки (для понимания логистики при подборе) */
  cityName: string
  description: string
  qty: number
  budgetRub?: number | null
  /**
   * Фото-референсы в виде буферов. Загружаются прямо в Telegram через
   * multipart (без S3 — экономим инфру в MVP).
   */
  photos: Array<{
    buffer: Buffer
    filename: string
    contentType: string
  }>
}

/**
 * Inline-кнопки в Telegram-сообщении.
 *
 * callback_data — компактная строка для нашего webhook (см. /api/telegram/webhook):
 *   order:<number>:<status>
 *   pick:<number>:<status>
 *
 * Telegram передаст это нам в `callback_query.data` при нажатии.
 */
export interface InlineButton {
  text: string
  callback_data: string
}

type InlineKeyboard = InlineButton[][]

/**
 * Кнопки смены статуса заказа.
 *
 * Менеджер видит все возможные следующие шаги и одним тапом меняет статус.
 * После клика — пишем в БД, и Telegram-сообщение редактируется (см. webhook).
 */
function orderStatusButtons(number: string): InlineKeyboard {
  return [
    [
      { text: '▶️ В работу', callback_data: `order:${number}:in_progress` },
      { text: '✅ Завершён', callback_data: `order:${number}:completed` },
    ],
    [{ text: '✖️ Отменить', callback_data: `order:${number}:cancelled` }],
  ]
}

function pickStatusButtons(number: string): InlineKeyboard {
  return [
    [
      { text: '▶️ В работу', callback_data: `pick:${number}:in_progress` },
      { text: '✅ Завершено', callback_data: `pick:${number}:completed` },
    ],
    [{ text: '✖️ Отменить', callback_data: `pick:${number}:cancelled` }],
  ]
}

/**
 * Отправляет произвольное текстовое сообщение менеджеру.
 * Возвращает true, если отправлено успешно.
 */
async function sendMessage(text: string, replyMarkup?: { inline_keyboard: InlineKeyboard }): Promise<boolean> {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    console.warn('[Telegram] Bot token or chat ID not configured. Skipping notification.')
    return false
  }

  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text,
        disable_web_page_preview: false,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[Telegram] sendMessage failed:', res.status, body)
      return false
    }
    return true
  } catch (e) {
    console.error('[Telegram] sendMessage exception:', e)
    return false
  }
}

/** Отправляет одно фото по URL */
async function sendPhotoFromUrl(photoUrl: string, caption?: string): Promise<boolean> {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return false

  try {
    const res = await fetch(`${TG_API}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        photo: photoUrl,
        caption,
      }),
    })
    return res.ok
  } catch (e) {
    console.error('[Telegram] sendPhoto exception:', e)
    return false
  }
}

/**
 * Отправляет фото прямо из буфера (multipart/form-data).
 * Используется для фото-референсов в заявках на подбор — мы шлём их
 * напрямую в Telegram без промежуточного S3-хранилища.
 *
 * Лимит Telegram: 10 МБ на одно фото.
 */
async function sendPhotoBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string,
  caption?: string
): Promise<boolean> {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    console.warn('[Telegram] Bot not configured, skip photo')
    return false
  }

  try {
    const form = new FormData()
    form.append('chat_id', TG_CHAT_ID)
    if (caption) form.append('caption', caption)
    // Blob доступен глобально в Node.js 18+ и Vercel runtime
    const blob = new Blob([new Uint8Array(buffer)], { type: contentType })
    form.append('photo', blob, filename)

    const res = await fetch(`${TG_API}/sendPhoto`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[Telegram] sendPhotoBuffer failed:', res.status, text)
    }
    return res.ok
  } catch (e) {
    console.error('[Telegram] sendPhotoBuffer exception:', e)
    return false
  }
}

/**
 * Уведомление о новом заказе.
 *
 * Визуально отличается от заявки на подбор зелёной «полосой» в шапке
 * (деньги → зелёный). См. notifyNewSourcing для контраста (жёлтый).
 */
export async function notifyNewOrder(payload: OrderNotificationPayload): Promise<void> {
  const lines: string[] = []
  // Шапка-разделитель: зелёная полоса = заказ (деньги в кассе)
  lines.push('🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢')
  lines.push(`💰 НОВЫЙ ЗАКАЗ — ${payload.number}`)
  lines.push('🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢')
  lines.push('')

  // Клиент
  if (payload.userType === 'legal' && payload.companyName) {
    lines.push(`👤 ${payload.userName} (${payload.companyName})`)
    if (payload.companyInn) lines.push(`🏢 ИНН: ${payload.companyInn}`)
  } else {
    lines.push(`👤 ${payload.userName} (физ. лицо)`)
  }
  lines.push(`📱 ${payload.userPhone}`)
  lines.push(`🏙 Доставка: ${payload.cityName}`)
  lines.push('')

  // Состав
  const positionWord = pluralize(payload.items.length, 'позиция', 'позиции', 'позиций')
  const totalUnits = payload.items.reduce((s, i) => s + i.qty, 0)
  const unitWord = pluralize(totalUnits, 'шт', 'шт', 'шт')
  lines.push(`📦 Состав (${payload.items.length} ${positionWord}, ${totalUnits} ${unitWord}):`)
  lines.push('')

  payload.items.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.title}`)
    lines.push(
      `   ${item.qty} шт × ${formatRub(item.unitPriceRub)} = ${formatRub(item.totalPriceRub)}`
    )
    if (item.sourceUrl) {
      lines.push(`   ${item.sourceUrl}`)
    }
    lines.push('')
  })

  lines.push(`💰 ИТОГО: ${formatRub(payload.totalRub)}`)

  if (payload.comment) {
    lines.push('')
    lines.push(`💬 Комментарий клиента: «${payload.comment}»`)
  }

  await sendMessage(lines.join('\n'), {
    inline_keyboard: orderStatusButtons(payload.number),
  })
}

/**
 * Уведомление о новой заявке на подбор.
 *
 * Визуально отличается от заказа жёлтой «полосой» в шапке
 * (задача предстоит → жёлтый). Это помогает менеджеру быстро различать
 * типы сообщений в общем потоке Telegram-канала.
 *
 * Затем отдельными сообщениями отправляются фото-референсы.
 */
export async function notifyNewSourcing(payload: SourcingNotificationPayload): Promise<void> {
  const lines: string[] = []
  // Шапка-разделитель: жёлтая полоса = подбор (нужна работа сотрудника в Иу)
  lines.push('🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡')
  lines.push(`🔍 ЗАЯВКА НА ПОДБОР — ${payload.number}`)
  lines.push('🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡')
  lines.push('')

  // Клиент — с типом физ/юр (как у заказов)
  if (payload.userType === 'legal' && payload.companyName) {
    lines.push(`👤 ${payload.userName} (${payload.companyName})`)
    if (payload.companyInn) lines.push(`🏢 ИНН: ${payload.companyInn}`)
  } else {
    lines.push(`👤 ${payload.userName} (физ. лицо)`)
  }
  lines.push(`📱 ${payload.userPhone}`)
  lines.push(`🏙 Доставка: ${payload.cityName}`)
  lines.push('')

  lines.push('📝 Описание:')
  lines.push(payload.description)
  lines.push('')

  lines.push(`📊 Кол-во: ${payload.qty} шт`)
  if (payload.budgetRub) {
    lines.push(`💰 Бюджет: ${formatRub(payload.budgetRub)}/шт`)
  }

  await sendMessage(lines.join('\n'), {
    inline_keyboard: pickStatusButtons(payload.number),
  })

  // Шлём фото-референсы как multipart прямо в Telegram (без S3)
  for (let i = 0; i < payload.photos.length; i++) {
    const photo = payload.photos[i]
    await sendPhotoBuffer(
      photo.buffer,
      photo.filename,
      photo.contentType,
      `📎 Референс ${i + 1}/${payload.photos.length} к заявке ${payload.number}`
    )
  }
}

/**
 * Generic helper — для отладки или служебных сообщений.
 */
export async function notifyText(text: string): Promise<boolean> {
  return sendMessage(text)
}

/**
 * Редактирует существующее сообщение в Telegram (по chat_id + message_id).
 *
 * Используется в webhook'е после смены статуса заказа/заявки —
 * чтобы менеджер видел в чате актуальное состояние и кто это сделал.
 */
export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string
): Promise<boolean> {
  if (!TG_BOT_TOKEN) return false
  try {
    const res = await fetch(`${TG_API}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[Telegram] editMessageText failed:', res.status, body)
    }
    return res.ok
  } catch (e) {
    console.error('[Telegram] editMessageText exception:', e)
    return false
  }
}

/**
 * Подтверждает Telegram, что callback (нажатие кнопки) принят.
 * Без этого пользователь видит «крутилку» на кнопке несколько секунд.
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<boolean> {
  if (!TG_BOT_TOKEN) return false
  try {
    const res = await fetch(`${TG_API}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        ...(text ? { text } : {}),
      }),
    })
    return res.ok
  } catch (e) {
    console.error('[Telegram] answerCallbackQuery exception:', e)
    return false
  }
}
