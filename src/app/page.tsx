/**
 * Главная страница.
 *
 * SSR: подгружает счётчики и 4 случайных фото для коллажа в hero,
 * категории для секции каталога.
 */

import { db } from '@/db'
import { products, categories, productPhotos } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { HeroSection } from '@/components/sections/hero-section'
import { MetricsSection } from '@/components/sections/metrics-section'
import { ManifestoSection } from '@/components/sections/manifesto-section'
import { CategoriesSection } from '@/components/sections/categories-section'
import { SourcingSection } from '@/components/sections/sourcing-section'

export const revalidate = 300 // ISR: страница перегенерируется не чаще 1 раза в 5 минут

export default async function HomePage() {
  // Параллельные запросы
  const [stats, categoriesCount, categoryList, heroPhotos] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.status, 'active'))
      .then((r) => r[0]),

    db
      .select({ total: sql<number>`count(*)::int` })
      .from(categories)
      .where(eq(categories.isActive, true))
      .then((r) => r[0]),

    db
      .select({
        slug: categories.slug,
        nameRu: categories.nameRu,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(categories)
      .leftJoin(
        products,
        and(eq(products.categoryId, categories.id), eq(products.status, 'active'))
      )
      .where(eq(categories.isActive, true))
      .groupBy(categories.id)
      .orderBy(desc(sql`count(${products.id})`)),

    // 4 случайных «главных» фото для коллажа
    db
      .select({
        url: productPhotos.url,
        title: products.titleRu,
      })
      .from(productPhotos)
      .innerJoin(products, eq(productPhotos.productId, products.id))
      .where(and(eq(productPhotos.isMain, true), eq(products.status, 'active')))
      .orderBy(sql`random()`)
      .limit(4),
  ])

  return (
    <>
      <HeroSection
        totalCategories={categoriesCount?.total ?? 0}
        photos={heroPhotos.map((p) => ({ url: p.url, alt: p.title }))}
      />
      <MetricsSection
        totalProducts={stats?.total ?? 0}
        totalCategories={categoriesCount?.total ?? 0}
      />
      <ManifestoSection />
      <CategoriesSection categories={categoryList} />
      <SourcingSection />
    </>
  )
}
