/**
 * /about — Доставка и ВЭД.
 *
 * Статичная страница: что входит в цену, сроки, документы, преимущества «белой» доставки.
 * Цель — дать байеру уверенность что мы не серая схема и не «доставщик из подвала».
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Доставка и ВЭД',
  description: `Как работает ${siteConfig.name}: цены сразу с доставкой, документы для бухгалтерии, ВЭД в белую. Сроки, маршруты, состав цены — без серых схем.`,
}

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-[1200px] px-6 py-14 lg:px-8 lg:py-20">
      {/* Hero */}
      <div className="mb-16 max-w-[820px] lg:mb-24">
        <div className="mb-6 font-mono text-[11px] uppercase tracking-wider text-ink-3">
          Доставка и ВЭД
        </div>
        <h1 className="mb-6 font-display text-4xl font-medium leading-[1.1] tracking-tight lg:text-6xl">
          Цена сразу <span className="text-cinnabar">с доставкой</span>. ВЭД в белую.
        </h1>
        <p className="text-lg leading-relaxed text-ink-2 lg:text-xl">
          Без скрытых наценок «на таможне», без посредников между вами и фабрикой. Каждая
          цена в каталоге — итоговая. Под каждый заказ вы получаете полный пакет документов
          для бухгалтерии и налоговой.
        </p>
      </div>

      {/* Состав цены */}
      <section className="mb-16 lg:mb-24">
        <h2 className="mb-8 font-display text-2xl font-medium tracking-tight lg:text-3xl">
          Что входит в цену
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              num: '01',
              title: 'Фабрики в Китае',
              text:
                'Цена производителя в юанях, конвертированная по курсу ЦБ РФ + 1,5%. Без накруток.',
            },
            {
              num: '02',
              title: 'Логистика КНР → РФ',
              text:
                'Авто, ж/д или мульти-модальная схема. Мы выбираем оптимальный маршрут под объём и срочность.',
            },
            {
              num: '03',
              title: 'Таможня и ВЭД',
              text:
                'Декларирование, пошлины, сертификаты соответствия (если требуются). Всё легально.',
            },
            {
              num: '04',
              title: 'НДС 20%',
              text:
                'Входит в итоговую цену. Получите счёт-фактуру для возврата НДС, если работаете с ним.',
            },
          ].map((item) => (
            <div
              key={item.num}
              className="rounded-xl border border-hair bg-surface-hi p-6 transition-colors hover:border-ink-2"
            >
              <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-cinnabar">
                {item.num}
              </div>
              <h3 className="mb-2 font-display text-lg font-medium tracking-tight">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-2">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Сроки */}
      <section className="mb-16 lg:mb-24">
        <h2 className="mb-8 font-display text-2xl font-medium tracking-tight lg:text-3xl">
          Сроки доставки
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { city: 'Москва, СПб', days: '14–48', mode: 'дней' },
            { city: 'Города-миллионники', days: '16–50', mode: 'дней' },
            { city: 'Регионы', days: '20–55', mode: 'дней' },
          ].map((item) => (
            <div
              key={item.city}
              className="rounded-xl border border-hair bg-surface-hi p-7"
            >
              <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-3">
                {item.city}
              </div>
              <div className="font-display text-4xl font-medium tracking-tight">
                {item.days} <span className="text-lg text-ink-3">{item.mode}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-3">
          Точный срок по конкретной позиции — в карточке товара. Зависит от наличия на
          фабрике, способа доставки и сезона.
        </p>
      </section>

      {/* Документы */}
      <section className="mb-16 lg:mb-24">
        <h2 className="mb-8 font-display text-2xl font-medium tracking-tight lg:text-3xl">
          Документы по итогу
        </h2>
        <div className="rounded-xl border border-hair bg-surface-hi p-8 lg:p-10">
          <ul className="grid gap-4 md:grid-cols-2">
            {[
              'Договор купли-продажи (РФ)',
              'Счёт-фактура с НДС',
              'УПД (универсальный передаточный документ)',
              'Таможенная декларация (по запросу)',
              'Сертификаты соответствия (если применимо)',
              'Транспортная накладная',
            ].map((doc) => (
              <li key={doc} className="flex items-start gap-3 text-base">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="mt-0.5 flex-none text-positive"
                >
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M6 10l3 3 5-6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Преимущества «белой» доставки */}
      <section className="mb-16 lg:mb-24">
        <h2 className="mb-8 font-display text-2xl font-medium tracking-tight lg:text-3xl">
          Почему «в белую» — выгоднее
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
          <div className="rounded-xl border border-hair bg-surface-hi p-7 lg:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-positive/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-wider text-positive">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
              CaiPei
            </div>
            <h3 className="mb-4 font-display text-xl font-medium tracking-tight">
              Прозрачная схема
            </h3>
            <ul className="space-y-3 text-sm text-ink-2">
              <li>· Договор и счёт-фактура для бухгалтерии</li>
              <li>· НДС можно зачесть</li>
              <li>· Таможенные риски на нас</li>
              <li>· Можно отнести на расходы для УСН/ОСН</li>
              <li>· Сертификаты для продажи розничным сетям</li>
            </ul>
          </div>
          <div className="rounded-xl border border-hair bg-surface-hi p-7 lg:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-ink-3/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-3" />
              «Карго» из чатов
            </div>
            <h3 className="mb-4 font-display text-xl font-medium tracking-tight text-ink-2">
              Серая схема
            </h3>
            <ul className="space-y-3 text-sm text-ink-3">
              <li>· Только чек или вообще ничего</li>
              <li>· НДС не зачтёшь</li>
              <li>· Если перехватили на таможне — товар ваш проблема</li>
              <li>· Не отнесёшь на расходы — попадаешь на налоги</li>
              <li>· Сети не примут без сертификатов</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-ink p-8 text-paper lg:p-12">
        <div className="mx-auto max-w-[680px] text-center">
          <h2 className="mb-4 font-display text-2xl font-medium tracking-tight lg:text-3xl">
            Не нашли в каталоге то, что нужно?
          </h2>
          <p className="mb-6 text-base text-paper/80 lg:text-lg">
            Отправьте заявку на персональный подбор — наш сотрудник в Китае найдёт фабрику
            под ваше ТЗ. Цена будет такая же прозрачная: товар + доставка + документы.
          </p>
          <Link
            href="/sourcing"
            className="inline-flex items-center gap-2 rounded-full bg-cinnabar px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-cinnabar/90"
          >
            Отправить заявку на подбор
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
