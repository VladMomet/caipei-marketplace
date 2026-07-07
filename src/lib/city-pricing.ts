/**
 * Модификаторы цены по городу доставки.
 *
 * Модификатор применяется к базовой цене товара (та что лежит в БД, она уже
 * включает доставку до Москвы) — он либо удешевляет, либо удорожает доставку
 * в зависимости от того, насколько удобно нам везти в этот город.
 *
 * Базовая логика: товар входит в РФ через Забайкальск/Дальний Восток. Чем
 * восточнее город назначения — тем дешевле «последняя миля». Поэтому
 * сибирские города дешевле Москвы, а юг России (Самара, Ростов) — дороже,
 * т.к. товар туда едет через всю страну.
 *
 * Финальная цена = product.priceRub × CITY × SITE_TIER (× 1.0 / 1.5 / 2.5)
 *
 * Если slug не найден в маппинге → возвращаем 1 (показываем базовую цену).
 */

import { getClientSiteConfig, siteConfig, type SiteTier } from './site-config'

export const CITY_PRICE_MULTIPLIER: Record<string, number> = {
  moscow: 1.0,
  'saint-petersburg': 1.025,
  'nizhny-novgorod': 1.01,
  kazan: 0.99,
  ekaterinburg: 0.985,
  chelyabinsk: 0.985,
  novosibirsk: 0.975,
  omsk: 0.95,
  samara: 1.01,
  'rostov-on-don': 1.01,
}

export const DEFAULT_CITY_SLUG = 'moscow'

/**
 * Вернуть модификатор для slug города. Если не нашли — 1.0 (базовая цена).
 */
export function getCityMultiplier(slug: string | null | undefined): number {
  if (!slug) return 1
  const m = CITY_PRICE_MULTIPLIER[slug]
  return typeof m === 'number' ? m : 1
}

/**
 * Резолв множителя сайта — работает и на сервере, и на клиенте.
 * На сервере читает SITE_TIER, на клиенте — NEXT_PUBLIC_SITE_TIER.
 */
function getSiteMultiplier(): number {
  if (typeof window === 'undefined') {
    return siteConfig.priceMultiplier
  }
  return getClientSiteConfig().priceMultiplier
}

/**
 * Применить оба модификатора (город + сайт) к базовой цене и округлить.
 *
 * Округление до ближайших 10 ₽ — для приятного визуала (10 550 ₽, а не 10 547 ₽).
 *
 * Сохраняем старое имя applyCityMultiplier как алиас — не будем ломать 8 мест
 * вызовов. Но внутри теперь применяется оба множителя.
 */
export function applyPriceMultipliers(
  basePrice: number,
  citySlug: string | null | undefined
): number {
  const cityMult = getCityMultiplier(citySlug)
  const siteMult = getSiteMultiplier()
  const raw = basePrice * cityMult * siteMult
  return Math.round(raw / 10) * 10
}

/** Алиас — сохраняем совместимость с существующими импортами. */
export const applyCityMultiplier = applyPriceMultipliers

/**
 * Применить только сайтовый множитель без города — для мест где город
 * не важен (например, snapshot цены в момент заказа с уже подставленной
 * ценой доставки).
 */
export function applySiteMultiplier(basePrice: number, tier?: SiteTier): number {
  const mult = tier ? { lite: 1.0, standard: 1.5, prestige: 2.5 }[tier] : getSiteMultiplier()
  return Math.round((basePrice * mult) / 10) * 10
}

