/**
 * CartDrawer — drawer корзины. Открывается по клику на иконку корзины в шапке.
 *
 * Формат строки: фото · название · «5 × 1 200 ₽» · сумма · «− N + удалить».
 * Похоже на список товаров на странице заказа (поэтому пользователю
 * сразу понятно что у него лежит).
 */

'use client'

import Link from 'next/link'
import { useCart, MIN_QTY } from '@/hooks/use-cart'
import { useCity } from '@/hooks/use-city'
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { formatRub, pluralize } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildProxyUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('https://cbu')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

export function CartDrawer({ open, onOpenChange }: Props) {
  const { items, totalRub, isEmpty, setQty, remove } = useCart()
  const { selected: city } = useCity()
  const uniqueCount = items.length

  return (
    <Sheet open={open} onOpenChange={onOpenChange} widthClassName="w-[480px]">
      <SheetHeader>
        <div className="min-w-0">
          <SheetTitle>Корзина</SheetTitle>
          {!isEmpty && (
            <p className="mt-1 truncate font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              {uniqueCount} {pluralize(uniqueCount, 'товар', 'товара', 'товаров')} · доставка в{' '}
              {city?.nameAcc ?? city?.nameRu ?? '—'}
            </p>
          )}
        </div>
        <SheetClose onClose={() => onOpenChange(false)} />
      </SheetHeader>

      <SheetBody className="px-0 py-0">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-paper-2 text-ink-3">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M3 3h3l2.5 12h10l2-8H6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mb-2 font-display text-lg font-medium">Здесь пока пусто</p>
            <p className="mb-6 max-w-[280px] text-sm text-ink-3">
              Откройте каталог — украшения и аксессуары из Китая с прозрачной ценой.
            </p>
            <Link href="/catalog" onClick={() => onOpenChange(false)}>
              <Button variant="primary">Открыть каталог</Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-hair">
            {items.map((item) => {
              const photoUrl = buildProxyUrl(item.photo)
              return (
                <li key={item.productId} className="flex gap-4 px-5 py-5 lg:px-6">
                  {photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photoUrl}
                      alt={item.title}
                      className="h-20 w-20 flex-none rounded-md bg-paper-2 object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 flex-none rounded-md bg-paper-2" />
                  )}

                  <div className="flex flex-1 min-w-0 flex-col gap-2">
                    {/* Верхний блок: название + сумма */}
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/product/${item.sku}`}
                        onClick={() => onOpenChange(false)}
                        className="line-clamp-2 flex-1 text-sm font-medium hover:text-cinnabar"
                      >
                        {item.title}
                      </Link>
                      <div className="tnum shrink-0 font-display text-sm font-semibold">
                        {formatRub(item.priceRub * item.qty)}
                      </div>
                    </div>

                    {/* Подстрока: qty × цена */}
                    <div className="tnum font-mono text-[11.5px] text-ink-3">
                      {item.qty} × {formatRub(item.priceRub)}
                    </div>

                    {/* Нижний блок: степпер + удалить */}
                    <div className="mt-1 flex items-center justify-between">
                      <QtyStepper
                        value={item.qty}
                        min={MIN_QTY}
                        step={10}
                        onDec={() => setQty(item.productId, item.qty - 10, city?.slug)}
                        onInc={() => setQty(item.productId, item.qty + 10, city?.slug)}
                        onInput={(n) => setQty(item.productId, n, city?.slug)}
                      />
                      <button
                        onClick={() => remove(item.productId)}
                        className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3 transition-colors hover:text-cinnabar"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </SheetBody>

      {!isEmpty && (
        <SheetFooter>
          <div className="mb-4 flex items-baseline justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              Итого с доставкой
            </span>
            <span className="tnum font-display text-2xl font-medium tracking-tight">
              {formatRub(totalRub)}
            </span>
          </div>
          <Link href="/checkout" onClick={() => onOpenChange(false)} className="block">
            <Button variant="primary" size="lg" className="w-full">
              Оформить заказ
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Button>
          </Link>
          <p className="mt-3 text-center font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            Менеджер свяжется в течение часа
          </p>
        </SheetFooter>
      )}
    </Sheet>
  )
}

function QtyStepper({
  value,
  min,
  step = 1,
  onDec,
  onInc,
  onInput,
}: {
  value: number
  min: number
  step?: number
  onDec: () => void
  onInc: () => void
  onInput: (n: number) => void
}) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-hair-2 bg-surface-hi">
      <button
        type="button"
        onClick={onDec}
        disabled={value <= min}
        className="grid h-9 w-9 place-items-center text-ink-2 transition-colors hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Уменьшить"
      >
        <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
          <rect width="10" height="2" />
        </svg>
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={100000}
        step={step}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!Number.isFinite(n)) return
          onInput(Math.min(100000, Math.max(min, n)))
        }}
        className="tnum h-9 w-16 border-0 bg-transparent text-center text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Количество"
      />
      <button
        type="button"
        onClick={onInc}
        className="grid h-9 w-9 place-items-center text-ink-2 transition-colors hover:bg-paper-2"
        aria-label="Увеличить"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <rect x="4" width="2" height="10" />
          <rect y="4" width="10" height="2" />
        </svg>
      </button>
    </div>
  )
}
