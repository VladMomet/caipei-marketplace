/**
 * POST /api/orders — создание нового заказа.
 *
 * После успешной записи в БД отправляется Telegram-уведомление менеджеру.
 * Ошибка Telegram не блокирует создание заказа (только логируется).
 *
 * GET /api/orders — список заказов текущего пользователя.
 */

import { NextResponse } from 'next/server'
import { eq, inArray, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { orders, orderItems, products, cities, users, companies, productPhotos } from '@/db/schema'
import { createOrderSchema } from '@/lib/validation'
import { generateOrderNumber } from '@/lib/utils'
import { notifyNewOrder } from '@/lib/telegram'
import { calculateCartTotal } from '@/lib/pricing'
import { getCityMultiplier } from '@/lib/city-pricing'
import { siteConfig } from '@/lib/site-config'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Войдите, чтобы оформить заказ' } },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_JSON', message: 'Invalid JSON' } },
      { status: 400 }
    )
  }

  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Проверьте поля корзины',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  const input = parsed.data

  // Подгружаем актуальные данные товаров
  const productIds = input.items.map((i) => i.product_id)
  const productList = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds))

  if (productList.length !== productIds.length) {
    return NextResponse.json(
      {
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Один из товаров недоступен. Обновите корзину.',
        },
      },
      { status: 400 }
    )
  }

  // Подгружаем главные фотки для snapshot
  const mainPhotos = await db
    .select({ productId: productPhotos.productId, url: productPhotos.url })
    .from(productPhotos)
    .where(inArray(productPhotos.productId, productIds))

  const photoByProduct = new Map<string, string>()
  for (const p of mainPhotos) {
    if (!photoByProduct.has(p.productId)) {
      photoByProduct.set(p.productId, p.url)
    }
  }

  const productById = new Map(productList.map((p) => [p.id, p]))

  // Город
  const [city] = await db.select().from(cities).where(eq(cities.id, input.city_id)).limit(1)
  if (!city) {
    return NextResponse.json(
      { error: { code: 'CITY_NOT_FOUND', message: 'Город не найден' } },
      { status: 400 }
    )
  }

  // Применяем модификатор города + тарифную систему (опт от volume_threshold_qty).
  // Источник истины — цены в БД, клиенту не доверяем.
  const cityMult = getCityMultiplier(city.slug)
  const priceForProduct = (
    basePriceStr: string,
    volumePriceStr: string,
    threshold: number,
    qty: number
  ): number => {
    const base = qty >= threshold ? Number(volumePriceStr) : Number(basePriceStr)
    return Math.round((base * cityMult) / 10) * 10
  }

  // Считаем сумму
  const cartItems = input.items.map((item) => {
    const product = productById.get(item.product_id)!
    return {
      productId: product.id,
      qty: item.qty,
      priceRub: priceForProduct(
        product.priceRub,
        product.priceRubVolume,
        product.volumeThresholdQty,
        item.qty
      ),
    }
  })
  const { totalRub, unitsCount } = calculateCartTotal(cartItems)
  const number = generateOrderNumber()

  // Транзакция: orders + order_items
  const order = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({
        number,
        userId: session.user.id,
        deliveryCityId: city.id,
        status: 'new',
        siteTier: siteConfig.tier,
        totalRub: String(totalRub),
        unitsCount,
        comment: input.comment ?? null,
      })
      .returning()

    const itemsToInsert = input.items.map((item) => {
      const product = productById.get(item.product_id)!
      const unit = priceForProduct(
        product.priceRub,
        product.priceRubVolume,
        product.volumeThresholdQty,
        item.qty
      )
      return {
        orderId: created.id,
        productId: product.id,
        qty: item.qty,
        unitPriceRub: String(unit),
        totalPriceRub: String(unit * item.qty),
        snapshotTitle: product.titleRu,
        snapshotPhoto: photoByProduct.get(product.id) ?? null,
        snapshotSku: product.sku,
        snapshotSourceUrl: product.sourceUrl ?? null,
      }
    })
    await tx.insert(orderItems).values(itemsToInsert)
    return created
  })

  // Telegram-уведомление. Раньше было fire-and-forget (без await), но на serverless
  // Vercel функция может завершиться раньше чем fetch успеет уйти, поэтому ждём.
  console.log('[Order] Created in DB, number:', number)

  try {
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
    let company = null
    if (user?.type === 'legal') {
      const [c] = await db
        .select()
        .from(companies)
        .where(eq(companies.userId, user.id))
        .limit(1)
      company = c ?? null
    }

    if (!user) {
      console.error('[Order] User not found after creation, skipping Telegram. userId:', session.user.id)
    } else {
      console.log('[Order] Sending Telegram notification for order', number)
      await notifyNewOrder({
        number,
        userName: user.name,
        userPhone: user.phone,
        userType: user.type,
        companyName: company?.name,
        companyInn: company?.inn,
        cityName: city.nameRu,
        comment: input.comment ?? null,
        items: input.items.map((item) => {
          const product = productById.get(item.product_id)!
          const unit = priceForProduct(
            product.priceRub,
            product.priceRubVolume,
            product.volumeThresholdQty,
            item.qty
          )
          return {
            title: product.titleRu,
            qty: item.qty,
            unitPriceRub: unit,
            totalPriceRub: unit * item.qty,
            sourceUrl: product.sourceUrl ?? null,
          }
        }),
        totalRub,
      })
      console.log('[Order] Telegram notification sent for order', number)
    }
  } catch (e) {
    // Не валим заказ — он уже в БД, менеджер увидит его в админке (когда будет)
    console.error('[Order] Telegram notification failed:', e)
  }

  return NextResponse.json({
    order: {
      number: order.number,
      total_rub: Number(order.totalRub),
      status: order.status,
      units_count: order.unitsCount,
      created_at: order.createdAt,
    },
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const list = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))

  const orderIds = list.map((o) => o.id)
  const items =
    orderIds.length > 0
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : []

  const itemsByOrder = new Map<string, typeof items>()
  for (const it of items) {
    const arr = itemsByOrder.get(it.orderId) ?? []
    arr.push(it)
    itemsByOrder.set(it.orderId, arr)
  }

  return NextResponse.json(
    list.map((o) => ({
      number: o.number,
      status: o.status,
      total_rub: Number(o.totalRub),
      units_count: o.unitsCount,
      created_at: o.createdAt,
      comment: o.comment,
      items: (itemsByOrder.get(o.id) ?? []).map((it) => ({
        snapshot_title: it.snapshotTitle,
        snapshot_photo: it.snapshotPhoto,
        snapshot_sku: it.snapshotSku,
        qty: it.qty,
        unit_price_rub: Number(it.unitPriceRub),
        total_price_rub: Number(it.totalPriceRub),
      })),
    }))
  )
}
