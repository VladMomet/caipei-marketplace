/**
 * AddToCartBlock — степпер количества + основная CTA на детальной странице.
 *
 * Тарифная модель: цена за 1 шт зависит от qty.
 *   qty < volumeThresholdQty   → basePriceRub
 *   qty >= volumeThresholdQty  → volumePriceRub (опт, дешевле)
 *
 * Минимум: MIN_QTY (10). Шаги +/- по 10. Кнопка минус ниже MIN_QTY — удаляет товар.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart, MIN_QTY } from '@/hooks/use-cart'
import { useCity } from '@/hooks/use-city'
import { applyCityMultiplier } from '@/lib/city-pricing'
import { Button } from '@/components/ui/button'
import { formatRub } from '@/lib/utils'

interface Props {
  productId: string
  sku: string
  title: string
  photo: string | null
  /** Базовая цена за 1 шт (Москва, малая партия) */
  basePriceRub: number
  /** Цена за 1 шт при опте (Москва) */
  volumePriceRub: number
  /** Порог опта */
  volumeThresholdQty: number
}

export function AddToCartBlock({
  productId, sku, title, photo,
  basePriceRub, volumePriceRub, volumeThresholdQty,
}: Props) {
  const { add, setQty: setCartQty, getQty } = useCart()
  const { selected: city } = useCity()
  const inCartQty = getQty(productId)
  const inCart = inCartQty > 0

  // Цена за 1 шт с учётом тарифа и города
  const unitPriceForQty = (q: number): number => {
    const base = q >= volumeThresholdQty ? volumePriceRub : basePriceRub
    return applyCityMultiplier(base, city?.slug)
  }

  const [qty, setQtyLocal] = useState<number>(inCart ? inCartQty : MIN_QTY)

  useEffect(() => {
    if (inCart) setQtyLocal(inCartQty)
    else setQtyLocal(MIN_QTY)
  }, [inCart, inCartQty])

  const displayPrice = unitPriceForQty(qty)

  const dec = () => {
    const next = Math.max(MIN_QTY, qty - 10)
    setQtyLocal(next)
    if (inCart) setCartQty(productId, next, city?.slug)
  }

  const inc = () => {
    const next = Math.min(100000, qty + 10)
    setQtyLocal(next)
    if (inCart) setCartQty(productId, next, city?.slug)
  }

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value, 10)
    if (!Number.isFinite(n)) return
    const clamped = Math.min(100000, Math.max(MIN_QTY, n))
    setQtyLocal(clamped)
    if (inCart) setCartQty(productId, clamped, city?.slug)
  }

  const handleAdd = () => {
    add({
      productId,
      sku,
      title,
      photo,
      basePriceRub,
      volumePriceRub,
      volumeThresholdQty,
      citySlug: city?.slug ?? null,
      qty,
    })
  }

  const isWholesale = qty >= volumeThresholdQty
  const wholesaleHint = isWholesale
    ? `Активен опт: от ${volumeThresholdQty.toLocaleString('ru-RU')} шт`
    : `От ${volumeThresholdQty.toLocaleString('ru-RU')} шт — ${formatRub(applyCityMultiplier(volumePriceRub, city?.slug))} за шт`

  return (
    <div className="rounded-xl border border-hair bg-surface-hi p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="inline-flex h-14 items-center overflow-hidden rounded-full border border-hair-2 bg-surface">
          <button
            type="button"
            onClick={dec}
            className="grid h-full w-12 place-items-center text-ink-2 transition-colors hover:bg-paper-2 disabled:opacity-30"
            disabled={qty <= MIN_QTY}
            aria-label="Уменьшить количество"
          >
            <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor">
              <rect width="12" height="2" rx="1" />
            </svg>
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_QTY}
            max={100000}
            value={qty}
            onChange={onInput}
            className="tnum h-full w-20 border-0 bg-transparent text-center font-display text-lg font-semibold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Количество"
          />
          <button
            type="button"
            onClick={inc}
            className="grid h-full w-12 place-items-center text-ink-2 transition-colors hover:bg-paper-2"
            aria-label="Увеличить количество"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="5" width="2" height="12" rx="1" />
              <rect y="5" width="12" height="2" rx="1" />
            </svg>
          </button>
        </div>

        <div className="text-right">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            штук, мин. {MIN_QTY}
          </div>
          <div className="tnum mt-1 font-display text-sm text-ink-2">
            = {formatRub(displayPrice * qty)}
          </div>
        </div>
      </div>

      <div className={`mb-4 rounded-lg px-3 py-2 text-xs ${isWholesale ? 'bg-cinnabar/10 text-cinnabar' : 'bg-paper-2 text-ink-3'}`}>
        {wholesaleHint}
      </div>

      {inCart ? (
        <Link href="/checkout" className="block">
          <Button size="lg" variant="primary" className="w-full">
            Перейти в корзину · {inCartQty} шт
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </Link>
      ) : (
        <Button onClick={handleAdd} size="lg" variant="primary" className="w-full">
          Добавить в корзину · {formatRub(displayPrice * qty)}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      )}

      <p className="mt-3 text-center font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
        Менеджер свяжется в течение часа
      </p>
    </div>
  )
}
