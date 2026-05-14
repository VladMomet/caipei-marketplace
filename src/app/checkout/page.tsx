/**
 * /checkout — страница оформления заказа.
 *
 * Server component-обёртка. Вся логика (корзина из localStorage, регистрация,
 * создание заказа) — в клиентском CheckoutFlow.
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckoutFlow } from './_components/checkout-flow'

export const metadata: Metadata = {
  title: 'Оформление заказа',
  description: 'Подтвердите данные и оформите оптовый заказ украшений и аксессуаров из Китая.',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return (
    <>
      {/* Хлебные крошки */}
      <div className="border-b border-hair bg-paper">
        <div className="container mx-auto max-w-[1480px] px-6 py-5 lg:px-8 lg:py-6">
          <nav
            aria-label="Хлебные крошки"
            className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              Главная
            </Link>
            <span className="mx-2">·</span>
            <Link href="/catalog" className="hover:text-ink transition-colors">
              Каталог
            </Link>
            <span className="mx-2">·</span>
            <span className="text-ink">Оформление заказа</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-[1280px] px-6 py-10 lg:px-8 lg:py-14">
        <CheckoutFlow />
      </div>
    </>
  )
}
