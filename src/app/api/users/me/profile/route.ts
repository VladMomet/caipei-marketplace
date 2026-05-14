/**
 * GET   /api/users/me/profile — данные текущего пользователя и компании.
 * PATCH /api/users/me/profile — обновление профиля и реквизитов.
 */

import { NextResponse } from 'next/server'
import { eq, and, ne } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users, companies } from '@/db/schema'
import { updateProfileSchema } from '@/lib/validation'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    )
  }

  let company = null
  if (user.type === 'legal') {
    const [c] = await db.select().from(companies).where(eq(companies.userId, user.id)).limit(1)
    company = c ?? null
  }

  return NextResponse.json({
    user: {
      id: user.id,
      type: user.type,
      name: user.name,
      phone: user.phone,
      email: user.email,
    },
    company,
  })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_JSON', message: 'Invalid JSON' } },
      { status: 400 }
    )
  }

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Проверьте поля',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Если меняется телефон/email — проверяем уникальность
  if (data.phone) {
    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phone, data.phone), ne(users.id, session.user.id)))
      .limit(1)
    if (conflict) {
      return NextResponse.json(
        { error: { code: 'PHONE_TAKEN', message: 'Этот телефон уже используется' } },
        { status: 409 }
      )
    }
  }
  if (data.email) {
    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, data.email), ne(users.id, session.user.id)))
      .limit(1)
    if (conflict) {
      return NextResponse.json(
        { error: { code: 'EMAIL_TAKEN', message: 'Этот email уже используется' } },
        { status: 409 }
      )
    }
  }

  await db.transaction(async (tx) => {
    const userUpdate: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) userUpdate.name = data.name
    if (data.phone !== undefined) userUpdate.phone = data.phone
    if (data.email !== undefined) userUpdate.email = data.email ?? null

    if (Object.keys(userUpdate).length > 1) {
      await tx.update(users).set(userUpdate).where(eq(users.id, session.user.id))
    }

    if (data.company) {
      await tx
        .update(companies)
        .set({
          name: data.company.name,
          inn: data.company.inn,
          kpp: data.company.kpp ?? null,
          ogrn: data.company.ogrn,
        })
        .where(eq(companies.userId, session.user.id))
    }
  })

  return NextResponse.json({ ok: true })
}
