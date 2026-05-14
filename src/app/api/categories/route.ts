/**
 * GET /api/categories — категории с количеством активных товаров.
 */

import { NextResponse } from 'next/server'
import { sql, asc, eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { categories, products } from '@/db/schema'

export async function GET() {
  const result = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      nameRu: categories.nameRu,
      sortOrder: categories.sortOrder,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.status, 'active'))
    )
    .where(eq(categories.isActive, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder))

  return NextResponse.json(result)
}
