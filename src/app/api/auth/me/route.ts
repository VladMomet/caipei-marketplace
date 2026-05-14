/**
 * GET /api/auth/me — текущий пользователь (включая компанию для юр.лица).
 */

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users, companies } from '@/db/schema'

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
    const [c] = await db
      .select()
      .from(companies)
      .where(eq(companies.userId, user.id))
      .limit(1)
    company = c ?? null
  }

  return NextResponse.json({
    user: {
      id: user.id,
      type: user.type,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isActive: user.isActive,
    },
    company,
  })
}
