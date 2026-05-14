/**
 * /catalog/[category] — каталог в рамках конкретной категории.
 *
 * SSR с проверкой существования категории (404 если не найдена).
 * Slug категории берётся из URL, добавляется в фильтры.
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { categories } from '@/db/schema'
import { queryCatalog } from '@/lib/queries/catalog'
import { CatalogView } from '../_components/catalog-view'
import { parseCatalogSearchParams } from '../_components/parse-params'

export const revalidate = 60

interface Props {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const [cat] = await db
    .select({ nameRu: categories.nameRu })
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1)

  if (!cat) return { title: 'Не найдено' }

  return {
    title: `${cat.nameRu} оптом из Китая`,
    description: `${cat.nameRu} напрямую с проверенных фабрик в Китае. Прозрачная цена с доставкой, ВЭД, документы.`,
  }
}

export default async function CatalogCategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params
  const sp = await searchParams

  // Проверим, что категория существует
  const [cat] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1)

  if (!cat) notFound()

  const query = parseCatalogSearchParams(sp, { category: slug })
  const data = await queryCatalog(query)

  return (
    <>
      <section className="border-b border-hair bg-paper">
        <div className="container mx-auto max-w-[1480px] px-6 py-10 lg:px-8 lg:py-14">
          <nav aria-label="Хлебные крошки" className="mb-5 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            <Link href="/" className="hover:text-ink transition-colors">
              Главная
            </Link>
            <span className="mx-2">·</span>
            <Link href="/catalog" className="hover:text-ink transition-colors">
              Каталог
            </Link>
            <span className="mx-2">·</span>
            <span className="text-ink">{cat.nameRu}</span>
          </nav>

          <h1 className="font-display text-4xl font-light tracking-tight md:text-5xl lg:text-[64px]">
            {cat.nameRu}
          </h1>
          <p className="mt-3 text-base text-ink-3">
            {data.total} позиций · цена с доставкой · документы
          </p>
        </div>
      </section>

      <CatalogView data={data} />
    </>
  )
}
