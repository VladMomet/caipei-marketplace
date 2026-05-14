/**
 * useCity — хук выбора города доставки.
 *
 * Состояние хранится в cookie `yi_city` (slug, 1 год).
 * Список городов подгружается с /api/cities при первом монтировании
 * и кэшируется в sessionStorage до закрытия вкладки.
 *
 * При смене города:
 *  1. Записываем новый slug в cookie
 *  2. Диспатчим CustomEvent 'caipei:city-changed' с новым slug
 *  3. На него подписан useCart — пересчитывает priceRub всех товаров
 *     в localStorage из basePriceRub * мультипликатор города
 */

'use client'

import { useEffect, useState, useCallback } from 'react'

const COOKIE_NAME = 'yi_city'
const COOKIE_DAYS = 365
const CACHE_KEY = 'caipei-cities-cache'

export interface City {
  id: string
  slug: string
  nameRu: string
  nameAcc: string | null
  daysMin: number
  daysMax: number
  isDefault: boolean
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 86400_000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function readCache(): City[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(cities: City[]) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cities))
  } catch {
    /* silent */
  }
}

export function useCity() {
  const [cities, setCities] = useState<City[]>(() => readCache() ?? [])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() =>
    typeof document !== 'undefined' ? readCookie(COOKIE_NAME) : null
  )

  // ВАЖНО: каждый компонент вызывает useCity() и получает свой экземпляр
  // состояния (это просто хук, не Context). Поэтому когда один компонент
  // меняет город, остальные должны узнать об этом через событие.
  useEffect(() => {
    const onCityChange = (e: Event) => {
      const detail = (e as CustomEvent<{ slug?: string | null }>).detail
      if (detail?.slug !== undefined && detail.slug !== null) {
        setSelectedSlug(detail.slug)
      }
    }
    window.addEventListener('caipei:city-changed', onCityChange)
    return () => window.removeEventListener('caipei:city-changed', onCityChange)
  }, [])

  useEffect(() => {
    if (cities.length > 0) return
    let cancelled = false

    fetch('/api/cities')
      .then((r) => r.json())
      .then((data: Array<Record<string, unknown>>) => {
        if (cancelled || !Array.isArray(data)) return
        const list: City[] = data.map((c) => ({
          id: String(c.id),
          slug: String(c.slug),
          nameRu: String(c.nameRu ?? c.name_ru),
          nameAcc: (c.nameAcc ?? c.name_acc ?? null) as string | null,
          daysMin: Number(c.daysMin ?? c.days_min),
          daysMax: Number(c.daysMax ?? c.days_max),
          isDefault: Boolean(c.isDefault ?? c.is_default),
        }))
        setCities(list)
        writeCache(list)
      })
      .catch(() => {
        /* silent */
      })

    return () => {
      cancelled = true
    }
  }, [cities.length])

  const selected =
    cities.find((c) => c.slug === selectedSlug) ??
    cities.find((c) => c.isDefault) ??
    cities[0]

  const select = useCallback((slug: string) => {
    writeCookie(COOKIE_NAME, slug, COOKIE_DAYS)
    setSelectedSlug(slug)
    // Сигнал useCart, чтобы пересчитал цены в корзине
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('caipei:city-changed', { detail: { slug } }))
    }
  }, [])

  return { cities, selected, select }
}
