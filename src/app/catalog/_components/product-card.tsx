/**
 * ProductCard — карточка товара в сетке каталога.
 *
 * Вся карточка кликабельна через невидимый Link-layer (absolute inset-0 z-10).
 * Блок управления корзиной — z-20 + stopPropagation чтобы перехватывать клики.
 *
 * Тарифная модель:
 *   qty < volumeThresholdQty   → price_rub
 *   qty >= volumeThresholdQty  → price_rub_volume (опт)
 *
 * Шаги +/- по 10. Минимум — MIN_QTY (10). Ниже MIN_QTY минус удаляет из корзины.
 */

'use client'

import Link from 'next/link'
import { useCart, MIN_QTY } from '@/hooks/use-cart'
import { useCity } from '@/hooks/use-city'
import { applyCityMultiplier } from '@/lib/city-pricing'
import { formatRub } from '@/lib/utils'
import type { CatalogItem } from '@/lib/queries/catalog'

function buildProxyUrl(url: string): string {
  if (url.startsWith('https://cbu')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

export function ProductCard({ product }: { product: CatalogItem }) {
  const { add, setQty, getQty } = useCart()
  const { selected: city } = useCity()
  const qty = getQty(product.id)
  const inCart = qty > 0

  // Tier-aware unit price
  const unitPrice = (q: number): number => {
    const base = q >= product.volume_threshold_qty ? product.price_rub_volume : product.price_rub
    return applyCityMultiplier(base, city?.slug)
  }

  const displayPrice = unitPrice(Math.max(qty, MIN_QTY))

  const mainPhoto = product.photos[0]
  const secondPhoto = product.photos[1] ?? mainPhoto

  const stopAndPrevent = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleAdd = (e: React.MouseEvent) => {
    stopAndPrevent(e)
    add({
      productId: product.id,
      sku: product.sku,
      title: product.title_ru,
      photo: mainPhoto?.url ?? null,
      basePriceRub: product.price_rub,
      volumePriceRub: product.price_rub_volume,
      volumeThresholdQty: product.volume_threshold_qty,
      citySlug: city?.slug ?? null,
    })
  }

  const handleDec = (e: React.MouseEvent) => {
    stopAndPrevent(e)
    setQty(product.id, qty - 10, city?.slug)
  }

  const handleInc = (e: React.MouseEvent) => {
    stopAndPrevent(e)
    setQty(product.id, qty + 10, city?.slug)
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-hair bg-surface-hi transition-all duration-200 hover:border-ink-2 hover:shadow-lift">
      <Link
        href={`/product/${product.sku}`}
        className="absolute inset-0 z-10"
        aria-label={product.title_ru}
      />

      {/* Photo */}
      <div className="relative aspect-square overflow-hidden bg-paper-2">
        {mainPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={buildProxyUrl(mainPhoto.url)}
              alt={product.title_ru}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
            />
            {secondPhoto !== mainPhoto && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={buildProxyUrl(secondPhoto.url)}
                alt=""
                loading="lazy"
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-ink-4">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M6 8h28v24H6zM6 24l8-8 6 6 4-4 10 10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        )}

        <div className="absolute left-3 top-3 inline-flex max-w-[60%] items-center truncate rounded-full bg-paper/90 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-2 backdrop-blur">
          {product.category.name_ru}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 font-display text-base font-medium leading-snug tracking-tight">
          {product.title_ru}
        </h3>

        <div className="space-y-0.5 text-xs text-ink-3">
          {product.size_text && <div className="line-clamp-1">{product.size_text}</div>}
          <div>от {MIN_QTY} шт</div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="tnum font-display text-xl font-semibold leading-none">
              {formatRub(displayPrice)}
            </div>
            <div className="mt-1.5 font-mono text-[9.5px] uppercase tracking-wider text-ink-3">
              {inCart
                ? `× ${qty} = ${formatRub(displayPrice * qty)}`
                : `от ${product.volume_threshold_qty.toLocaleString('ru-RU')} шт — ${formatRub(applyCityMultiplier(product.price_rub_volume, city?.slug))}`}
            </div>
          </div>

          {inCart ? (
            <div
              className="relative z-20 inline-flex h-10 items-center overflow-hidden rounded-full bg-ink text-paper"
              onClick={stopAndPrevent}
            >
              <button
                type="button"
                onClick={handleDec}
                className="grid h-10 w-10 place-items-center transition-colors hover:bg-cinnabar"
                aria-label="Уменьшить"
              >
                <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
                  <rect width="10" height="2" />
                </svg>
              </button>
              <span className="tnum min-w-[34px] px-1 text-center text-xs font-semibold">{qty}</span>
              <button
                type="button"
                onClick={handleInc}
                className="grid h-10 w-10 place-items-center transition-colors hover:bg-cinnabar"
                aria-label="Увеличить"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="4" width="2" height="10" />
                  <rect y="4" width="10" height="2" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="relative z-20 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-semibold text-paper transition-colors hover:bg-cinnabar"
              aria-label={`Добавить «${product.title_ru}» в корзину`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <rect x="4" width="2" height="10" />
                <rect y="4" width="10" height="2" />
              </svg>
              {MIN_QTY} в корзину
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
