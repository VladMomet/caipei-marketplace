/**
 * PriceBlock — главный блок цены на карточке товара.
 *
 * Большая цена с подписью «за единицу с доставкой в [город]».
 * Цена реактивно пересчитывается при смене города (useCity подписан на event).
 *
 * Раньше тут был блок «Как формируется цена» с раскладкой по фабрике/логистике/НДС
 * и юань-эквивалент. По решению владельца проекта — убрано, чтобы не плодить
 * лишних деталей на странице и не путать клиента.
 */

'use client'

import { useCity } from '@/hooks/use-city'
import { applyCityMultiplier } from '@/lib/city-pricing'
import { formatRub } from '@/lib/utils'

interface Props {
  rub: number
  /** Город для fallback, если useCity ещё не загрузился */
  cityName: string
}

export function PriceBlock({ rub, cityName }: Props) {
  const { selected: city } = useCity()

  // Цена с учётом города. Если город не выбран — базовая (Москва).
  const displayRub = applyCityMultiplier(rub, city?.slug)

  // Имя города из useCity, если он есть, иначе fallback с сервера
  const effectiveCityName = city?.nameAcc ?? city?.nameRu ?? cityName

  return (
    <div className="rounded-xl border border-hair bg-surface-hi p-6 lg:p-7">
      <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
        Цена за единицу
      </div>
      <div className="tnum font-display text-5xl font-medium leading-none tracking-tight lg:text-6xl">
        {formatRub(displayRub)}
      </div>
      <div className="mt-3 text-sm text-ink-3">
        С доставкой в {effectiveCityName}, документы включены
      </div>
    </div>
  )
}
