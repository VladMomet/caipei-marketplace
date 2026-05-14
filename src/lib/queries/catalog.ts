/**
 * queryCatalog — общая функция получения каталога товаров.
 *
 * Используется и в API /api/products, и в server component'ах /catalog.
 */

import { and, eq, gte, lte, inArray, desc, asc, sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { products, categories, productPhotos } from '@/db/schema'

export interface CatalogQuery {
  /** Slug одной категории (для legacy-страницы `/catalog/[category]`) */
  category?: string
  /** Множественный фильтр по slug категорий — `/catalog?category=serejki,braslety` */
  categories?: string[]
  search?: string
  minPrice?: number
  maxPrice?: number
  materials?: string[]
  styles?: string[]
  sort?: 'popular' | 'price-asc' | 'price-desc'
  page?: number
  perPage?: number
}

export interface CatalogItem {
  id: string
  sku: string
  title_ru: string
  /** Базовая цена за 1 шт (от MOQ до volume_threshold-1) */
  price_rub: number
  /** Цена за 1 шт при опте (от volume_threshold) */
  price_rub_volume: number
  /** Порог опта в штуках */
  volume_threshold_qty: number
  size_text: string | null
  moq: string | null
  material: string | null
  style: string | null
  color: string | null
  category: { slug: string; name_ru: string }
  photos: Array<{ url: string }>
}

export interface CatalogResult {
  items: CatalogItem[]
  total: number
  page: number
  per_page: number
  filters: {
    categories: Array<{ slug: string; name_ru: string; count: number }>
    materials: Array<{ value: string | null; count: number }>
    styles: Array<{ value: string | null; count: number }>
    price_range: { min: number; max: number }
  }
  category: { slug: string; name_ru: string } | null
}

export async function queryCatalog(q: CatalogQuery): Promise<CatalogResult> {
  const page = Math.max(1, q.page ?? 1)
  const perPage = Math.max(1, Math.min(60, q.perPage ?? 24))

  const conditions: SQL[] = [eq(products.status, 'active')]

  // Категория (single slug — приоритетнее множественного)
  let categoryRecord: { id: string; nameRu: string; slug: string } | null = null
  if (q.category) {
    const [cat] = await db
      .select({ id: categories.id, nameRu: categories.nameRu, slug: categories.slug })
      .from(categories)
      .where(eq(categories.slug, q.category))
      .limit(1)
    if (cat) {
      categoryRecord = cat
      conditions.push(eq(products.categoryId, cat.id))
    } else {
      return {
        items: [], total: 0, page, per_page: perPage,
        filters: { categories: [], materials: [], styles: [], price_range: { min: 0, max: 0 } },
        category: null,
      }
    }
  } else if (q.categories && q.categories.length > 0) {
    const cats = await db
      .select({ id: categories.id })
      .from(categories)
      .where(inArray(categories.slug, q.categories))
    if (cats.length > 0) {
      conditions.push(inArray(products.categoryId, cats.map((c) => c.id)))
    }
  }

  if (q.minPrice !== undefined) conditions.push(gte(products.priceRub, String(q.minPrice)))
  if (q.maxPrice !== undefined) conditions.push(lte(products.priceRub, String(q.maxPrice)))
  if (q.materials && q.materials.length > 0) {
    conditions.push(inArray(products.material, q.materials))
  }
  if (q.styles && q.styles.length > 0) {
    conditions.push(inArray(products.style, q.styles))
  }

  // Поиск: full-text + ILIKE fallback
  if (q.search) {
    const clean = q.search.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim()
    if (clean.length > 0) {
      const tsquery = clean.split(/\s+/).filter(Boolean).join(' & ')
      conditions.push(
        sql`(
          to_tsvector('russian',
            coalesce(${products.titleRu}, '') || ' ' ||
            coalesce(${products.description}, '') || ' ' ||
            coalesce(${products.material}, '') || ' ' ||
            coalesce(${products.style}, '')
          ) @@ to_tsquery('russian', ${tsquery})
          OR ${products.titleRu} ILIKE ${'%' + clean + '%'}
        )`
      )
    }
  }

  const whereClause = and(...conditions)

  let orderBy
  if (q.sort === 'price-asc') orderBy = [asc(products.priceRub)]
  else if (q.sort === 'price-desc') orderBy = [desc(products.priceRub)]
  else orderBy = [desc(products.sortScore), desc(products.createdAt)]

  const offset = (page - 1) * perPage

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      titleRu: products.titleRu,
      priceRub: products.priceRub,
      priceRubVolume: products.priceRubVolume,
      volumeThresholdQty: products.volumeThresholdQty,
      sizeText: products.sizeText,
      moq: products.moq,
      material: products.material,
      style: products.style,
      color: products.color,
      categorySlug: categories.slug,
      categoryNameRu: categories.nameRu,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(perPage)
    .offset(offset)

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(whereClause)
  const total = totalRow.count

  const productIds = rows.map((r) => r.id)
  const photos =
    productIds.length > 0
      ? await db
          .select({
            productId: productPhotos.productId,
            url: productPhotos.url,
            sortOrder: productPhotos.sortOrder,
          })
          .from(productPhotos)
          .where(inArray(productPhotos.productId, productIds))
          .orderBy(asc(productPhotos.sortOrder))
      : []

  const photosByProduct = new Map<string, Array<{ url: string }>>()
  for (const p of photos) {
    const arr = photosByProduct.get(p.productId) ?? []
    arr.push({ url: p.url })
    photosByProduct.set(p.productId, arr)
  }

  // Фасеты — считаем параллельно
  const facetBase: SQL[] = [eq(products.status, 'active')]
  if (categoryRecord) facetBase.push(eq(products.categoryId, categoryRecord.id))

  const categoriesFacetPromise: Promise<
    Array<{ slug: string; nameRu: string; count: number }>
  > = categoryRecord
    ? Promise.resolve([])
    : db
        .select({
          slug: categories.slug,
          nameRu: categories.nameRu,
          count: sql<number>`count(*)::int`,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.status, 'active'),
            ...(q.minPrice !== undefined ? [gte(products.priceRub, String(q.minPrice))] : []),
            ...(q.maxPrice !== undefined ? [lte(products.priceRub, String(q.maxPrice))] : []),
            ...(q.materials && q.materials.length > 0
              ? [inArray(products.material, q.materials)]
              : []),
            ...(q.styles && q.styles.length > 0 ? [inArray(products.style, q.styles)] : [])
          )
        )
        .groupBy(categories.slug, categories.nameRu, categories.sortOrder)
        .orderBy(asc(categories.sortOrder), asc(categories.nameRu))

  const materialsPromise = db
    .select({ value: products.material, count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...facetBase, sql`${products.material} IS NOT NULL`))
    .groupBy(products.material)
    .orderBy(desc(sql`count(*)`))
    .limit(15)

  const stylesPromise = db
    .select({ value: products.style, count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...facetBase, sql`${products.style} IS NOT NULL`))
    .groupBy(products.style)
    .orderBy(desc(sql`count(*)`))
    .limit(10)

  const priceRangePromise = db
    .select({
      min: sql<number>`coalesce(min(${products.priceRub}), 0)::int`,
      max: sql<number>`coalesce(max(${products.priceRub}), 0)::int`,
    })
    .from(products)
    .where(and(...facetBase))

  const [categoriesFacet, materials, styles, priceRangeRows] = await Promise.all([
    categoriesFacetPromise,
    materialsPromise,
    stylesPromise,
    priceRangePromise,
  ])
  const priceRange = priceRangeRows[0] ?? { min: 0, max: 0 }

  return {
    items: rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      title_ru: r.titleRu,
      price_rub: Number(r.priceRub),
      price_rub_volume: Number(r.priceRubVolume),
      volume_threshold_qty: r.volumeThresholdQty,
      size_text: r.sizeText,
      moq: r.moq,
      material: r.material,
      style: r.style,
      color: r.color,
      category: { slug: r.categorySlug, name_ru: r.categoryNameRu },
      photos: photosByProduct.get(r.id) ?? [],
    })),
    total,
    page,
    per_page: perPage,
    filters: {
      categories: categoriesFacet.map((c) => ({
        slug: c.slug,
        name_ru: c.nameRu,
        count: c.count,
      })),
      materials,
      styles,
      price_range: priceRange,
    },
    category: categoryRecord
      ? { slug: categoryRecord.slug, name_ru: categoryRecord.nameRu }
      : null,
  }
}
