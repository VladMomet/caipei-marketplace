/**
 * CategoriesSection — крупная сетка плиток категорий.
 *
 * Каждая плитка ведёт в /catalog/[slug] и показывает количество товаров.
 */

import Link from 'next/link'

interface Category {
  slug: string
  nameRu: string
  productCount: number
}

interface Props {
  categories: Category[]
}

export function CategoriesSection({ categories }: Props) {
  return (
    <section className="border-y border-hair bg-paper-2">
      <div className="container mx-auto max-w-[1480px] px-6 py-16 lg:px-8 lg:py-24">
        <div className="mb-10 flex items-end justify-between gap-6 lg:mb-14">
          <div>
            <div className="mb-4 font-mono text-[10.5px] uppercase tracking-wider text-cinnabar">
              <span className="mr-2.5 inline-block h-px w-8 align-middle bg-cinnabar" />
              Каталог
            </div>
            <h2 className="font-display text-3xl font-light tracking-tight md:text-4xl lg:text-5xl">
              {categories.length} категорий
            </h2>
          </div>
          <Link
            href="/catalog"
            className="hidden items-center gap-2 text-sm text-ink hover:text-cinnabar transition-colors md:inline-flex"
          >
            Все категории
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/catalog/${cat.slug}`}
                className="group flex h-full items-center justify-between rounded-lg border border-hair bg-surface-hi p-5 transition-all duration-200 hover:border-ink-2 hover:shadow-soft"
              >
                <div className="font-display text-base font-medium leading-snug tracking-tight">
                  {cat.nameRu}
                </div>
                <div className="ml-3 flex items-center gap-2 font-mono text-[10.5px] text-ink-3 group-hover:text-ink">
                  {cat.productCount}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/catalog"
          className="mt-10 inline-flex items-center gap-2 text-sm text-ink hover:text-cinnabar transition-colors md:hidden"
        >
          Все категории
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
