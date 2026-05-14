/**
 * GET /api/products — каталог с фильтрами и пагинацией.
 *
 * Все query-параметры см. в schema productsQuerySchema (lib/validation.ts).
 * Логика запроса — в lib/queries/catalog.ts (используется и server component'ами).
 */

import { NextResponse } from 'next/server'
import { productsQuerySchema } from '@/lib/validation'
import { queryCatalog } from '@/lib/queries/catalog'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = Object.fromEntries(url.searchParams.entries())

  const parsed = productsQuerySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Bad query params',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  const q = parsed.data

  const result = await queryCatalog({
    category: q.category,
    search: q.search,
    minPrice: q.min_price,
    maxPrice: q.max_price,
    materials: q.material ? q.material.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    styles: q.style ? q.style.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    sort: q.sort,
    page: q.page,
    perPage: q.per_page,
  })

  return NextResponse.json(result)
}
