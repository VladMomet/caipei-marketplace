/**
 * Pagination — пагинация каталога.
 *
 * Серверная: каждая страница — отдельная ссылка с pre-built href.
 * Поддерживает back/forward, шаринг, SEO.
 *
 * Алгоритм окна: показываем 1, ..., current-1, current, current+1, ..., last.
 */

'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props {
  total: number
  page: number
  perPage: number
}

export function Pagination({ total, page, perPage }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  if (totalPages <= 1) return null

  // Сборка href для произвольной страницы
  const hrefFor = (p: number) => {
    const next = new URLSearchParams(searchParams.toString())
    if (p === 1) next.delete('page')
    else next.set('page', String(p))
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  // Список страниц: всегда 1 и last, плюс окно ±1 от current
  const pages: Array<number | 'gap'> = []
  const add = (n: number) => {
    if (!pages.includes(n)) pages.push(n)
  }
  add(1)
  if (page - 1 > 2) pages.push('gap')
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
    add(p)
  }
  if (page + 1 < totalPages - 1) pages.push('gap')
  if (totalPages > 1) add(totalPages)

  return (
    <nav
      aria-label="Пагинация"
      className="mt-10 flex items-center justify-center gap-1.5 border-t border-hair pt-8"
    >
      <PaginationLink
        href={hrefFor(Math.max(1, page - 1))}
        disabled={page === 1}
        ariaLabel="Предыдущая страница"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </PaginationLink>

      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-2 text-ink-3" aria-hidden="true">
            …
          </span>
        ) : (
          <PaginationLink key={p} href={hrefFor(p)} current={p === page}>
            {p}
          </PaginationLink>
        )
      )}

      <PaginationLink
        href={hrefFor(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        ariaLabel="Следующая страница"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </PaginationLink>
    </nav>
  )
}

function PaginationLink({
  href,
  current,
  disabled,
  ariaLabel,
  children,
}: {
  href: string
  current?: boolean
  disabled?: boolean
  ariaLabel?: string
  children: React.ReactNode
}) {
  const baseClass = cn(
    'tnum grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold transition-colors',
    current
      ? 'bg-ink text-paper'
      : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
    disabled && 'pointer-events-none opacity-40'
  )

  if (disabled) {
    return (
      <span className={baseClass} aria-disabled="true" aria-label={ariaLabel}>
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className={baseClass}
      aria-current={current ? 'page' : undefined}
      aria-label={ariaLabel}
      scroll
    >
      {children}
    </Link>
  )
}
