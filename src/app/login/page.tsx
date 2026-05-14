/**
 * /login — страница входа в личный кабинет.
 *
 * Регистрация — отдельный flow на /checkout (Этап 4).
 * Здесь только вход по уже существующим credentials.
 */

'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input, Label, FormField, FormError, FormHint } from '@/components/ui/input'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/account'

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const res = await signIn('credentials', { phone, password, redirect: false })
    setSubmitting(false)

    if (res?.error) {
      setError('Не удалось войти. Проверьте телефон и пароль.')
      return
    }
    router.push(callbackUrl)
  }

  return (
    <form onSubmit={onSubmit}>
      <FormField>
        <Label htmlFor="phone">Телефон</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+7 999 123-45-67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
        />
      </FormField>

      <FormField>
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <FormHint>
          Забыли пароль? Напишите менеджеру — сброс пароля делается вручную, см. политику.
        </FormHint>
      </FormField>

      {error && (
        <div className="mb-4 rounded-md border border-cinnabar/30 bg-cinnabar/5 px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
        {submitting ? 'Входим…' : 'Войти'}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="container mx-auto max-w-md px-6 py-20 lg:py-28">
      <div className="rounded-xl border border-hair bg-surface-hi p-8 shadow-soft lg:p-10">
        <h1 className="mb-2 font-display text-3xl font-medium tracking-tight">Вход</h1>
        <p className="mb-7 text-sm text-ink-3">
          Ещё нет аккаунта? Он создаётся автоматически при первом заказе или заявке.
        </p>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-surface" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-ink-3">
          <Link href="/catalog" className="hover:text-ink transition-colors">
            ← Вернуться в каталог
          </Link>
        </p>
      </div>
    </div>
  )
}
