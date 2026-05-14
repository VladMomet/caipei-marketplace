/**
 * POST /api/auth/register
 *
 * Регистрация физлица или юрлица. Создаёт user + companies (если legal) + consents.
 * Не логинит автоматически — фронт после успеха вызывает signIn() для входа.
 */

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, companies, consents } from '@/db/schema'
import { registerSchema } from '@/lib/validation'
import { BCRYPT_COST } from '@/lib/constants'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_JSON', message: 'Invalid JSON' } },
      { status: 400 }
    )
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Проверка дубля по телефону
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, data.phone))
    .limit(1)

  if (existing) {
    return NextResponse.json(
      {
        error: {
          code: 'PHONE_TAKEN',
          message: 'Пользователь с таким телефоном уже зарегистрирован',
        },
      },
      { status: 409 }
    )
  }

  // Проверка дубля по email (если задан)
  if (data.email) {
    const [byEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (byEmail) {
      return NextResponse.json(
        {
          error: {
            code: 'EMAIL_TAKEN',
            message: 'Пользователь с таким email уже зарегистрирован',
          },
        },
        { status: 409 }
      )
    }
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST)

  // Извлекаем мета для consents
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  const userAgent = req.headers.get('user-agent') ?? null

  // Транзакция: users + companies (опц.) + consents
  const result = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        type: data.type,
        phone: data.phone,
        email: data.email ?? null,
        passwordHash,
        name: data.name,
      })
      .returning()

    if (data.type === 'legal') {
      await tx.insert(companies).values({
        userId: user.id,
        name: data.company.name,
        inn: data.company.inn,
        kpp: data.company.kpp ?? null,
        ogrn: data.company.ogrn,
      })
    }

    // Логируем оба согласия
    await tx.insert(consents).values([
      {
        userId: user.id,
        consentType: 'privacy',
        ipAddress: ip,
        userAgent,
      },
      {
        userId: user.id,
        consentType: 'offer',
        ipAddress: ip,
        userAgent,
      },
    ])

    return user
  })

  return NextResponse.json({
    user: {
      id: result.id,
      name: result.name,
      phone: result.phone,
      email: result.email,
      type: result.type,
    },
  })
}
