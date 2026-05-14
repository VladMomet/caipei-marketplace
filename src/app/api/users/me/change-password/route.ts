/**
 * POST /api/users/me/change-password
 */

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { changePasswordSchema } from '@/lib/validation'
import { BCRYPT_COST } from '@/lib/constants'

export async function POST(req: Request) {
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
    return NextResponse.json({ error: { code: 'BAD_JSON' } }, { status: 400 })
  }

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  const { currentPassword, newPassword } = parsed.data

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) {
    return NextResponse.json(
      { error: { code: 'WRONG_PASSWORD', message: 'Текущий пароль неверный' } },
      { status: 400 }
    )
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_COST)
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
