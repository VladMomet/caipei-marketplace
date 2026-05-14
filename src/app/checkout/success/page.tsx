/**
 * /checkout/success?order=CP-XXXXXX
 *
 * Экран успеха после создания заказа. Показывает номер,
 * объясняет что будет дальше, ведёт в личный кабинет или каталог.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Заказ принят',
  robots: { index: false, follow: false },
}

const STEPS = [
  {
    no: '01',
    title: 'Менеджер свяжется в течение часа',
    body: 'По телефону, который вы оставили. Уточнит детали, MOQ, варианты материалов и цвета, если они не были указаны в карточке.',
  },
  {
    no: '02',
    title: 'Выставим счёт',
    body: 'После согласования всех деталей пришлём счёт на оплату по безналу на юр.лицо.',
  },
  {
    no: '03',
    title: 'Производство и логистика',
    body: 'Фабрика делает, контейнер едет, мы оформляем ВЭД. Вы видите статус в личном кабинете.',
  },
  {
    no: '04',
    title: 'Доставка с документами',
    body: 'До вашего города в указанные сроки. Полный пакет документов для бухгалтерии и маркетплейсов.',
  },
]

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const sp = await searchParams
  const orderNumber = sp.order ?? ''

  return (
    <div className="container mx-auto max-w-3xl px-6 py-16 lg:px-8 lg:py-24">
      {/* Большая галочка */}
      <div className="mb-10 grid place-items-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-positive text-paper">
          <svg width="32" height="26" viewBox="0 0 32 26" fill="none">
            <path
              d="M2 13L11 22L30 3"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <header className="mb-12 text-center">
        <h1 className="mb-4 font-display text-4xl font-light leading-tight tracking-tight md:text-5xl lg:text-[56px]">
          Заказ принят
        </h1>
        {orderNumber && (
          <p className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-hair bg-surface-hi px-5 py-2 font-mono text-sm shadow-soft">
            <span className="text-ink-3 uppercase tracking-wider text-[10.5px]">Номер</span>
            <span className="font-display tnum text-lg font-semibold">{orderNumber}</span>
          </p>
        )}
        <p className="mx-auto max-w-xl text-base leading-relaxed text-ink-3">
          Заказ создан, менеджер уже получил уведомление в Telegram. Свяжемся с вами
          в течение часа.
        </p>
      </header>

      {/* Что дальше */}
      <section className="mb-12 rounded-xl border border-hair bg-surface-hi p-6 lg:p-10">
        <h2 className="mb-7 font-mono text-[10.5px] uppercase tracking-wider text-cinnabar">
          <span className="mr-2.5 inline-block h-px w-8 align-middle bg-cinnabar" />
          Что дальше
        </h2>
        <ol className="grid gap-7 md:grid-cols-2">
          {STEPS.map((step) => (
            <li key={step.no} className="grid grid-cols-[auto_1fr] gap-x-5">
              <div className="font-mono text-sm text-cinnabar">{step.no}</div>
              <div>
                <h3 className="mb-1.5 font-display text-base font-medium leading-snug tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-3">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/account"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-cinnabar transition-colors"
        >
          В личный кабинет
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Link>
        <Link
          href="/catalog"
          className="inline-flex h-12 items-center rounded-full border border-ink-2 px-6 text-sm font-semibold text-ink hover:bg-ink hover:text-paper transition-colors"
        >
          Вернуться в каталог
        </Link>
      </div>

      <p className="mt-12 text-center font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
        Если в течение часа никто не связался — напишите менеджеру напрямую
      </p>
    </div>
  )
}
