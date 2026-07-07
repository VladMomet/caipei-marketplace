/**
 * sitemap.xml — динамический, зависит от текущего сайта.
 *
 * Включает: главную, каталог, страницы категорий и товаров, about, sourcing.
 */

import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { siteConfig } from '@/lib/site-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteConfig.origin}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteConfig.origin}/catalog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteConfig.origin}/sourcing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteConfig.origin}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.origin}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteConfig.origin}/legal/offer`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteConfig.origin}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const cats = await db.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories)
    const catPages: MetadataRoute.Sitemap = cats.map((c) => ({
      url: `${siteConfig.origin}/catalog/${c.slug}`,
      lastModified: c.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    const prods = await db
      .select({ sku: products.sku, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.status, 'active'))
    const prodPages: MetadataRoute.Sitemap = prods.map((p) => ({
      url: `${siteConfig.origin}/product/${p.sku}`,
      lastModified: p.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticPages, ...catPages, ...prodPages]
  } catch (e) {
    console.error('[sitemap] Failed to load dynamic entries:', e)
    return staticPages
  }
}
