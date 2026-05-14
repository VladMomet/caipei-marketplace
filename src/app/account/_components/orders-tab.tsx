/**
 * OrdersTab — список заказов текущего пользователя.
 *
 * Загружает GET /api/orders при монтировании. Каждый заказ — карточка с
 * номером, датой, составом (1-2 названия + N), суммой, статус-бейджем.
 * Клик → /account/orders/[number].
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatRub, pluralize } from '@/lib/utils'
import { StatusBadge } from './status-badge'

interface OrderItem {
  snapshot_title: string
  snapshot_photo: string | null
  snapshot_sku: string
  qty: number
  unit_price_rub: number
  total_price_rub: number
}

interface Order {
  number: string
  status: string
  total_rub: number
  units_count: number
  created_at: string
  comment: string | null
  items: OrderItem[]
}

function buildProxyUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('https://cbu')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

function formatDate(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return s
  }
}

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/orders')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load orders')
        return r.json()
      })
      .then((data: Order[]) => {
        if (!cancelled) setOrders(data)
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить заказы')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="rounded-md border border-cinnabar/30 bg-cinnabar/5 p-4 text-sm text-cinnabar">
        {error}
      </div>
    )
  }

  if (orders === null) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-paper-2" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hair-2 bg-surface px-6 py-16 text-center">
        <p className="mb-3 font-display text-xl font-medium tracking-tight">Заказов пока нет</p>
        <p className="mb-6 text-sm text-ink-3">
          Когда оформите заказ — увидите его здесь и сможете отслеживать статус.
        </p>
        <Link href="/catalog">
          <Button variant="primary">Открыть каталог</Button>
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-3.5">
      {orders.map((order) => {
        const preview = order.items.slice(0, 3)
        const more = order.items.length - preview.length

        return (
          <li key={order.number}>
            <Link
              href={`/account/orders/${order.number}`}
              className="group block overflow-hidden rounded-xl border border-hair bg-surface-hi p-5 transition-all hover:border-ink-2 hover:shadow-soft lg:p-6"
            >
              <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-lg font-semibold tracking-tight">
                    {order.number}
                  </span>
                  <StatusBadge status={order.status} type="order" />
                </div>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                  {formatDate(order.created_at)}
                </span>
              </header>

              {/* Превью товаров */}
              <ul className="mb-5 flex flex-wrap items-center gap-3">
                {preview.map((item, idx) => {
                  const photoUrl = buildProxyUrl(item.snapshot_photo)
                  return (
                    <li key={idx} className="flex items-center gap-3">
                      {photoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={photoUrl}
                          alt=""
                          aria-hidden
                          className="h-12 w-12 flex-shrink-0 rounded-md bg-paper-2 object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 flex-shrink-0 rounded-md bg-paper-2" />
                      )}
                      <div className="hidden text-xs sm:block max-w-[200px]">
                        <div className="line-clamp-1 text-ink-2">{item.snapshot_title}</div>
                        <div className="font-mono text-[10.5px] text-ink-3">
                          {item.qty} × {formatRub(item.unit_price_rub)}
                        </div>
                      </div>
                    </li>
                  )
                })}
                {more > 0 && (
                  <li className="grid h-12 min-w-12 place-items-center rounded-md bg-paper-2 px-3 font-mono text-xs text-ink-3">
                    +{more}
                  </li>
                )}
              </ul>

              <footer className="flex items-baseline justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                  {order.units_count} {pluralize(order.units_count, 'шт', 'шт', 'шт')}
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="tnum font-display text-2xl font-semibold tracking-tight">
                    {formatRub(order.total_rub)}
                  </span>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3 transition-colors group-hover:text-cinnabar">
                    Подробнее →
                  </span>
                </div>
              </footer>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
