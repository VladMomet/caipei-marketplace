/**
 * CatalogToolbar — верхняя панель каталога.
 *
 * Содержит: счётчик товаров, поиск, селект сортировки, кнопку фильтров (моб.).
 * Все изменения — через URL.
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useTransition } from 'react'
import { pluralize } from '@/lib/utils'

interface Props {
  total: number
  onOpenMobileFilters: () => void
}

const SORT_OPTIONS = [
  { value: 'popular', label: 'Популярные' },
  { value: 'price-asc', label: 'Цена: дешевле' },
  { value: 'price-desc', label: 'Цена: дороже' },
] as const

export function CatalogToolbar({ total, onOpenMobileFilters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const urlSearch = searchParams.get('search') ?? ''
  const urlSort = (searchParams.get('sort') ?? 'popular') as 'popular' | 'price-asc' | 'price-desc'

  // Локальный state с debounce — чтобы не дёргать URL на каждое нажатие
  const [search, setSearch] = useState(urlSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Синхронизация при back/forward
  useEffect(() => {
    setSearch(urlSearch)
  }, [urlSearch])

  const pushParam = (updates: Array<[string, string | null]>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of updates) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    next.delete('page')
    const qs = next.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  const onSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushParam([['search', value.trim() || null]])
    }, 350)
  }

  return (
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Левая часть: счётчик + поиск */}
      <div className="flex flex-1 items-center gap-4">
        <div className="hidden font-mono text-[10.5px] uppercase tracking-wider text-ink-3 lg:block">
          <span className="tnum text-ink">{total}</span>{' '}
          {pluralize(total, 'товар', 'товара', 'товаров')}
        </div>

        <div className="relative flex-1 lg:max-w-md">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по каталогу"
            className="h-11 w-full rounded-full border border-hair-2 bg-surface-hi pl-10 pr-4 text-sm placeholder:text-ink-4 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>
      </div>

      {/* Правая часть: сортировка + моб.кнопка фильтров */}
      <div className="flex items-center gap-2.5">
        {/* Моб.кнопка фильтров */}
        <button
          onClick={onOpenMobileFilters}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-hair-2 bg-surface-hi px-4 text-sm transition-colors hover:border-ink-2 lg:hidden"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Фильтры
        </button>

        {/* Сортировка */}
        <div className="relative">
          <select
            value={urlSort}
            onChange={(e) => pushParam([['sort', e.target.value === 'popular' ? null : e.target.value]])}
            disabled={pending}
            className="h-11 appearance-none rounded-full border border-hair-2 bg-surface-hi pl-4 pr-9 text-sm transition-colors hover:border-ink-2 focus:border-ink focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3"
            aria-hidden="true"
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
