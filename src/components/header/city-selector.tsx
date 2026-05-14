/**
 * CitySelector — кнопка «Доставка в Москву», открывает выбор города.
 *
 * Под каждым городом — пилл с модификатором цены: -5%, -1.5%, +10%, и т.д.
 * Это объясняет пользователю, почему выбор города влияет на цену.
 */

'use client'

import { useState } from 'react'
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-surface-hi px-2.5 py-1.5 text-xs text-ink transition-colors hover:border-ink-2 sm:gap-2 sm:px-3.5 sm:py-2"
        aria-label="Выбрать город доставки"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 1.5c-2.2 0-4 1.8-4 4 0 2.8 4 7 4 7s4-4.2 4-7c0-2.2-1.8-4-4-4zM7 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden md:inline">Доставка в</span>
        <span className="max-w-[80px] truncate font-semibold sm:max-w-none">
          {selected?.nameAcc ?? selected?.nameRu ?? '—'}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className="hidden sm:block"
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <Sheet open={open} onOpenChange={setOpen} side="right" widthClassName="w-[380px]">
        <SheetHeader>
          <SheetTitle>Город доставки</SheetTitle>
          <SheetClose onClose={() => setOpen(false)} />
        </SheetHeader>
        <SheetBody className="px-3 py-3 lg:px-4 lg:py-4">
          <p className="mb-3 px-2 text-[12.5px] leading-snug text-ink-3">
            Цена в каталоге уже включает доставку. В разные города стоимость
            логистики разная — итог зависит от выбранного города.
          </p>
          <ul>
            {cities.map((city) => {
              const isActive = city.slug === selected?.slug
              const mult = getCityMultiplier(city.slug)
              const mod = formatModifier(mult)

              return (
                <li key={city.id}>
                  <button
                    onClick={() => {
                      select(city.slug)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      isActive
                        ? 'bg-ink text-paper'
                        : 'bg-transparent text-ink hover:bg-paper-2'
                    )}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="truncate text-[14.5px] font-semibold leading-tight">
                        {city.nameRu}
                      </span>
                      <span
                        className={cn(
                          'font-mono text-[10px] uppercase tracking-wider',
                          isActive ? 'text-paper/60' : 'text-ink-3'
                        )}
                      >
                        {city.daysMin}–{city.daysMax} дн.
                      </span>
                    </div>

                    <span
                      className={cn(
                        'tnum shrink-0 rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold',
                        isActive
                          ? 'bg-paper/20 text-paper'
                          : mod.tone === 'discount'
                          ? 'bg-positive/12 text-positive'
                          : mod.tone === 'markup'
                          ? 'bg-cinnabar/12 text-cinnabar'
                          : 'bg-paper-2 text-ink-3'
                      )}
                    >
                      {mod.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </SheetBody>
      </Sheet>
    </>
  )
}
