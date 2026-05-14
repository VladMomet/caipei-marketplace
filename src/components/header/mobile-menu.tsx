/**
 * MobileMenu — бургер-кнопка + выезжающее меню для мобильных.
 *
 * На десктопе (md+) полностью скрыто — навигация там горизонтальная в шапке.
 * На мобиле: кнопка-бургер слева от логотипа (как принято в большинстве
 * современных интернет-магазинов).
 *
 * Sheet содержит:
 *  - Основную навигацию (Каталог / Подбор / Доставка и ВЭД)
 *  - Список категорий (топ-7) — главное упрощение для мобильного UX
 *  - Контакты (телефон, email) с tel:/mailto: для нативного звонка/письма
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetClose,
} from '@/components/ui/sheet'
import { LEGAL_ENTITY } from '@/lib/constants'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/sourcing', label: 'Подбор' },
  { href: '/about', label: 'Доставка и ВЭД' },
] as const

// Топ-7 категорий для быстрого доступа с мобильного меню.
// Если хочется автоматизации — можно подгружать из БД, но 7 «топовых»
// меняются редко, статика быстрее и не зависит от сети.
const TOP_CATEGORIES = [
  { slug: 'divany', label: 'Диваны' },
  { slug: 'krovati', label: 'Кровати' },
  { slug: 'stoly', label: 'Столы' },
  { slug: 'stulya', label: 'Стулья' },
  { slug: 'zerkala', label: 'Зеркала' },
  { slug: 'shkafy', label: 'Шкафы' },
  { slug: 'komody', label: 'Комоды' },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Закрываем меню при смене страницы (после клика по ссылке)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть меню"
        className="grid h-10 w-10 place-items-center rounded-md text-ink transition-colors hover:bg-paper-2 md:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <Sheet open={open} onOpenChange={setOpen} side="left">
        <SheetHeader>
          <SheetTitle>Меню</SheetTitle>
          <SheetClose onClick={() => setOpen(false)} />
        </SheetHeader>

        <SheetBody>
          {/* Основные разделы */}
          <nav className="px-5 pb-2 pt-1">
            <ul className="space-y-0.5">
              {NAV.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between rounded-md px-3 py-3 text-base transition-colors',
                        isActive
                          ? 'bg-paper-2 font-medium text-ink'
                          : 'text-ink hover:bg-paper-2'
                      )}
                    >
                      {item.label}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden="true"
                        className="text-ink-3"
                      >
                        <path
                          d="M5 3l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Разделитель */}
          <div className="mx-5 my-3 border-t border-hair" />

          {/* Категории — быстрый доступ */}
          <div className="px-5 py-1">
            <h3 className="mb-2 px-3 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              Популярные категории
            </h3>
            <ul className="space-y-0.5">
              {TOP_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/catalog/${cat.slug}`}
                    className="block rounded-md px-3 py-2.5 text-sm text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Разделитель */}
          <div className="mx-5 my-3 border-t border-hair" />

          {/* Контакты */}
          <div className="px-5 pb-6 pt-1">
            <h3 className="mb-3 px-3 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              Связаться
            </h3>
            <ul className="space-y-0.5">
              <li>
                <a
                  href={`tel:${LEGAL_ENTITY.phone.replace(/[^+\d]/g, '')}`}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-ink transition-colors hover:bg-paper-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="text-ink-3"
                  >
                    <path
                      d="M3.5 3h2l1 3-1.5 1c.5 2 2 3.5 4 4l1-1.5 3 1v2c0 .5-.5 1-1 1-5 0-9-4-9-9 0-.5.5-1 1-1z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {LEGAL_ENTITY.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${LEGAL_ENTITY.email}`}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-ink transition-colors hover:bg-paper-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="text-ink-3"
                  >
                    <rect
                      x="1.5"
                      y="3"
                      width="13"
                      height="10"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M2 4l6 4 6-4"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                  {LEGAL_ENTITY.email}
                </a>
              </li>
            </ul>
          </div>
        </SheetBody>
      </Sheet>
    </>
  )
}
