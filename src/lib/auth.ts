/**
 * Auth.js v5 (next-auth beta) configuration.
 *
 * Используем Credentials provider: пользователь логинится по phone + password.
 * Сессии — JWT в httpOnly cookie.
 *
 * Регистрация делается отдельным эндпойнтом /api/auth/register (см. валидация в lib/validation.ts).
 * После регистрации фронт может вызвать signIn() для логина.
 */

import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { loginSchema } from './validation'

export const authConfig: NextAuthConfig = {
  trustHost: true,

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  },

  providers: [
    Credentials({
      credentials: {
        phone: { label: 'Телефон', type: 'tel' },
        password: { label: 'Пароль', type: 'password' },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { phone, password } = parsed.data

        const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1)
        if (!user) return null
        if (!user.isActive) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        // Обновим last_login_at
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id))

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          type: user.type,
        }
      },
    }),
  ],

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id
        token.phone = (user as { phone: string }).phone
        token.type = (user as { type: 'physical' | 'legal' }).type
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: string }).id = token.id as string
        ;(session.user as { phone?: string }).phone = token.phone as string
        ;(session.user as { type?: 'physical' | 'legal' }).type =
          token.type as 'physical' | 'legal'
      }
      return session
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)

/* ─── Type augmentation ──────────────────────────────────────────────
   Чтобы TypeScript знал, что в session.user есть id, phone, type. */

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      phone: string
      type: 'physical' | 'legal'
    }
  }
}
