/**
 * ManifestoSection — 4 пункта УТП.
 *
 * Цель: за 30 секунд донести, чем мы отличаемся от обычной серой закупки.
 */

const ITEMS = [
  {
    no: '01',
    title: 'Прозрачная цена сразу с доставкой',
    body:
      'В карточке вы видите итоговую сумму за единицу до Москвы. Логистика, ВЭД и НДС уже включены — никаких «плюс растаможка», «плюс доставка», «плюс наценка».',
  },
  {
    no: '02',
    title: '«В белую» с полным пакетом документов',
    body:
      'Контракт, инвойс, упаковочный лист, ДТ, сертификаты, СГР, счёт-фактура с НДС, ТТН. Всё для продаж на маркетплейсах по белой схеме и для бухгалтерии.',
  },
  {
    no: '03',
    title: 'Скидка от объёма',
    body:
      'Минимальная партия — от 10 шт. От 2000 шт цена ниже на 40% — крупный опт идёт без посредников. Экономию от объёма делим с вами.',
  },
  {
    no: '04',
    title: 'Наши люди в Иу и Гуанчжоу',
    body:
      'Если нужного нет в каталоге — оставляете заявку на подбор. Сотрудник в Китае находит 2–3 варианта в течение 24 часов с фотографиями и ценой.',
  },
]

export function ManifestoSection() {
  return (
    <section className="bg-paper">
      <div className="container mx-auto max-w-[1480px] px-6 py-20 lg:px-8 lg:py-28">
        <div className="mb-12 max-w-2xl lg:mb-16">
          <div className="mb-5 font-mono text-[10.5px] uppercase tracking-wider text-cinnabar">
            <span className="mr-2.5 inline-block h-px w-8 align-middle bg-cinnabar" />
            Почему нас выбирают селлеры и оптовики
          </div>
          <h2 className="font-display text-4xl font-light leading-[1.05] tracking-tight md:text-5xl lg:text-[64px]">
            Прямая поставка из Китая, как должно быть в&nbsp;2026 году
          </h2>
        </div>

        <ul className="grid gap-x-12 gap-y-12 lg:grid-cols-2 lg:gap-x-20 lg:gap-y-16">
          {ITEMS.map((item) => (
            <li key={item.no} className="grid grid-cols-[auto_1fr] gap-x-6 lg:gap-x-8">
              <div className="font-mono text-sm text-cinnabar">{item.no}</div>
              <div>
                <h3 className="mb-3 font-display text-2xl font-medium leading-tight tracking-tight lg:text-3xl">
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-ink-2">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
