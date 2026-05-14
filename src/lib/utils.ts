/**
 * Утилиты общего назначения.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ORDER_NUMBER_PREFIX, SOURCING_NUMBER_PREFIX } from './constants'

/**
 * Слияние Tailwind-классов: `cn('p-4', condition && 'bg-red-500', 'p-8')`
 * Корректно разруливает конфликты вроде `p-4 p-8` → `p-8`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Форматирует число в рубли: 12345.67 → "12 345 ₽" */
export function formatRub(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '— ₽'
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(n)) return '— ₽'
  return `${Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`
}

/** Форматирует большое число с пробелами: 12345 → "12 345" */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('ru-RU').replace(/,/g, ' ')
}

/** Плюрализация для русского: pluralize(5, 'товар', 'товара', 'товаров') → 'товаров' */
export function pluralize(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

/** Генерация номера заказа: CP-238472 */
export function generateOrderNumber(): string {
  return `${ORDER_NUMBER_PREFIX}-${Math.floor(100000 + Math.random() * 900000)}`
}

/** Генерация номера заявки на подбор: SRC-654321 */
export function generateSourcingNumber(): string {
  return `${SOURCING_NUMBER_PREFIX}-${Math.floor(100000 + Math.random() * 900000)}`
}

/** Генерация SKU: CP-00001 */
export function generateSku(numericId: number): string {
  return `CP-${numericId.toString().padStart(5, '0')}`
}

/**
 * Транслитерация русского текста в slug для URL.
 * "ТВ-тумба" → "tv-tumba"
 */
export function slugify(text: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  }
  return text
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Маска для телефона при логировании: +7-***-***-4567 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\+?\d{1,3})\d{6,}(\d{4})$/, '$1-***-***-$2')
}

/** Маска для email при логировании: a***@example.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local[0]}***@${domain}`
}

/**
 * Возвращает значение либо плейсхолдер "уточните у менеджера".
 * Используется в UI для пропущенных данных.
 */
export function valueOrUnclear(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'уточните у менеджера'
  const s = typeof value === 'string' ? value.trim() : String(value)
  return s.length === 0 ? 'уточните у менеджера' : s
}
