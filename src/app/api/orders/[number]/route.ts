/**
 * GET /api/orders/[number] — детали конкретного заказа (только для владельца).
 */

import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { orders, orderItems, cities } from '@/db/schema'

export async function GET(
  _req: Request,
  context: { params: Promise<{ number: string }> }
) {
  const { number } = await context.params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const [order] = await db
    .select({
      id: orders.id,
      number: orders.number,
      userId: orders.userId,
      status: orders.status,
      totalRub: orders.totalRub,
      unitsCount: orders.unitsCount,
      comment: orders.comment,
      createdAt: orders.createdAt,
      cityName: cities.nameRu,
      citySlug: cities.slug,
      daysMin: cities.daysMin,
      daysMax: cities.daysMax,
    })
    .from(orders)
    .innerJoin(cities, eq(orders.deliveryCityId, cities.id))
    .where(eq(orders.number, number))
    .limit(1)

  if (!order) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Заказ не найден' } },
      { status: 404 }
    )
  }
  if (order.userId !== session.user.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Нет доступа к этому заказу' } },
      { status: 403 }
    )
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))

  return NextResponse.json({
    order: {
      number: order.number,
      status: order.status,
      total_rub: Number(order.totalRub),
      units_count: order.unitsCount,
      comment: order.comment,
      created_at: order.createdAt,
      delivery: {
        city: { slug: order.citySlug, name_ru: order.cityName },
        days_min: order.daysMin,
        days_max: order.daysMax,
      },
    },
    items: items.map((it) => ({
      snapshot_title: it.snapshotTitle,
      snapshot_photo: it.snapshotPhoto,
      snapshot_sku: it.snapshotSku,
      qty: it.qty,
      unit_price_rub: Number(it.unitPriceRub),
      total_price_rub: Number(it.totalPriceRub),
    })),
  })
}
