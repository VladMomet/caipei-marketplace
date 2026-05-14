/**
 * AccountTabs — навигация между вкладками личного кабинета.
 *
 * Активная вкладка хранится в URL (?tab=orders|sourcing|profile),
 * чтобы можно было шарить ссылки и работала back-кнопка.
 */

'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Tab = 'orders' | 'sourcing' | 'profile'

const TABS: { value: Tab; label: string }[] = [
  { value: 'orders', label: 'Заказы' },
  { value: 'sourcing', label: 'Заявки на подбор' },
  { value: 'profile', label: 'Контакты и реквизиты' },
]

export function AccountTabs({ current }: { current: Tab }) {
  const pathname = usePathname()
  const sp = useSearchParams()

  return (
    <nav
      className="-mx-2 flex gap-1 overflow-x-auto border-b border-hair pb-px"
      role="tablist"
    >
      {TABS.map((tab) => {
        const active = tab.value === current
        const params = new URLSearchParams(sp.toString())
        if (tab.value === 'orders') params.delete('tab')
        else params.set('tab', tab.value)
        const href = params.toString() ? `${pathname}?${params.toString()}` : pathname

        return (
          <Link
            key={tab.value}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              'relative shrink-0 rounded-md px-3 py-3 text-sm font-medium transition-colors',
              active
                ? 'text-ink'
                : 'text-ink-3 hover:bg-paper-2 hover:text-ink-2'
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute -bottom-px left-3 right-3 h-[2px] bg-cinnabar" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export type { Tab as AccountTab }
