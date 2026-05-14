/**
 * Бизнес-логика расчёта цены.
 *
 * Используется в API карточки товара и при оформлении заказа.
 *
 * Тарифная система CaiPei: две ступени.
 *   1. От MOQ до volume_threshold_qty - 1   → priceRub
 *   2. От volume_threshold_qty                 → priceRubVolume (опт, дешевле)
 */

import { CNY_TO_RUB, COST_BREAKDOWN } from './constants'

export interface PriceBreakdown {
  factory: number
  logistics: number
  customs: number
  vat: number
}

export interface FullPrice {
  rub: number
  cny: number | null
  breakdown: PriceBreakdown
}

/**
 * Цена за 1 шт для заданного количества (на одну позицию).
 *
 * basePrice — `priceRub` товара (за 1 шт при малом тираже)
 * volumePrice — `priceRubVolume` (за 1 шт при опте)
 * thresholdQty — `volumeThresholdQty` (например 2000)
 */
export function unitPriceForQty(
  basePrice: number,
  volumePrice: number,
  thresholdQty: number,
  qty: number
): number {
  return qty >= thresholdQty ? volumePrice : basePrice
}

/**
 * Считает полную цену с разбивкой для отображения в карточке товара.
 *
 * Разбивка — приблизительная, по фиксированным долям COST_BREAKDOWN.
 */
export function calculateFullPrice(
  priceRub: number,
  priceCnyWholesale: number | null
): FullPrice {
  return {
    rub: priceRub,
    cny: priceCnyWholesale,
    breakdown: {
      factory: Math.round((priceRub * COST_BREAKDOWN.factory) / 100),
      logistics: Math.round((priceRub * COST_BREAKDOWN.logistics) / 100),
      customs: Math.round((priceRub * COST_BREAKDOWN.customs) / 100),
      vat: Math.round((priceRub * COST_BREAKDOWN.vat) / 100),
    },
  }
}

/** Считает итоговую сумму корзины */
export function calculateCartTotal(
  items: Array<{ priceRub: number; qty: number }>
): { totalRub: number; unitsCount: number } {
  let totalRub = 0
  let unitsCount = 0
  for (const item of items) {
    totalRub += item.priceRub * item.qty
    unitsCount += item.qty
  }
  return { totalRub, unitsCount }
}

/** Скидка опта в процентах: насколько дешевле volumePrice относительно basePrice */
export function volumeDiscountPercent(basePrice: number, volumePrice: number): number {
  if (basePrice <= 0) return 0
  return Math.round(((basePrice - volumePrice) / basePrice) * 100)
}

/** Курс CNY для UI (тиккер) */
export function getCnyRate(): number {
  return CNY_TO_RUB
}
