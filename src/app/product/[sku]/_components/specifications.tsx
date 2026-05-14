/**
 * Specifications — таблица характеристик товара.
 *
 * Server-component. Пустые поля → «уточните у менеджера».
 */

import { valueOrUnclear } from '@/lib/utils'

interface Props {
  sizeText: string | null
  material: string | null
  style: string | null
  color: string | null
  moq: string | null
  sku: string
}

export function Specifications({
  sizeText,
  material,
  style,
  color,
  moq,
  sku,
}: Props) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Размер', value: valueOrUnclear(sizeText) },
    { label: 'Материал', value: valueOrUnclear(material) },
    { label: 'Стиль', value: valueOrUnclear(style) },
    { label: 'Цвет', value: valueOrUnclear(color) },
    { label: 'MOQ (мин. партия)', value: valueOrUnclear(moq) },
    { label: 'Артикул', value: sku },
  ]

  return (
    <section>
      <h2 className="mb-5 font-display text-xl font-medium tracking-tight">
        Характеристики
      </h2>
      <dl className="divide-y divide-hair">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[160px_1fr] gap-4 py-3.5 lg:grid-cols-[200px_1fr]"
          >
            <dt className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              {row.label}
            </dt>
            <dd className="text-sm text-ink-2">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
