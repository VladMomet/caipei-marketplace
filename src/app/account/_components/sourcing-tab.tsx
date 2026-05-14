/**
 * SourcingTab — список заявок на подбор пользователя.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatRub, pluralize } from '@/lib/utils'
import { StatusBadge } from './status-badge'

interface SourcingRequest {
  number: string
  status: string
  description: string
  qty: number
  budget_rub: number | null
  photos: string[]
  created_at: string
}

function buildProxyUrl(url: string): string {
  if (url.startsWith('https://cbu')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleString('ru-RU', {
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

export function SourcingTab() {
  const [requests, setRequests] = useState<SourcingRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/sourcing-requests')
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data: SourcingRequest[]) => {
        if (!cancelled) setRequests(data)
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить заявки')
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

  if (requests === null) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-paper-2" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hair-2 bg-surface px-6 py-16 text-center">
        <p className="mb-3 font-display text-xl font-medium tracking-tight">Заявок пока нет</p>
        <p className="mb-6 max-w-md mx-auto text-sm text-ink-3">
          Если в каталоге нет нужного — опишите задачу, прикрепите референсы. Наш сотрудник
          в Иу проедет по фабрикам и пришлёт 2–3 варианта в течение 24 часов.
        </p>
        <Link href="/sourcing">
          <Button variant="primary">Заказать подбор</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Шапка вкладки с CTA */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
          {requests.length} {pluralize(requests.length, 'заявка', 'заявки', 'заявок')}
        </p>
        <Link href="/sourcing">
          <Button variant="primary" size="sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <rect x="5" width="2" height="12" rx="1" />
              <rect y="5" width="12" height="2" rx="1" />
            </svg>
            Подобрать ещё
          </Button>
        </Link>
      </div>

      <ul className="space-y-3.5">
        {requests.map((r) => (
          <li
            key={r.number}
            className="rounded-xl border border-hair bg-surface-hi p-5 lg:p-6"
          >
            <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-lg font-semibold tracking-tight">
                  {r.number}
                </span>
                <StatusBadge status={r.status} type="sourcing" />
              </div>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                {formatDate(r.created_at)}
              </span>
            </header>

            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-ink-2">
              {r.description}
            </p>

            {r.photos.length > 0 && (
              <ul className="mb-4 flex flex-wrap gap-2">
                {r.photos.map((url, i) => (
                  <li key={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={buildProxyUrl(url)}
                      alt={`Референс ${i + 1}`}
                      className="h-16 w-16 rounded-md bg-paper-2 object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}

            <footer className="flex flex-wrap items-baseline gap-x-5 gap-y-2 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              <span>
                <span className="tnum text-ink">{r.qty}</span>{' '}
                {pluralize(r.qty, 'шт', 'шт', 'шт')}
              </span>
              {r.budget_rub !== null && (
                <span>
                  Бюджет: <span className="text-ink">{formatRub(r.budget_rub)}/шт</span>
                </span>
              )}
            </footer>
          </li>
        ))}
      </ul>
    </div>
  )
}
