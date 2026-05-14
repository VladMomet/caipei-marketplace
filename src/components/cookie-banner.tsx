/**
 * CookieBanner — баннер согласия на cookies.
 *
 * До нажатия «Принять все» — Yandex Metrica и любая другая аналитика
 * НЕ инициализируется. Согласие сохраняется в localStorage,
 * также серверу можно отправить запись в таблицу `consents` через API.
 *
 * Появляется через 2 сек после загрузки, если ещё не было согласия.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CONSENT_KEY = 'caipei-cookie-consent'

type ConsentValue = 'all' | 'essential' | null

function readConsent(): ConsentValue {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(CONSENT_KEY)
    return v === 'all' || v === 'essential' ? v : null
  } catch {
    return null
  }
}

function writeConsent(value: 'all' | 'essential') {
  try {
    window.localStorage.setItem(CONSENT_KEY, value)
  } catch {
    /* silent */
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (readConsent() !== null) return
    // Показываем баннер через 2 сек после загрузки
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  const accept = (value: 'all' | 'essential') => {
    writeConsent(value)
    setVisible(false)
    // Если согласие full — можно инициализировать Yandex Metrica здесь
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование cookie"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-[760px] rounded-xl border border-hair bg-surface-hi p-5 shadow-lift animate-[fadeIn_500ms_ease] md:inset-x-6 md:bottom-6 md:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex-1 text-sm leading-relaxed text-ink-2">
          Мы используем cookie для работы сайта и аналитики. Продолжая, вы соглашаетесь
          с{' '}
          <Link href="/legal/privacy" className="text-cinnabar underline-offset-2 hover:underline">
            политикой обработки персональных данных
          </Link>{' '}
          в соответствии с 152-ФЗ.
        </div>

        <div className="flex flex-shrink-0 gap-2.5">
          <Button onClick={() => accept('essential')} variant="secondary" size="sm">
            Только необходимые
          </Button>
          <Button onClick={() => accept('all')} variant="primary" size="sm">
            Принять все
          </Button>
        </div>
      </div>
    </div>
  )
}
