/**
 * /account — личный кабинет.
 *
 * SSR: проверка сессии, редирект на /login если не авторизован.
 * Активная вкладка читается из ?tab=. По умолчанию «orders».
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AccountTabs, type AccountTab } from './_components/account-tabs'
import { OrdersTab } from './_components/orders-tab'
import { SourcingTab } from './_components/sourcing-tab'
import { ProfileTab } from './_components/profile-tab'

export const metadata: Metadata = {
  title: 'Личный кабинет',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function AccountPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/account')
  }

  const sp = await searchParams
  const tab: AccountTab =
    sp.tab === 'sourcing' || sp.tab === 'profile' ? sp.tab : 'orders'

  return (
    <>
      <div className="border-b border-hair bg-paper">
        <div className="container mx-auto max-w-[1280px] px-6 py-5 lg:px-8 lg:py-6">
          <nav
            aria-label="Хлебные крошки"
            className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              Главная
            </Link>
            <span className="mx-2">·</span>
            <span className="text-ink">Личный кабинет</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-[1280px] px-6 py-10 lg:px-8 lg:py-14">
        <header className="mb-10">
          <h1 className="mb-2 font-display text-3xl font-light tracking-tight md:text-4xl lg:text-[44px]">
            Личный кабинет
          </h1>
          <p className="text-base text-ink-3">
            Привет, {session.user.name ?? 'друг'}!
          </p>
        </header>

        <AccountTabs current={tab} />

        <div className="mt-8 lg:mt-10">
          {tab === 'orders' && <OrdersTab />}
          {tab === 'sourcing' && <SourcingTab />}
          {tab === 'profile' && <ProfileTab />}
        </div>
      </div>
    </>
  )
}
