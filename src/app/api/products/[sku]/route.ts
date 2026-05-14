/**
 * GET /api/products/[sku]?city=moscow — детальная карточка товара.
 *
 * Возвращает 404 / 410 / 200 как описано в брифе 6.3.
 * Логика — в lib/queries/product.ts.
 */

import { NextResponse } from 'next/server'
import { getProductDetail } from '@/lib/queries/product'

export async function GET(
  req: Request,
  context: { params: Promise<{ sku: string }> }
) {
  const { sku } = await context.params
  const url = new URL(req.url)
  const citySlug = url.searchParams.get('city') ?? undefined

  const product = await getProductDetail(sku, citySlug)

  if (!product) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Товар не найден' } },
      { status: 404 }
    )
  }

  if (product.status === 'archived') {
    return NextResponse.json(
      { error: { code: 'GONE', message: 'Товар архивирован' } },
      { status: 410 }
    )
  }

  return NextResponse.json(product)
}
