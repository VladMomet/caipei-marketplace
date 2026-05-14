/**
 * Ticker — узкая чёрная полоса наверху страницы.
 * Показывает курс CNY, ETA контейнеров, и т.п. Создаёт ощущение «живого» B2B-канала.
 */

'use client'

import { useEffect, useState } from 'react'
import { CNY_TO_RUB } from '@/lib/constants'

const ITEMS = [
  `CNY/RUB · 1 ¥ = ${CNY_TO_RUB} ₽ · обновлено сегодня`,
  'Прямые поставки из Китая · ETA 14–45 дней · документы',
  'Опт от 10 шт · крупный опт от 2000 шт',
  'Иу + Гуанчжоу · наши люди на местах · 24 часа на подбор',
  'Цена с доставкой · ВЭД и сертификация · 152-ФЗ',
]

export function Ticker() {
  // Чередуем сообщения каждые 6 сек
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ITEMS.length), 6000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="bg-ink text-paper">
      <div className="container mx-auto flex h-9 max-w-[1480px] items-center justify-between px-6 lg:px-8">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/70">
          CaiPei · B2B · Опт · Китай → Россия
        </div>
        <div
          key={idx}
          className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-paper/85 animate-[fadeIn_500ms_ease]"
        >
          <span className="mr-2.5 inline-block h-1.5 w-1.5 align-middle rounded-full bg-cinnabar" />
          {ITEMS[idx]}
        </div>
      </div>
    </div>
  )
}
