/**
 * SourcingForm — главная форма заявки на подбор.
 *
 * Для гостей включает блок регистрации (как чекаут).
 * Фото-референсы загружаются в S3 сразу при добавлении.
 * После успешного submit показывается inline success с номером заявки.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
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
import { PhotoUploader } from './photo-uploader'
import { SOURCING_DESCRIPTION_MIN_LENGTH } from '@/lib/constants'

type UserType = 'physical' | 'legal'

interface FormState {
  description: string
  qty: string
  budget: string
  photoFiles: File[]
  // Для гостей
  type: UserType
  name: string
  phone: string
  email: string
  password: string
  companyName: string
  inn: string
  kpp: string
  ogrn: string
  consentPrivacy: boolean
  consentOffer: boolean
}

const initial: FormState = {
  description: '',
  qty: '',
  budget: '',
  photoFiles: [],
  type: 'physical',
  name: '',
  phone: '',
  email: '',
  password: '',
  companyName: '',
  inn: '',
  kpp: '',
  ogrn: '',
  consentPrivacy: false,
  consentOffer: false,
}

export function SourcingForm() {
  const { data: session, status } = useSession()
  const { selected: city } = useCity()
  const isAuthenticated = !!session?.user
  const isLoading = status === 'loading'

  const [form, setForm] = useState<FormState>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successNumber, setSuccessNumber] = useState<string | null>(null)

  // Не показываем форму регистрации до того как узнаем session status
  // (иначе на доли секунды показывается регистрация авторизованным)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

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

    // Локальная валидация
    if (form.description.trim().length < SOURCING_DESCRIPTION_MIN_LENGTH) {
      setError(`Опишите задачу подробнее — минимум ${SOURCING_DESCRIPTION_MIN_LENGTH} символов`)
      return
    }
    const qtyNum = parseInt(form.qty, 10)
    if (!Number.isFinite(qtyNum) || qtyNum < 1) {
      setError('Укажите количество штук')
      return
    }

    setSubmitting(true)

    try {
      // 1. Регистрация (если гость)
      if (!isAuthenticated) {
        if (!form.consentPrivacy || !form.consentOffer) {
          setError('Согласия обязательны для отправки заявки')
          setSubmitting(false)
          return
        }

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
            const flat: Record<string, string> = {}
            for (const [k, v] of Object.entries(data.error.fields)) {
              const key = k.split('.').pop() ?? k
              flat[key] = v[0] ?? ''
            }
            setFieldErrors(flat)
          }
          setError(data?.error?.message ?? 'Не удалось зарегистрироваться')
          return
        }

        const signInRes = await signIn('credentials', {
          phone: form.phone,
          password: form.password,
          redirect: false,
        })
        if (signInRes?.error) {
          setError('Аккаунт создан, но не удалось войти. Попробуйте перезагрузить страницу.')
          return
        }
      }

      // 2. Создание заявки — отправляем multipart с описанием + фото
      const fd = new FormData()
      fd.append('description', form.description.trim())
      fd.append('qty', String(qtyNum))
      if (form.budget) {
        fd.append('budget_rub', String(parseFloat(form.budget)))
      }
      // Город доставки — берём из useCity (он же в шапке сайта)
      if (city?.slug) {
        fd.append('city_slug', city.slug)
      }
      form.photoFiles.forEach((file, idx) => {
        fd.append(`photo_${idx}`, file, file.name)
      })

      const res = await fetch('/api/sourcing-requests', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        setError(data?.error?.message ?? 'Не удалось отправить заявку')
        return
      }

      const data = (await res.json()) as { request: { number: string } }
      setSuccessNumber(data.request.number)
      // Сбрасываем форму
      setForm(initial)
    } catch (e) {
      console.error('Sourcing submit error:', e)
      setError('Что-то пошло не так. Попробуйте ещё раз через минуту.')
    } finally {
      setSubmitting(false)
    }
  }

  // SUCCESS view
  if (successNumber) {
    return (
      <div className="rounded-xl border border-positive/30 bg-positive/5 p-7 lg:p-10">
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-positive text-paper">
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
            <path
              d="M2 11L10 19L26 3"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="mb-3 font-display text-3xl font-light tracking-tight md:text-4xl">
          Заявка принята
        </h2>
        <p className="mb-2 inline-flex items-center gap-2.5 rounded-full border border-hair bg-surface-hi px-4 py-1.5 font-mono text-xs shadow-soft">
          <span className="uppercase tracking-wider text-ink-3 text-[10.5px]">Номер</span>
          <span className="font-display tnum text-base font-semibold">{successNumber}</span>
        </p>
        <p className="mt-4 mb-6 max-w-xl text-base leading-relaxed text-ink-2">
          Менеджер уже получил уведомление в Telegram. Наш сотрудник в Иу или Гуанчжоу
          проедет по фабрикам и пришлёт 2–3 варианта в течение 24 часов.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/account?tab=sourcing">
            <Button variant="primary">Мои заявки</Button>
          </Link>
          <Link href="/catalog">
            <Button variant="secondary">В каталог</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!hydrated || isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-xl bg-paper-2" />
        <div className="h-64 animate-pulse rounded-xl bg-paper-2" />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      {/* Описание */}
      <FormField className="mb-0">
        <Label htmlFor="description">Что нужно найти</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Например: журнальный столик из массива дуба, диаметр 80–90 см, в скандинавском стиле, MOQ от 20 штук. Готов рассмотреть похожие варианты."
          rows={5}
          required
          minLength={SOURCING_DESCRIPTION_MIN_LENGTH}
        />
        <FormHint>
          Чем подробнее опишете — тем точнее найдём. Габариты, материал, стиль, цвет, MOQ, бюджет.
        </FormHint>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField className="mb-0">
          <Label htmlFor="qty">Количество, шт</Label>
          <Input
            id="qty"
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            value={form.qty}
            onChange={(e) => update('qty', e.target.value)}
            placeholder="например, 50"
            required
          />
        </FormField>

        <FormField className="mb-0">
          <Label htmlFor="budget">Бюджет за штуку, ₽ (необязательно)</Label>
          <Input
            id="budget"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.budget}
            onChange={(e) => update('budget', e.target.value)}
            placeholder="например, 4000"
          />
        </FormField>
      </div>

      <FormField className="mb-0">
        <Label>Референсы (до 3 фото)</Label>
        <PhotoUploader
          onFilesChange={(files) => update('photoFiles', files)}
          disabled={submitting}
        />
      </FormField>

      {/* Блок регистрации для гостей */}
      {!isAuthenticated && (
        <>
          <hr className="border-hair" />

          <div>
            <h2 className="mb-4 font-display text-xl font-medium tracking-tight">
              Ваши контакты
            </h2>
            <p className="mb-5 text-sm text-ink-3">
              Нужно для связи. Создаём аккаунт автоматически — увидите статус заявки в личном кабинете.
            </p>

            <div className="mb-5">
              <SegmentControl<UserType>
                options={[
                  { value: 'physical', label: 'Физическое лицо' },
                  { value: 'legal', label: 'Юридическое лицо' },
                ]}
                value={form.type}
                onChange={(v) => update('type', v)}
              />
            </div>

            {form.type === 'legal' && (
              <fieldset className="mb-5 grid gap-4 rounded-lg border border-hair bg-paper p-5 sm:grid-cols-2">
                <FormField className="mb-0 sm:col-span-2">
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
                <FormField className="mb-0">
                  <Label htmlFor="inn">ИНН</Label>
                  <Input
                    id="inn"
                    value={form.inn}
                    onChange={(e) => update('inn', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    inputMode="numeric"
                    required
                  />
                  <FormError>{fieldErrors.inn}</FormError>
                </FormField>
                <FormField className="mb-0">
                  <Label htmlFor="ogrn">ОГРН / ОГРНИП</Label>
                  <Input
                    id="ogrn"
                    value={form.ogrn}
                    onChange={(e) => update('ogrn', e.target.value.replace(/\D/g, '').slice(0, 15))}
                    inputMode="numeric"
                    required
                  />
                  <FormError>{fieldErrors.ogrn}</FormError>
                </FormField>
              </fieldset>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField className="mb-0 sm:col-span-2">
                <Label htmlFor="name">
                  {form.type === 'legal' ? 'ФИО контактного лица' : 'Имя'}
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                />
              </FormField>
              <FormField className="mb-0">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+7 999 123-45-67"
                  required
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
                />
              </FormField>
              <FormField className="mb-0 sm:col-span-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="минимум 6 символов"
                  required
                  minLength={6}
                />
              </FormField>
            </div>

            <div className="mt-5 space-y-3 rounded-lg bg-paper-2 p-5">
              <Checkbox
                id="sc-privacy"
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
                id="sc-offer"
                checked={form.consentOffer}
                onChange={(v) => update('consentOffer', v)}
              >
                Принимаю условия{' '}
                <Link href="/legal/offer" target="_blank" className="text-cinnabar underline-offset-2 hover:underline">
                  публичной оферты
                </Link>
              </Checkbox>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-md border border-cinnabar/30 bg-cinnabar/5 px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
              <circle
                cx="7"
                cy="7"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="5 30"
                strokeLinecap="round"
              />
            </svg>
            Отправляем…
          </>
        ) : isAuthenticated ? (
          <>Отправить заявку на подбор</>
        ) : (
          <>Зарегистрироваться и отправить заявку</>
        )}
      </Button>

      <p className="text-center font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
        Ответим в течение 24 часов
      </p>
    </form>
  )
}
