/**
 * Header — sticky шапка сайта.
 *
 * Лого + навигация + CitySelector + AccountButton + CartButton.
 * Под header — Ticker (если страница не вложенная типа /admin).
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CitySelector } from './city-selector'
import { CartButton } from './cart-button'
import { AccountButton } from './account-button'
import { MobileMenu } from './mobile-menu'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/sourcing', label: 'Подбор' },
  { href: '/about', label: 'Доставка и ВЭД' },
] as const

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-hair bg-paper/85 backdrop-blur-md">
      <div className="container mx-auto flex h-[60px] max-w-[1480px] items-center justify-between gap-3 px-4 md:h-[68px] md:gap-6 md:px-6 lg:px-8">
        {/* Левая группа: бургер (mobile) + лого + навигация (desktop) */}
        <div className="flex items-center gap-2 md:gap-10">
          <MobileMenu />

          <Link href="/" className="flex items-center gap-2" aria-label="CaiPei — главная">
            <span className="chinese-seal h-7 w-7 text-base">采</span>
            <span className="font-display text-xl font-medium leading-none tracking-tight">
              CaiPei
            </span>
            <span className="hidden font-accent text-sm italic text-mute sm:inline">采配</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative text-sm transition-colors',
                    isActive ? 'text-ink' : 'text-ink-2 hover:text-ink'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-[24px] left-0 right-0 h-[2px] bg-cinnabar" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Правая группа: действия */}
        <div className="flex items-center gap-1 md:gap-2.5">
          <CitySelector />
          <AccountButton />
          <CartButton />
        </div>
      </div>
    </header>
  )
}
