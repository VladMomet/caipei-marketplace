/**
 * /account/orders/[number] — детали конкретного заказа.
 *
 * SSR: проверяем ownership через сессию, тянем данные из БД напрямую.
 * 404 если заказа нет, 403 если он не того пользователя.
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect, forbidden } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { orders, orderItems, cities } from '@/db/schema'
import { formatRub, pluralize } from '@/lib/utils'
import { StatusBadge } from '../../_components/status-badge'
import { LEGAL_ENTITY } from '@/lib/constants'

interface Props {
  params: Promise<{ number: string }>
}

export const metadata: Metadata = {
  title: 'Заказ',
  robots: { index: false, follow: false },
}

function buildProxyUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('https://cbu')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

function formatDate(d: Date): string {
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function OrderDetailPage({ params }: Props) {
  const { number } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/account/orders/${number}`)
  }

  const [order] = await db
    .select({
      id: orders.id,
      number: orders.number,
      userId: orders.userId,
      status: orders.status,
      totalRub: orders.totalRub,
      unitsCount: orders.unitsCount,
      comment: orders.comment,
      createdAt: orders.createdAt,
      cityName: cities.nameRu,
      daysMin: cities.daysMin,
      daysMax: cities.daysMax,
    })
    .from(orders)
    .innerJoin(cities, eq(orders.deliveryCityId, cities.id))
    .where(eq(orders.number, number))
    .limit(1)

  if (!order) notFound()
  // forbidden() в Next 15+; если недоступен в окружении — заменить на notFound()
  if (order.userId !== session.user.id) {
    try {
      forbidden()
    } catch {
      notFound()
    }
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))

  return (
    <>
      <div className="border-b border-hair bg-paper">
        <div className="container mx-auto max-w-[1100px] px-6 py-5 lg:px-8 lg:py-6">
          <nav
            aria-label="Хлебные крошки"
            className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              Главная
            </Link>
            <span className="mx-2">·</span>
            <Link href="/account" className="hover:text-ink transition-colors">
              Личный кабинет
            </Link>
            <span className="mx-2">·</span>
            <Link href="/account" className="hover:text-ink transition-colors">
              Заказы
            </Link>
            <span className="mx-2">·</span>
            <span className="text-ink">{order.number}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-[1100px] px-6 py-10 lg:px-8 lg:py-14">
        {/* Заголовок */}
        <header className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="font-display text-3xl font-light tracking-tight md:text-4xl">
                Заказ {order.number}
              </h1>
              <StatusBadge status={order.status} type="order" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
              Создан {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <div className="tnum font-display text-4xl font-medium tracking-tight">
              {formatRub(Number(order.totalRub))}
            </div>
            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              {order.unitsCount} {pluralize(order.unitsCount, 'шт', 'шт', 'шт')}
            </div>
          </div>
        </header>

        {/* Доставка */}
        <section className="mb-8 grid gap-4 rounded-xl border border-hair bg-surface-hi p-6 sm:grid-cols-2">
          <div>
            <div className="mb-1 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              Доставка
            </div>
            <div className="font-display text-xl font-medium tracking-tight">
              Иу <span className="text-ink-4">→</span> {order.cityName}
            </div>
            <div className="mt-1 text-sm text-ink-3">
              <span className="tnum">
                {order.daysMin}–{order.daysMax} дней
              </span>{' '}
              · с документами
            </div>
          </div>
          {order.comment && (
            <div className="sm:border-l sm:border-hair sm:pl-6">
              <div className="mb-1 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                Комментарий
              </div>
              <p className="text-sm leading-relaxed text-ink-2">{order.comment}</p>
            </div>
          )}
        </section>

        {/* Состав */}
        <section className="mb-8">
          <h2 className="mb-5 font-display text-xl font-medium tracking-tight">
            Состав заказа
          </h2>
          <ul className="divide-y divide-hair rounded-xl border border-hair bg-surface-hi">
            {items.map((item) => {
              const photoUrl = buildProxyUrl(item.snapshotPhoto)
              return (
                <li key={item.id} className="flex gap-4 p-5">
                  {photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photoUrl}
                      alt=""
                      aria-hidden
                      className="h-20 w-20 flex-shrink-0 rounded-md bg-paper-2 object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 flex-shrink-0 rounded-md bg-paper-2" />
                  )}
                  <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.snapshotSku}`}
                        className="line-clamp-2 text-sm font-medium hover:text-cinnabar"
                      >
                        {item.snapshotTitle}
                      </Link>
                      <div className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                        {item.snapshotSku}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-baseline gap-4 sm:flex-col sm:items-end">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                        {item.qty} × {formatRub(Number(item.unitPriceRub))}
                      </span>
                      <span className="tnum font-display text-base font-semibold tracking-tight">
                        {formatRub(Number(item.totalPriceRub))}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Юр.лицо контрагент */}
        <section className="mb-8 rounded-xl border border-hair bg-paper p-6 text-sm">
          <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            Продавец
          </h2>
          <div className="font-display text-lg font-medium tracking-tight">
            {LEGAL_ENTITY.fullName}
          </div>
          <div className="mt-2 grid gap-1 text-sm text-ink-3 sm:grid-cols-2">
            <div>ИНН: <span className="text-ink-2">{LEGAL_ENTITY.inn}</span></div>
            <div>ОГРНИП: <span className="text-ink-2">{LEGAL_ENTITY.ogrn}</span></div>
          </div>
        </section>

        <div>
          <Link href="/account" className="font-mono text-[11px] uppercase tracking-wider text-cinnabar hover:underline">
            ← Назад ко всем заказам
          </Link>
        </div>
      </div>
    </>
  )
}
