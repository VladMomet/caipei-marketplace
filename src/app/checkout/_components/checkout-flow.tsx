/**
 * CheckoutFlow — клиентский оркестратор страницы /checkout.
 *
 * Решает что показать:
 *  - корзина пуста → EmptyState с CTA на каталог
 *  - гость → RegistrationForm (реги + заказ)
 *  - авторизован → CheckoutForm (только заказ)
 *
 * Корзина живёт в localStorage и не доступна на сервере, поэтому всё это
 * только на клиенте. До гидрации показываем skeleton.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useCart } from '@/hooks/use-cart'
import { CartSummary } from './cart-summary'
import { RegistrationForm } from './registration-form'
import { CheckoutForm } from './checkout-form'
import { Button } from '@/components/ui/button'

export function CheckoutFlow() {
  const { items, isEmpty } = useCart()
  const { data: session, status } = useSession()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  // До гидрации useCart возвращает пустой массив (SSR), поэтому ждём
  if (!hydrated || status === 'loading') {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-lg bg-paper-2" />
          <div className="h-64 animate-pulse rounded-lg bg-paper-2" />
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-paper-2" />
      </div>
    )
  }

  if (isEmpty) {
    return <EmptyState />
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px] lg:gap-10 xl:gap-14">
      <div>
        <h1 className="mb-2 font-display text-3xl font-light tracking-tight md:text-4xl lg:text-[44px]">
          {session?.user ? 'Подтверждение заказа' : 'Оформление заказа'}
        </h1>
        <p className="mb-8 text-base text-ink-3">
          {session?.user
            ? 'Проверьте данные, добавьте комментарий — и менеджер свяжется в течение часа.'
            : 'Создаём аккаунт и оформляем заказ за один шаг. Менеджер свяжется с вами в течение часа.'}
        </p>

        {session?.user ? (
          <CheckoutForm />
        ) : (
          <>
            <p className="mb-7 inline-flex items-center gap-2 rounded-md border border-hair bg-paper-2 px-4 py-2.5 text-sm">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                Уже есть аккаунт?
              </span>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent('/checkout')}`}
                className="text-cinnabar hover:underline"
              >
                Войти
              </Link>
            </p>
            <RegistrationForm />
          </>
        )}
      </div>

      <CartSummary />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6 inline-grid h-20 w-20 place-items-center rounded-full bg-paper-2 text-ink-3">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M4 4h3l3 14h13l3-10H8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mb-3 font-display text-3xl font-light tracking-tight md:text-4xl">
        Корзина пуста
      </h1>
      <p className="mb-8 text-base leading-relaxed text-ink-3">
        Добавьте товары в корзину из каталога — или закажите персональный подбор,
        если нужного нет.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/catalog">
          <Button size="lg" variant="primary">
            Открыть каталог
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Button>
        </Link>
        <Link href="/sourcing">
          <Button size="lg" variant="secondary">
            Заказать подбор
          </Button>
        </Link>
      </div>
    </div>
  )
}
