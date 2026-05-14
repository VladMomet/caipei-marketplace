/**
 * ProfileTab — данные пользователя + смена пароля + logout.
 *
 * Две независимые формы. После любого update показываем success-индикацию.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input, Label, FormField, FormError, FormHint } from '@/components/ui/input'

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

export function ProfileTab() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/users/me/profile')
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-xl bg-paper-2" />
        <div className="h-40 animate-pulse rounded-xl bg-paper-2" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-md border border-cinnabar/30 bg-cinnabar/5 p-4 text-sm text-cinnabar">
        Не удалось загрузить профиль
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ContactForm
        initial={user}
        company={company}
        onSaved={(u, c) => {
          setUser((prev) => (prev ? { ...prev, ...u } : prev))
          if (c) setCompany(c)
        }}
      />

      <PasswordForm />

      <section className="rounded-xl border border-hair bg-surface-hi p-6">
        <h2 className="mb-2 font-display text-lg font-medium tracking-tight">Выход</h2>
        <p className="mb-5 text-sm text-ink-3">
          Завершить текущую сессию. Заказы и заявки сохраняются.
        </p>
        <Button
          variant="secondary"
          onClick={async () => {
            await signOut({ redirect: false })
            router.push('/')
          }}
        >
          Выйти из аккаунта
        </Button>
      </section>
    </div>
  )
}

/* ─── Contact + Company form ─────────────────────────────────────── */

function ContactForm({
  initial,
  company,
  onSaved,
}: {
  initial: UserProfile
  company: CompanyProfile | null
  onSaved: (user: Partial<UserProfile>, company?: CompanyProfile) => void
}) {
  const [name, setName] = useState(initial.name)
  const [phone, setPhone] = useState(initial.phone)
  const [email, setEmail] = useState(initial.email ?? '')

  const [companyName, setCompanyName] = useState(company?.name ?? '')
  const [inn, setInn] = useState(company?.inn ?? '')
  const [kpp, setKpp] = useState(company?.kpp ?? '')
  const [ogrn, setOgrn] = useState(company?.ogrn ?? '')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSuccess(false)
    setSubmitting(true)

    const body: Record<string, unknown> = { name, phone, email: email || null }
    if (initial.type === 'legal') {
      body.company = {
        name: companyName,
        inn,
        kpp: kpp || null,
        ogrn,
      }
    }

    try {
      const res = await fetch('/api/users/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string; fields?: Record<string, string[]> }
        } | null
        if (data?.error?.fields) {
          const flat: Record<string, string> = {}
          for (const [k, v] of Object.entries(data.error.fields)) {
            const key = k.split('.').pop() ?? k
            flat[key] = v[0] ?? ''
          }
          setFieldErrors(flat)
        }
        setError(data?.error?.message ?? 'Не удалось сохранить')
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
      onSaved(
        { name, phone, email: email || null },
        initial.type === 'legal'
          ? { name: companyName, inn, kpp: kpp || null, ogrn }
          : undefined
      )
    } catch {
      setError('Сеть недоступна, попробуйте позже')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-hair bg-surface-hi p-6">
      <header className="mb-5">
        <h2 className="font-display text-lg font-medium tracking-tight">
          {initial.type === 'legal' ? 'Реквизиты и контакты' : 'Контактные данные'}
        </h2>
        <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
          {initial.type === 'legal' ? 'Юридическое лицо' : 'Физическое лицо'}
        </p>
      </header>

      {initial.type === 'legal' && (
        <fieldset className="mb-5 grid gap-4 border-b border-hair pb-5 sm:grid-cols-2">
          <FormField className="mb-0 sm:col-span-2">
            <Label htmlFor="companyName">Наименование</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
            <FormError>{fieldErrors.name}</FormError>
          </FormField>

          <FormField className="mb-0">
            <Label htmlFor="inn">ИНН</Label>
            <Input
              id="inn"
              value={inn}
              onChange={(e) => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))}
              inputMode="numeric"
              required
            />
            <FormError>{fieldErrors.inn}</FormError>
          </FormField>

          <FormField className="mb-0">
            <Label htmlFor="kpp">КПП</Label>
            <Input
              id="kpp"
              value={kpp}
              onChange={(e) => setKpp(e.target.value.replace(/\D/g, '').slice(0, 9))}
              inputMode="numeric"
            />
            <FormError>{fieldErrors.kpp}</FormError>
          </FormField>

          <FormField className="mb-0 sm:col-span-2">
            <Label htmlFor="ogrn">ОГРН / ОГРНИП</Label>
            <Input
              id="ogrn"
              value={ogrn}
              onChange={(e) => setOgrn(e.target.value.replace(/\D/g, '').slice(0, 15))}
              inputMode="numeric"
              required
            />
            <FormError>{fieldErrors.ogrn}</FormError>
          </FormField>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField className="mb-0 sm:col-span-2">
          <Label htmlFor="name">{initial.type === 'legal' ? 'ФИО контактного лица' : 'Имя'}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <FormError>{fieldErrors.name && initial.type === 'physical' ? fieldErrors.name : null}</FormError>
        </FormField>

        <FormField className="mb-0">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <FormError>{fieldErrors.phone}</FormError>
        </FormField>

        <FormField className="mb-0">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormError>{fieldErrors.email}</FormError>
          {!email && (
            <FormHint>Без email сброс пароля только через менеджера</FormHint>
          )}
        </FormField>
      </div>

      {error && (
        <div className="mt-5 rounded-md border border-cinnabar/30 bg-cinnabar/5 px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-5 rounded-md border border-positive/30 bg-positive/5 px-4 py-3 text-sm text-positive">
          Сохранено
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Сохраняем…' : 'Сохранить'}
        </Button>
      </div>
    </form>
  )
}

/* ─── Password form ────────────────────────────────────────────── */

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)

    try {
      const res = await fetch('/api/users/me/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        setError(data?.error?.message ?? 'Не удалось изменить пароль')
        return
      }
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => setSuccess(false), 2500)
    } catch {
      setError('Сеть недоступна, попробуйте позже')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-hair bg-surface-hi p-6">
      <h2 className="mb-5 font-display text-lg font-medium tracking-tight">Смена пароля</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField className="mb-0">
          <Label htmlFor="cp">Текущий пароль</Label>
          <Input
            id="cp"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </FormField>
        <FormField className="mb-0">
          <Label htmlFor="np">Новый пароль</Label>
          <Input
            id="np"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <FormHint>Минимум 6 символов</FormHint>
        </FormField>
      </div>

      {error && (
        <div className="mt-5 rounded-md border border-cinnabar/30 bg-cinnabar/5 px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-5 rounded-md border border-positive/30 bg-positive/5 px-4 py-3 text-sm text-positive">
          Пароль изменён
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Меняем…' : 'Изменить пароль'}
        </Button>
      </div>
    </form>
  )
}
