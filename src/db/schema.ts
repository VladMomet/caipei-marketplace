/**
 * CaiPei Marketplace — Drizzle schema
 *
 * Все таблицы и enum-типы из брифа, раздел 4.
 *
 * При изменении схемы:
 *   1. Отредактируйте этот файл
 *   2. npm run db:generate  — сгенерирует SQL миграцию в /drizzle
 *   3. npm run db:migrate   — применит миграцию к БД
 *
 * Для быстрой синхронизации в dev: npm run db:push (без миграций, прямой apply)
 */

import { relations } from 'drizzle-orm'
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  inet,
  index,
  uniqueIndex,
  check,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/* ─────────────────────────────────────────────────────────────────────
   ENUMS
   ─────────────────────────────────────────────────────────────────── */

export const userTypeEnum = pgEnum('user_type', ['physical', 'legal'])

export const productStatusEnum = pgEnum('product_status', ['active', 'archived'])

export const orderStatusEnum = pgEnum('order_status', [
  'new',
  'in_progress',
  'completed',
  'cancelled',
])

export const sourcingStatusEnum = pgEnum('sourcing_status', [
  'new',
  'in_progress',
  'completed',
  'cancelled',
])

/**
 * Тариф сайта — на каком из 3 сайтов был создан заказ или заявка.
 * Позволяет менеджерам различать источник, а нам — считать конверсию по тарифу.
 */
export const siteTierEnum = pgEnum('site_tier', ['lite', 'standard', 'prestige'])

/* ─────────────────────────────────────────────────────────────────────
   USERS & AUTH
   ─────────────────────────────────────────────────────────────────── */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    type: userTypeEnum('type').notNull(),
    phone: varchar('phone', { length: 20 }).notNull().unique(),
    email: varchar('email', { length: 255 }).unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    phoneIdx: index('users_phone_idx').on(t.phone),
    emailIdx: index('users_email_idx').on(t.email).where(sql`${t.email} IS NOT NULL`),
  })
)

/** Реквизиты юр. лица (1:1 с users, если type='legal') */
export const companies = pgTable('companies', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 500 }).notNull(),
  inn: varchar('inn', { length: 12 }).notNull(),
  kpp: varchar('kpp', { length: 9 }),
  ogrn: varchar('ogrn', { length: 15 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Лог согласий на обработку ПД (требование 152-ФЗ) */
export const consents = pgTable(
  'consents',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    consentType: varchar('consent_type', { length: 50 }).notNull(), // 'privacy' | 'offer' | 'cookies' | 'withdrawn'
    consentedAt: timestamp('consented_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
  },
  (t) => ({
    userIdx: index('consents_user_idx').on(t.userId),
  })
)

/* ─────────────────────────────────────────────────────────────────────
   CATALOG
   ─────────────────────────────────────────────────────────────────── */

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  nameRu: varchar('name_ru', { length: 200 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
})

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    offerId: varchar('offer_id', { length: 50 }).notNull().unique(), // offerId с 1688
    sku: varchar('sku', { length: 50 }).notNull().unique(), // CP-{number}
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),

    // Тексты
    titleRu: varchar('title_ru', { length: 500 }).notNull(),
    titleCn: varchar('title_cn', { length: 500 }),
    description: text('description'),

    // Цена: два тарифа.
    //   priceRub          — базовая цена за 1 шт (за партию от MOQ до volume_threshold-1)
    //   priceRubVolume    — цена за 1 шт при опте (от volume_threshold_qty)
    //   volumeThresholdQty — порог опта (по умолчанию 2000 шт)
    priceCnyWholesale: numeric('price_cny_wholesale', { precision: 12, scale: 2 }),
    priceRub: numeric('price_rub', { precision: 12, scale: 2 }).notNull(),
    priceRubVolume: numeric('price_rub_volume', { precision: 12, scale: 2 }).notNull(),
    volumeThresholdQty: integer('volume_threshold_qty').notNull().default(2000),

    // Спецификации (всё nullable — UI заменит пустые на "уточните у менеджера")
    moq: varchar('moq', { length: 50 }),
    sizeText: varchar('size_text', { length: 200 }), // для украшений: длина цепочки, размер браслета и т.п.
    material: varchar('material', { length: 300 }),
    style: varchar('style', { length: 300 }),
    color: varchar('color', { length: 100 }),

    // Метаданные с 1688 (НЕ показываем на фронте)
    sourceUrl: text('source_url'),

    // Статус и сортировка
    status: productStatusEnum('status').notNull().default('active'),
    sortScore: integer('sort_score').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index('products_category_idx')
      .on(t.categoryId)
      .where(sql`${t.status} = 'active'`),
    priceIdx: index('products_price_idx')
      .on(t.priceRub)
      .where(sql`${t.status} = 'active'`),
    // Full-text search index (на русском)
    searchIdx: index('products_search_idx').using(
      'gin',
      sql`to_tsvector('russian',
        coalesce(${t.titleRu}, '') || ' ' ||
        coalesce(${t.description}, '') || ' ' ||
        coalesce(${t.material}, '') || ' ' ||
        coalesce(${t.style}, '')
      )`
    ),
  })
)

