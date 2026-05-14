/**
 * CartSummary — список товаров в корзине и итог.
 *
 * Sticky на десктопе. Читает корзину из localStorage через useCart.
 */

'use client'

import { useCart } from '@/hooks/use-cart'
import { useCity } from '@/hooks/use-city'
import { formatRub, pluralize } from '@/lib/utils'

function buildProxyUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('https://cbu')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

export function CartSummary() {
  const { items, totalUnits, totalRub } = useCart()
  const { selected: city } = useCity()

  return (
    <aside className="lg:sticky lg:top-[100px] lg:self-start">
      <div className="rounded-xl border border-hair bg-surface-hi p-5 lg:p-6">
        <header className="mb-5 flex items-baseline justify-between border-b border-hair pb-4">
          <h2 className="font-display text-lg font-medium tracking-tight">Ваш заказ</h2>
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            {totalUnits} {pluralize(totalUnits, 'товар', 'товара', 'товаров')}
          </div>
        </header>

        <ul className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {items.map((item) => {
            const photoUrl = buildProxyUrl(item.photo)
            return (
              <li key={item.productId} className="flex gap-3">
                {photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photoUrl}
                    alt=""
                    aria-hidden
                    className="h-16 w-16 flex-shrink-0 rounded-md bg-paper-2 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded-md bg-paper-2" />
                )}
                <div className="flex flex-1 flex-col justify-between gap-1">
                  <div className="line-clamp-2 text-xs leading-snug text-ink-2">
                    {item.title}
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                      {item.qty} × {formatRub(item.priceRub)}
                    </span>
                    <span className="tnum text-xs font-semibold">
                      {formatRub(item.priceRub * item.qty)}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-5 space-y-2 border-t border-hair pt-4">
          {city && (
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                Доставка
              </span>
              <span className="text-ink-2">
                {city.nameRu} · {city.daysMin}–{city.daysMax} дн.
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-between pt-2">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              Итого
            </span>
            <span className="tnum font-display text-2xl font-semibold tracking-tight">
              {formatRub(totalRub)}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          Окончательный счёт выставит менеджер после согласования партии. Оплата через
          банк безналом.
        </p>
      </div>
    </aside>
  )
}
