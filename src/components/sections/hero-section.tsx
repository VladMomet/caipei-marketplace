/**
 * HeroSection — editorial-герой главной.
 *
 * Слева: eyebrow «采配 — Sourcing Manifesto», крупный заголовок с курсивным
 *        акцентом, описание, две кнопки (Каталог + Подбор).
 * Справа: компактная карточка с одной фоткой (aspect 4/3), две статистики
 *        (категорий / дней до склада), и большая кнопка «Открыть каталог».
 */

import Link from 'next/link'

interface HeroPhoto {
  url: string
  alt: string
}

interface Props {
  totalCategories: number
  photos: HeroPhoto[]
}

function buildProxyUrl(url: string): string {
  if (url.startsWith('https://cbu')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

export function HeroSection({ totalCategories, photos }: Props) {
  const heroPhoto = photos[0]

  return (
    <section className="relative bg-paper">
      <div className="container mx-auto max-w-[1480px] px-5 pt-12 pb-14 sm:px-6 sm:pt-16 lg:px-8 lg:pt-24 lg:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          {/* Левый блок: текст */}
          <div>
            <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-tracked text-cinnabar">
              <span className="h-px w-7 bg-cinnabar" />
              采配 — Sourcing Manifesto
            </div>

            <h1 className="mb-7 font-display text-[44px] font-normal leading-[0.94] tracking-tightest sm:text-6xl md:text-7xl lg:text-[100px]">
              Украшения
              <br />
              и аксессуары
              <br />
              <span className="accent-italic text-cinnabar">из&nbsp;Китая</span>
              <span className="text-cinnabar">.</span>
            </h1>

            <p className="max-w-[540px] text-base leading-relaxed text-ink-2 sm:text-lg">
              Оптовая платформа для байеров и селлеров. Прозрачная цена сразу с доставкой
              в Россию, полный пакет документов и ВЭД, без сюрпризов на таможне.
            </p>
          </div>

          {/* Правый блок: компактная карточка-капсула */}
          <aside className="relative rounded-2xl bg-paper-2 p-4 shadow-soft">
            {/* Фото */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-paper-3">
              {heroPhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={buildProxyUrl(heroPhoto.url)}
                  alt={heroPhoto.alt}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              ) : null}

              {/* Печать 采 */}
              <div className="chinese-seal absolute left-3.5 top-3.5 h-11 w-11 text-xl">
                采
              </div>

              {/* Подпись */}
              <div className="absolute bottom-3.5 left-3.5 rounded-full bg-ink/55 px-3 py-1 font-mono text-[10px] uppercase tracking-tracked text-paper backdrop-blur">
                Подборка SS / 26
              </div>
            </div>

            {/* Статистика */}
            <div className="mt-4 grid grid-cols-2 gap-4 px-3.5 pt-1">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-tracked text-mute">
                  Категорий
                </div>
                <div className="tnum mt-1.5 font-display text-3xl font-medium leading-none">
                  {totalCategories}
                </div>
              </div>
              <div className="border-l border-hair pl-4">
                <div className="font-mono text-[10px] uppercase tracking-tracked text-mute">
                  Дней до склада
                </div>
                <div className="tnum mt-1.5 font-display text-3xl font-medium leading-none">
                  14—45
                </div>
              </div>
            </div>

            {/* Две кнопки */}
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/catalog"
                className="btn-primary h-12 px-6 text-xs uppercase tracking-tracked"
              >
                Открыть каталог
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3 7h8M7 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link
                href="/sourcing"
                className="btn-secondary h-11 px-6 text-xs uppercase tracking-tracked"
              >
                Персональный подбор
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
