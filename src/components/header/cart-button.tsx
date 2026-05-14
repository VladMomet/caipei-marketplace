/**
 * CartButton — иконка корзины с бейджем + открывает CartDrawer.
 *
 * Сам drawer корзины определён в components/cart/cart-drawer.tsx (создаётся отдельно).
 * Пока корзина пустая или не открыта — показываем только иконку.
 */

'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { CartDrawer } from '@/components/cart/cart-drawer'

export function CartButton() {
  const { items } = useCart()
  const uniqueCount = items.length
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-hair bg-surface-hi text-ink transition-colors hover:border-ink-2"
        aria-label={`Корзина${uniqueCount > 0 ? `, ${uniqueCount} товаров` : ', пусто'}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2 2h2l2 9h7l2-6H5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="13.5" r="1.2" fill="currentColor" />
          <circle cx="12" cy="13.5" r="1.2" fill="currentColor" />
        </svg>
        {uniqueCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-cinnabar px-1 font-mono text-[10px] font-semibold text-surface-hi">
            {uniqueCount}
          </span>
        )}
      </button>

      <CartDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}
