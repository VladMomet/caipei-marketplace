/**
 * CitySelector — кнопка «Доставка в Москву», открывает выбор города.
 *
 * Под каждым городом — пилл с модификатором цены: -5%, -1.5%, +10%, и т.д.
 * Это объясняет пользователю, почему выбор города влияет на цену.
 */

'use client'

import { useEffect, useState } from 'react'
import { useCity } from '@/hooks/use-city'
import { Sheet, SheetHeader, SheetTitle, SheetBody, SheetClose } from '@/components/ui/sheet'
import { getCityMultiplier } from '@/lib/city-pricing'
import { cn } from '@/lib/utils'

/** «-5%» / «+1%» / «базовая цена» */
function formatModifier(mult: number): { label: string; tone: 'discount' | 'markup' | 'neutral' } {
  if (Math.abs(mult - 1) < 0.001) return { label: 'базовая цена', tone: 'neutral' }
  const pct = (mult - 1) * 100
  const sign = pct > 0 ? '+' : ''
  // Один знак после запятой если не целое
  const rounded = Number.isInteger(pct * 10) ? pct.toFixed(1).replace(/\.0$/, '') : pct.toFixed(1)
  return {
    label: `${sign}${rounded}%`,
    tone: pct < 0 ? 'discount' : 'markup',
  }
}

export function CitySelector() {
  const { cities, selected, select } = useCity()
  const [open, setOpen] = useState(false)
  // На сервере useCity вернёт undefined (нет localStorage), на клиенте после
  // useEffect — реальный город. Чтобы гидрация совпала, до первого mount
  // отдаём тот же плейсхолдер, что и сервер.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const cityLabel = mounted
    ? selected?.nameAcc ?? selected?.nameRu ?? '—'
    : '—'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-surface-hi px-2.5 py-1.5 text-xs text-ink transition-colors hover:border-ink-2 sm:gap-2 sm:px-3.5 sm:py-2"
        aria-label="Выбрать город доставки"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 1.5c-2.2 0-4 1.8-4 4 0 2.8 4 7 4 7s4-4.2 4-7c0-2.2-1.8-4-4-4zM7 7a1.5 1.5 0