export const productPhotos = pgTable(
  'product_photos',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(), // прямой URL c cbu01.alicdn.com (проксируется через /api/img-proxy)
    sortOrder: integer('sort_order').notNull().default(0),
    isMain: boolean('is_main').notNull().default(false),
  },
  (t) => ({
    productSortIdx: index('product_photos_product_sort_idx').on(t.productId, t.sortOrder),
  })
)

export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  nameRu: varchar('name_ru', { length: 200 }).notNull(),
  nameAcc: varchar('name_acc', { length: 200 }), // винительный падеж для UI: «в Москву»
  daysMin: integer('days_min').notNull(),
  daysMax: integer('days_max').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
})

/* ─────────────────────────────────────────────────────────────────────
   ORDERS
   ─────────────────────────────────────────────────────────────────── */

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    number: varchar('number', { length: 20 }).notNull().unique(), // CP-123456
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    deliveryCityId: uuid('delivery_city_id')
      .notNull()
      .references(() => cities.id),
    status: orderStatusEnum('status').notNull().default('new'),
    siteTier: siteTierEnum('site_tier').notNull().default('standard'),
    totalRub: numeric('total_rub', { precision: 14, scale: 2 }).notNull(),
    unitsCount: integer('units_count').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('orders_user_created_idx').on(t.userId, t.createdAt.desc()),
    numberIdx: index('orders_number_idx').on(t.number),
  })
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    qty: integer('qty').notNull(),
    unitPriceRub: numeric('unit_price_rub', { precision: 12, scale: 2 }).notNull(),
    totalPriceRub: numeric('total_price_rub', { precision: 14, scale: 2 }).notNull(),
    // snapshot товара на момент заказа (чтобы заказ не «поплыл» при изменении карточки)
    snapshotTitle: varchar('snapshot_title', { length: 500 }).notNull(),
    snapshotPhoto: text('snapshot_photo'),
    snapshotSku: varchar('snapshot_sku', { length: 50 }).notNull(),
    /** Источник 1688 — нужен менеджеру при закупке. Клиенту НЕ показываем. */
    snapshotSourceUrl: text('snapshot_source_url'),
  },
  (t) => ({
    qtyPositive: check('order_items_qty_positive', sql`${t.qty} > 0`),
    orderIdx: index('order_items_order_idx').on(t.orderId),
  })
)

/* ─────────────────────────────────────────────────────────────────────
   SOURCING REQUESTS
   ─────────────────────────────────────────────────────────────────── */

export const sourcingRequests = pgTable(
  'sourcing_requests',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    number: varchar('number', { length: 20 }).notNull().unique(), // SRC-123456
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    description: text('description').notNull(),
    qty: integer('qty').notNull(),
    budgetRub: numeric('budget_rub', { precision: 12, scale: 2 }),
    status: sourcingStatusEnum('status').notNull().default('new'),
    siteTier: siteTierEnum('site_tier').notNull().default('standard'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('sourcing_user_created_idx').on(t.userId, t.createdAt.desc()),
  })
)

export const sourcingRequestPhotos = pgTable('sourcing_request_photos', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  requestId: uuid('request_id')
    .notNull()
    .references(() => sourcingRequests.id, { onDelete: 'cascade' }),
  url: text('url').notNull(), // URL в нашем S3
  sortOrder: integer('sort_order').notNull().default(0),
})

/* ─────────────────────────────────────────────────────────────────────
   RELATIONS (для удобных запросов через query API)
   ─────────────────────────────────────────────────────────────────── */

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.id],
    references: [companies.userId],
  }),
  orders: many(orders),
  sourcingRequests: many(sourcingRequests),
  consents: many(consents),
}))

export const companiesRelations = relations(companies, ({ one }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  photos: many(productPhotos),
}))

export const productPhotosRelations = relations(productPhotos, ({ one }) => ({
  product: one(products, {
    fields: [productPhotos.productId],
    references: [products.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  deliveryCity: one(cities, {
    fields: [orders.deliveryCityId],
    references: [cities.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export const sourcingRequestsRelations = relations(sourcingRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [sourcingRequests.userId],
    references: [users.id],
  }),
  photos: many(sourcingRequestPhotos),
}))

export const sourcingRequestPhotosRelations = relations(
  sourcingRequestPhotos,
  ({ one }) => ({
    request: one(sourcingRequests, {
      fields: [sourcingRequestPhotos.requestId],
      references: [sourcingRequests.id],
    }),
  })
)

/* ─────────────────────────────────────────────────────────────────────
   TYPE EXPORTS (для использования в API)
   ─────────────────────────────────────────────────────────────────── */

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Company = typeof companies.$inferSelect
export type Category = typeof categories.$inferSelect
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ProductPhoto = typeof productPhotos.$inferSelect
export type City = typeof cities.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type SourcingRequest = typeof sourcingRequests.$inferSelect
export type SourcingRequestPhoto = typeof sourcingRequestPhotos.$inferSelect
