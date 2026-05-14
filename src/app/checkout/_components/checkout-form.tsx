/**
 * CheckoutForm — оформление заказа для уже авторизованных пользователей.
 *
 * Просто подтверждение: показываем данные пользователя, поле комментария,
 * кнопка «Оформить заказ». Город берётся из useCity.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/hooks/use-cart'
import { useCity } from '@/hooks/use-city'
import { Button } from '@/components/ui/button'
import { Textarea, Label, FormField } from '@/components/ui/input'
import { maskPhone } from '@/lib/utils'

interface UserProfile {
  id: string
  type: 'physical' | 'legal'
  name: string
  phone: string
  email: string | null
}

interface CompanyProfile {
  name: string
  inn: string
  kpp: string | null
  ogrn: string
}

export function CheckoutForm() {
  const router = useRouter()
  const { items, totalRub, clear } = useCart()
  const { selected: city } = useCity()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Загружаем профиль
  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.user) setUser(data.user)
        if (data.company) setCompany(data.company)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!city) {
      setError('Не удалось определить город доставки. Перезагрузите страницу.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({ product_id: it.productId, qty: it.qty })),
          city_id: city.id,
          comment: comment || null,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        setError(data?.error?.message ?? 'Не удалось оформить заказ')
        return
      }

      const data = (await res.json()) as { order: { number: string } }
      clear()
      router.push(`/checkout/success?order=${encodeURIComponent(data.order.number)}`)
    } catch (e) {
      console.error('Checkout error:', e)
      setError('Что-то пошло не так. Попробуйте ещё раз через минуту.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-lg bg-paper-2" />
        <div className="h-24 animate-pulse rounded-lg bg-paper-2" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-cinnabar/30 bg-cinnabar/5 p-5 text-sm text-cinnabar">
        Не удалось загрузить данные. Попробуйте{' '}
        <Link href="/login" className="underline">войти заново</Link>.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      {/* Профиль */}
      <section className="rounded-xl border border-hair bg-paper p-5 lg:p-6">
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            {user.type === 'legal' ? 'Реквизиты и контакт' : 'Контактные данные'}
          </h2>
          <Link
            href="/account"
            className="font-mono text-[10.5px] uppercase tracking-wider text-cinnabar hover:underline"
          >
            Изменить
          </Link>
        </header>

        <dl className="space-y-3 text-sm">
          {company && (
            <>
              <Row label="Компания" value={company.name} />
              <Row label="ИНН" value={company.inn} />
              {company.kpp && <Row label="КПП" value={company.kpp} />}
              <Row label="ОГРН" value={company.ogrn} />
            </>
          )}
          <Row label={company ? 'Контактное лицо' : 'Имя'} value={user.name} />
          <Row label="Телефон" value={maskPhone(user.phone)} />
          {user.email && <Row label="Email" value={user.email} />}
        </dl>
      </section>

      {/* Город */}
      {city && (
        <section className="rounded-xl border border-hair bg-paper p-5 lg:p-6">
          <h2 className="mb-2 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            Город доставки
          </h2>
          <div className="font-display text-xl font-medium tracking-tight">
            Иу <span className="text-ink-4">→</span> {city.nameRu}
          </div>
          <div className="mt-1 text-sm text-ink-3">
            <span className="tnum">{city.daysMin}–{city.daysMax} дней</span> · с документами
          </div>
          <p className="mt-3 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            Сменить город можно в шапке сайта
          </p>
        </section>
      )}

      {/* Комментарий */}
      <FormField className="mb-0">
        <Label htmlFor="comment">Комментарий к заказу (необязательно)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Пожелания по цвету, материалам, срокам, доставке. Менеджер увидит вместе с заказом."
          rows={3}
        />
      </FormField>

      {error && (
        <div className="rounded-md border border-cinnabar/30 bg-cinnabar/5 px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting || items.length === 0}>
        {submitting ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 30" strokeLinecap="round" />
            </svg>
            Оформляем…
          </>
        ) : (
          <>
            Оформить заказ на {totalRub.toLocaleString('ru-RU').replace(/,/g, ' ')} ₽
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </>
        )}
      </Button>

      <p className="text-center font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
        Менеджер свяжется с вами в течение часа
      </p>
    </form>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <dt className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">{label}</dt>
      <dd className="text-ink-2">{value}</dd>
    </div>
  )
}
