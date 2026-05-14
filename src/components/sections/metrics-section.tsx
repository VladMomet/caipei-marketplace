/**
 * MetricsSection — 4 ключевых цифры/факта.
 */

interface Props {
  totalProducts: number
  totalCategories: number
}

export function MetricsSection({ totalProducts, totalCategories }: Props) {
  void totalProducts
  const items = [
    { value: 'от 10', label: 'Минимум на партию' },
    { value: `${totalCategories}`, label: 'Категорий' },
    { value: '14–45', label: 'Дней до склада' },
    { value: '100%', label: 'Документы для бухгалтерии' },
  ]

  return (
    <section className="border-y border-hair bg-paper-2">
      <div className="container mx-auto max-w-[1480px] px-6 py-10 lg:px-8 lg:py-14">
        <ul className="grid grid-cols-2 gap-y-8 lg:grid-cols-4">
          {items.map((it) => (
            <li key={it.label}>
              <div className="tnum mb-2 font-display text-4xl font-light tracking-tight lg:text-5xl">
                {it.value}
              </div>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                {it.label}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
