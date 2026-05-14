/**
 * /sourcing — персональный подбор.
 *
 * Server component. Hero + описание процесса в 4 шага + форма (клиентская).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SourcingForm } from './_components/sourcing-form'

export const metadata: Metadata = {
  title: 'Персональный подбор',
  description:
    'Не нашли нужного в каталоге? Опишите задачу — найдём за 24 часа. Наши люди в Иу и Гуанчжоу проедут по фабрикам и пришлют 2–3 варианта.',
}

const STEPS = [
  { no: '01', title: 'Описание + референсы', body: 'Текст и до 3 фото' },
  { no: '02', title: 'Поиск на месте', body: '24 часа · Иу + Гуанчжоу' },
  { no: '03', title: '2–3 варианта с фото', body: 'С ценой, MOQ, сроками' },
  { no: '04', title: 'Производство и отправка', body: 'Если устроило' },
]

export default function SourcingPage() {
  return (
    <>
      {/* Хлебные крошки */}
      <div className="border-b border-hair bg-paper">
        <div className="container mx-auto max-w-[1280px] px-6 py-5 lg:px-8 lg:py-6">
          <nav
            aria-label="Хлебные крошки"
            className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              Главная
            </Link>
            <span className="mx-2">·</span>
            <span className="text-ink">Персональный подбор</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-paper">
        <div className="container mx-auto max-w-[1280px] px-6 py-12 lg:px-8 lg:py-16">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-hair bg-surface-hi px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-2 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-cinnabar animate-pulse" />
            Ответим в течение 24 часов
          </div>
          <h1 className="mb-6 max-w-3xl font-display text-4xl font-light leading-[0.95] tracking-tight md:text-5xl lg:text-[80px]">
            Не нашли нужного?{' '}
            <span className="italic font-light text-cinnabar">Найдём.</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-ink-2">
            Опишите что нужно: габариты, материал, стиль, бюджет. Прикрепите
            референсные фото. Сотрудник в Иу или Гуанчжоу проедет по фабрикам и
            пришлёт 2–3 варианта с ценой, MOQ и сроками.
          </p>
        </div>
      </section>

      {/* Процесс */}
      <section className="border-y border-hair bg-paper-2">
        <div className="container mx-auto max-w-[1280px] px-6 py-10 lg:px-8 lg:py-12">
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.no} className="grid grid-cols-[auto_1fr] gap-x-4">
                <div className="font-mono text-sm text-cinnabar">{step.no}</div>
                <div>
                  <div className="mb-1 font-display text-base font-medium leading-tight tracking-tight">
                    {step.title}
                  </div>
                  <div className="text-sm text-ink-3">{step.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Форма */}
      <section className="bg-paper">
        <div className="container mx-auto max-w-[760px] px-6 py-12 lg:px-8 lg:py-16">
          <h2 className="mb-2 font-display text-2xl font-medium tracking-tight md:text-3xl">
            Опишите задачу
          </h2>
          <p className="mb-8 text-base text-ink-3">
            Чем подробнее — тем точнее найдём. Минимум 20 символов.
          </p>
          <SourcingForm />
        </div>
      </section>
    </>
  )
}
