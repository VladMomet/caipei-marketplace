/**
 * AccountButton — отображает «Войти» или иконку профиля в зависимости от сессии.
 *
 * На мобиле — только круглая иконка (одно касание = переход в кабинет/логин).
 * На десктопе — полная кнопка с именем пользователя или подписью «Войти».
 */

'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2 12c1-2.5 3-4 5-4s4 1.5 5 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AccountButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div
        className="h-9 w-9 animate-pulse rounded-full bg-paper-2 md:h-10 md:w-24"
        aria-hidden="true"
      />
    )
  }

  if (session?.user) {
    return (
      <Link
        href="/account"
        aria-label={`Личный кабинет: ${session.user.name ?? ''}`}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-hair bg-surface-hi text-ink transition-colors hover:border-ink-2 md:px-4 md:py-2"
      >
        <span className="grid h-9 w-9 place-items-center md:h-auto md:w-auto">
          <UserIcon />
        </span>
        <span className="hidden max-w-[120px] truncate text-xs font-semibold md:inline">
          {session.user.name ?? 'Кабинет'}
        </span>
      </Link>
    )
  }

  return (
    <Link
      href="/login"
      aria-label="Войти"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-paper transition-colors hover:bg-cinnabar md:px-5 md:py-2.5"
    >
      <span className="grid h-9 w-9 place-items-center md:hidden">
        <UserIcon />
      </span>
      <span className="hidden text-xs font-semibold md:inline">Войти</span>
    </Link>
  )
}
