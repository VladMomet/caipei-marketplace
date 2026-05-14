/**
 * RegistrationForm — форма для гостей: регистрация + создание заказа за один submit.
 *
 * Flow:
 *  1. POST /api/auth/register  — создаёт user + company + consents
 *  2. signIn('credentials', {redirect: false}) — устанавливает JWT cookie
 *  3. POST /api/orders — создаёт заказ (Telegram-уведомление срабатывает на бэке)
 *  4. clear() корзины и router.push(/checkout/success?order=CP-...)
 *
 * При ошибке на любом шаге — выводится сообщение, состояние формы сохраняется.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useCart } from '@/hooks/use-cart'
import { useCity } from '@/hooks/use-city'
import { Button } from '@/components/ui/button'
import {
  Input,
  Textarea,
  Label,
  FormField,
  FormError,
  FormHint,
  Checkbox,
  SegmentControl,
} from '@/components/ui/input'

type UserType = 'physical' | 'legal'

interface FormState {
  type: UserType
  name: string
  phone: string
  email: string
  password: string
  // legal
  companyName: string
  inn: string
  kpp: string
  ogrn: string
  // common
  comment: string
  consentPrivacy: boolean
  consentOffer: boolean
}

const initial: FormState = {
  type: 'physical',
  name: '',
  phone: '',
  email: '',
  password: '',
  companyName: '',
  inn: '',
  kpp: '',
  ogrn: '',
  comment: '',
  consentPrivacy: false,
  consentOffer: false,
}

export function RegistrationForm() {
  const router = useRouter()
  const { items, totalRub, clear } = useCart()
  const { selected: city } = useCity()

  const [form, setForm] = useState<FormState>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (fieldErrors[key as string]) {
      setFieldErrors((fe) => {
        const next = { ...fe }
        delete next[key as string]
        return next
      })
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!city) {
      setError('Не удалось определить город доставки. Перезагрузите страницу.')
      return
    }
    if (items.length === 0) {
      setError('Корзина пуста')
      return
    }
    if (!form.consentPrivacy || !form.consentOffer) {
      setError('Согласия обязательны для оформления заказа')
      return
    }

    setSubmitting(true)

    try {
      // Шаг 1: регистрация
      const registerBody: Record<string, unknown> = {
        type: form.type,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        consents: { privacy: true, offer: true },
      }
      if (form.type === 'legal') {
        registerBody.company = {
          name: form.companyName,
          inn: form.inn,
          kpp: form.kpp || undefined,
          ogrn: form.ogrn,
        }
      }

      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerBody),
      })

      if (!regRes.ok) {
        const data = (await regRes.json().catch(() => null)) as
          | { error?: { code?: string; message?: string; fields?: Record<string, string[]> } }
          | null
        if (data?.error?.fields) {
          // Мапим вложенные пути типа company.inn → inn
          const flat: Record<string, string> = {}
          for (const [key, msgs] of Object.entries(data.error.fields)) {
            const k = key.split('.').pop() ?? key
            flat[k === 'name' && form.type === 'legal' ? 'name' : k] = msgs[0] ?? ''
          }
          setFieldErrors(flat)
        }
        setError(data?.error?.message ?? 'Не удалось зарегистрироваться')
        return
      }

      // Шаг 2: автологин
      const signInRes = await signIn('credentials', {
        phone: form.phone,
        password: form.password,
        redirect: false,
      })
      if (signInRes?.error) {
        setError('Аккаунт создан, но не удалось войти. Попробуйте перейти в /login.')
        return
      }

      // Шаг 3: создание заказа
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({ product_id: it.productId, qty: it.qty })),
          city_id: city.id,
          comment: form.comment || null,
        }),
      })

      if (!orderRes.ok) {
        const data = (await orderRes.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        setError(
          data?.error?.message ??
            'Аккаунт создан, но не удалось оформить заказ. Загляните в личный кабинет.'
        )
        return
      }

      const orderData = (await orderRes.json()) as {
        order: { number: string }
      }

      // Шаг 4: очистка корзины и переход на success
      clear()
      router.push(`/checkout/success?order=${encodeURIComponent(orderData.order.number)}`)
    } catch (e) {
      console.error('Checkout error:', e)
      setError('Что-то пошло не так. Попробуйте ещё раз через минуту.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <Label>Вы оформляете заказ как</Label>
        <SegmentControl<UserType>
          options={[
            { value: 'physical', label: 'Физическое лицо' },
            { value: 'legal', label: 'Юридическое лицо' },
          ]}
          value={form.type}
          onChange={(v) => update('type', v)}
        />
      </div>

      {/* Юр. реквизиты (только для legal) */}
      {form.type === 'legal' && (
        <fieldset className="space-y-4 rounded-lg border border-hair bg-paper p-5">
          <legend className="px-2 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            Реквизиты компании
          </legend>

          <FormField>
            <Label htmlFor="companyName">Наименование</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              placeholder="ООО «Ромашка»"
              required
            />
            <FormError>{fieldErrors.name}</FormError>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField className="mb-0">
              <Label htmlFor="inn">ИНН</Label>
              <Input
                id="inn"
                value={form.inn}
                onChange={(e) => update('inn', e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="10 или 12 цифр"
                inputMode="numeric"
                required
              />
              <FormError>{fieldErrors.inn}</FormError>
            </FormField>

            <FormField className="mb-0">
              <Label htmlFor="kpp">КПП (опц.)</Label>
              <Input
                id="kpp"
                value={form.kpp}
                onChange={(e) => update('kpp', e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="9 цифр"
                inputMode="numeric"
              />
              <FormError>{fieldErrors.kpp}</FormError>
            </FormField>
          </div>

          <FormField className="mb-0">
            <Label htmlFor="ogrn">ОГРН / ОГРНИП</Label>
            <Input
              id="ogrn"
              value={form.ogrn}
              onChange={(e) => update('ogrn', e.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="13 или 15 цифр"
              inputMode="numeric"
              required
            />
            <FormError>{fieldErrors.ogrn}</FormError>
          </FormField>
        </fieldset>
      )}

      {/* Контактные данные */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
          {form.type === 'legal' ? 'Контактное лицо' : 'Контактные данные'}
        </legend>

        <FormField>
          <Label htmlFor="name">
            {form.type === 'legal' ? 'ФИО контактного лица' : 'Имя'}
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={form.type === 'legal' ? 'Иванов Иван Иванович' : 'Иван'}
            required
            autoComplete="name"
          />
          <FormError>{fieldErrors.name && form.type === 'physical' ? fieldErrors.name : null}</FormError>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField className="mb-0">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+7 999 123-45-67"
              required
              autoComplete="tel"
            />
            <FormError>{fieldErrors.phone}</FormError>
          </FormField>

          <FormField className="mb-0">
            <Label htmlFor="email">Email (необязательно)</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@company.ru"
              autoComplete="email"
            />
            <FormError>{fieldErrors.email}</FormError>
            {!form.email && (
              <FormHint>
                Без email сброс пароля только через менеджера — это безопасно, просто медленнее.
              </FormHint>
            )}
          </FormField>
        </div>

        <FormField className="mb-0">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="минимум 6 символов"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <FormError>{fieldErrors.password}</FormError>
        </FormField>
      </fieldset>

      {/* Комментарий */}
      <FormField>
        <Label htmlFor="comment">Комментарий к заказу (необязательно)</Label>
        <Textarea
          id="comment"
          value={form.comment}
          onChange={(e) => update('comment', e.target.value)}
          placeholder="Пожелания по цвету, материалам, срокам, доставке. Менеджер увидит вместе с заказом."
          rows={3}
        />
      </FormField>

      {/* Согласия */}
      <div className="space-y-3 rounded-lg bg-paper-2 p-5">
        <Checkbox
          id="consent-privacy"
          checked={form.consentPrivacy}
          onChange={(v) => update('consentPrivacy', v)}
        >
          Я согласен(-на) на{' '}
          <Link href="/legal/privacy" target="_blank" className="text-cinnabar underline-offset-2 hover:underline">
            обработку персональных данных
          </Link>{' '}
          в соответствии с 152-ФЗ
        </Checkbox>

        <Checkbox
          id="consent-offer"
          checked={form.consentOffer}
          onChange={(v) => update('consentOffer', v)}
        >
          Принимаю условия{' '}
          <Link href="/legal/offer" target="_blank" className="text-cinnabar underline-offset-2 hover:underline">
            публичной оферты
          </Link>
        </Checkbox>
      </div>

      {/* Глобальная ошибка */}
      {error && (
        <div className="rounded-md border border-cinnabar/30 bg-cinnabar/5 px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      )}

      {/* CTA */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting || items.length === 0}
      >
        {submitting ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 30" strokeLinecap="round" />
            </svg>
            Создаём заказ…
          </>
        ) : (
          <>Зарегистрироваться и оформить заказ на сумму {totalRub > 0 ? totalRub.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽' : ''}</>
        )}
      </Button>

      <p className="text-center font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
        Менеджер свяжется с вами в течение часа
      </p>
    </form>
  )
}
