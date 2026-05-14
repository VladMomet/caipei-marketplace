/**
 * getProductDetail — детальная информация о товаре по SKU.
 *
 * Возвращает null если не найден / архивирован.
 */

import { eq, asc } from 'drizzle-orm'
import { db } from '@/db'
import { products, productPhotos, categories, cities } from '@/db/schema'
import { calculateFullPrice } from '@/lib/pricing'

export interface ProductDetail {
  id: string
  sku: string
  title_ru: string
  title_cn: string | null
  description: string | null
  status: 'active' | 'archived'
  photos: Array<{ url: string; sortOrder: number; isMain: boolean }>
  price: {
    rub: number
    rub_volume: number
    volume_threshold_qty: number
    cny: number | null
    breakdown: { factory: number; logistics: number; customs: number; vat: number }
  }
  category: { slug: string; name_ru: string }
  size_text: string | null
  moq: string | null
  material: string | null
  style: string | null
  color: string | null
  delivery: {
    city: { id: string; slug: string; name_ru: string; name_acc: string | null }
    days_min: number
    days_max: number
  } | null
}

export async function getProductDetail(
  sku: string,
  citySlug?: string
): Promise<ProductDetail | null> {
  const [productRow] = await db
    .select({
      id: products.id,
      sku: products.sku,
      titleRu: products.titleRu,
      titleCn: products.titleCn,
      description: products.description,
      priceCnyWholesale: products.priceCnyWholesale,
      priceRub: products.priceRub,
      priceRubVolume: products.priceRubVolume,
      volumeThresholdQty: products.volumeThresholdQty,
      moq: products.moq,
      sizeText: products.sizeText,
      material: products.material,
      style: products.style,
      color: products.color,
      status: products.status,
      categorySlug: categories.slug,
      categoryNameRu: categories.nameRu,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.sku, sku))
    .limit(1)

  if (!productRow) return null

  const photos = await db
    .select({
      url: productPhotos.url,
      sortOrder: productPhotos.sortOrder,
      isMain: productPhotos.isMain,
    })
    .from(productPhotos)
    .where(eq(productPhotos.productId, productRow.id))
    .orderBy(asc(productPhotos.sortOrder))

  let city
  if (citySlug) {
    const [c] = await db.select().from(cities).where(eq(cities.slug, citySlug)).limit(1)
    city = c
  }
  if (!city) {
    const [c] = await db.select().from(cities).where(eq(cities.isDefault, true)).limit(1)
    city = c
  }

  const priceRub = Number(productRow.priceRub)
  const priceCny =
    productRow.priceCnyWholesale !== null ? Number(productRow.priceCnyWholesale) : null
  const fullPrice = calculateFullPrice(priceRub, priceCny)

  return {
    id: productRow.id,
    sku: productRow.sku,
    title_ru: productRow.titleRu,
    title_cn: productRow.titleCn,
    description: productRow.description,
    status: productRow.status,
    photos,
    price: {
      rub: fullPrice.rub,
      rub_volume: Number(productRow.priceRubVolume),
      volume_threshold_qty: productRow.volumeThresholdQty,
      cny: fullPrice.cny,
      breakdown: fullPrice.breakdown,
    },
    category: { slug: productRow.categorySlug, name_ru: productRow.categoryNameRu },
    size_text: productRow.sizeText,
    moq: productRow.moq,
    material: productRow.material,
    style: productRow.style,
    color: productRow.color,
    delivery: city
      ? {
          city: { id: city.id, slug: city.slug, name_ru: city.nameRu, name_acc: city.nameAcc },
          days_min: city.daysMin,
          days_max: city.daysMax,
        }
      : null,
  }
}
