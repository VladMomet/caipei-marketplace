/**
 * Zod schemas для валидации API.
 *
 * Импортируется на API-роутах для validate(body).
 */

import { z } from 'zod'
import {
  PASSWORD_MIN_LENGTH,
  SOURCING_DESCRIPTION_MIN_LENGTH,
  SOURCING_PHOTOS_MAX_COUNT,
  MIN_QTY_PER_LINE,
} from './constants'

/* ─── Phones ───────────────────────────────────────────────────────── */

/**
 * Российский телефон с гибким форматом: +7..., 8..., с пробелами, дефисами, скобками.
 * Нормализуется в формат +7XXXXXXXXXX (11 цифр).
 */
const phoneSchema = z
  .string()
  .min(10, 'Слишком короткий номер')
  .transform((s) => s.replace(/[^\d+]/g, ''))
  .transform((s) => (s.startsWith('8') && s.length === 11 ? '+7' + s.slice(1) : s))
  .transform((s) => (s.startsWith('7') && s.length === 11 ? '+' + s : s))
  .refine((s) => /^\+7\d{10}$/.test(s), 'Некорректный формат, пример: +7 999 123 45 67')

/* ─── Auth ─────────────────────────────────────────────────────────── */

const physicalRegistrationSchema = z.object({
  type: z.literal('physical'),
  phone: phoneSchema,
  name: z.string().trim().min(2, 'Введите имя').max(255),
  email: z.string().trim().toLowerCase().email('Некорректный email').max(255).optional().or(z.literal('').transform(() => undefined)),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Минимум ${PASSWORD_MIN_LENGTH} символов`),
  consents: z.object({
    privacy: z.literal(true, { errorMap: () => ({ message: 'Согласие обязательно' }) }),
    offer: z.literal(true, { errorMap: () => ({ message: 'Согласие обязательно' }) }),
  }),
})

const legalRegistrationSchema = z.object({
  type: z.literal('legal'),
  phone: phoneSchema,
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().toLowerCase().email().max(255).optional().or(z.literal('').transform(() => undefined)),
  password: z.string().min(PASSWORD_MIN_LENGTH),
  company: z.object({
    name: z.string().trim().min(2).max(500),
    inn: z.string().regex(/^\d{10}$|^\d{12}$/, 'ИНН: 10 или 12 цифр'),
    kpp: z.string().regex(/^\d{9}$/, 'КПП: 9 цифр').optional().or(z.literal('').transform(() => undefined)),
    ogrn: z.string().regex(/^\d{13}$|^\d{15}$/, 'ОГРН: 13 или 15 цифр'),
  }),
  consents: z.object({
    privacy: z.literal(true, { errorMap: () => ({ message: 'Согласие обязательно' }) }),
    offer: z.literal(true, { errorMap: () => ({ message: 'Согласие обязательно' }) }),
  }),
})

export const registerSchema = z.discriminatedUnion('type', [
  physicalRegistrationSchema,
  legalRegistrationSchema,
])
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Введите пароль'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH),
})

/* ─── Profile ──────────────────────────────────────────────────────── */

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  phone: phoneSchema.optional(),
  email: z.string().trim().toLowerCase().email().max(255).nullable().optional(),
  company: z
    .object({
      name: z.string().trim().min(2).max(500),
      inn: z.string().regex(/^\d{10}$|^\d{12}$/),
      kpp: z.string().regex(/^\d{9}$/).nullable().optional(),
      ogrn: z.string().regex(/^\d{13}$|^\d{15}$/),
    })
    .optional(),
})

/* ─── Products / Catalog filters ───────────────────────────────────── */

export const productsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  material: z.string().optional(), // CSV: "сталь,латунь"
  style: z.string().optional(),
  sort: z.enum(['popular', 'price-asc', 'price-desc']).default('popular'),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(60).default(24),
})

/* ─── Orders ───────────────────────────────────────────────────────── */

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        // Минимум на позицию — см. MIN_QTY_PER_LINE в constants.ts.
        qty: z.number().int().min(MIN_QTY_PER_LINE).max(100000),
      })
    )
    .min(1, 'Корзина пуста')
    .max(50, 'Слишком много позиций'),
  city_id: z.string().uuid(),
  comment: z.string().max(1000).optional().nullable(),
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>

/* ─── Sourcing ─────────────────────────────────────────────────────── */

// Описание/qty/budget — приходят полями FormData. Фото — отдельные поля photo_0..photo_2.
// photo_urls больше не используется (фото уходят прямо в Telegram через multipart).
export const createSourcingSchema = z.object({
  description: z
    .string()
    .trim()
    .min(SOURCING_DESCRIPTION_MIN_LENGTH, `Опишите подробнее (мин. ${SOURCING_DESCRIPTION_MIN_LENGTH} символов)`)
    .max(5000),
  qty: z.number().int().min(1).max(100000),
  budget_rub: z.number().min(0).max(10_000_000).optional().nullable(),
})
export type CreateSourcingInput = z.infer<typeof createSourcingSchema>
