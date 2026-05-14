/**
 * SourcingSection — тёмный блок с CTA для персонального подбора.
 *
 * Полная форма (drag-n-drop фото и т.д.) живёт на /sourcing — это сделаем в Этапе 5.
 * Здесь — только посыл и кнопка.
 */

import Link from 'next/link'

export function SourcingSection() {
  return (
    <section className="bg-ink text-paper">
      <div className="container mx-auto max-w-[1480px] px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <div className="mb-5 font-mono text-[10.5px] uppercase tracking-wider text-cinnabar-3">
              <span className="mr-2.5 inline-block h-px w-8 align-middle bg-cinnabar-3" />
              Персональный подбор
            </div>
            <h2 className="mb-8 font-display text-4xl font-light leading-[1.05] tracking-tight md:text-5xl lg:text-[64px]">
              Не нашли нужного? <br />
              <span className="italic font-light text-cinnabar-3">Найдём.</span>
            </h2>
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-paper/80">
              Опишите что нужно: тип украшения или аксессуара, материал, стиль,
              желаемый бюджет. Прикрепите референсные фото. Сотрудник в Иу или
              Гуанчжоу проедет по фабрикам и через 24 часа пришлёт 2–3 варианта
              с ценой и фотографиями.
            </p>

            <Link
              href="/sourcing"
              className="inline-flex h-14 items-center gap-2 rounded-full bg-paper px-7 text-sm font-semibold text-ink transition-colors hover:bg-cinnabar hover:text-paper"
            >
              Заказать подбор
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Link>
          </div>

          {/* Правая колонка: процесс */}
          <ul className="space-y-7 lg:mt-2">
            {[
              { no: '01', title: 'Описание + референсы', body: 'Текст и до 3 фото в форме' },
              { no: '02', title: 'Поиск на месте', body: '24 часа · проверенные поставщики и рынки Иу' },
              { no: '03', title: '2–3 варианта с фото', body: 'С ценой, MOQ, сроками' },
              { no: '04', title: 'Производство и отправка', body: 'Если устроило — оформляем' },
            ].map((step) => (
              <li
                key={step.no}
                className="grid grid-cols-[auto_1fr] gap-x-5 border-b border-paper/15 pb-7 last:border-b-0 last:pb-0"
              >
                <div className="font-mono text-sm text-cinnabar-3">{step.no}</div>
                <div>
                  <div className="mb-1 font-display text-lg font-medium leading-tight">{step.title}</div>
                  <div className="text-sm text-paper/70">{step.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
