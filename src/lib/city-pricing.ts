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
 * Цена для пользователя = product.priceRub * CITY_PRICE_MULTIPLIER[citySlug]
 *
 * Если slug не найден в маппинге → возвращаем 1 (показываем базовую цену).
 */

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
 * Применить модификатор к базовой цене и округлить до рубля.
 *
 * Округление в большую сторону (ceil) на 5/10 — чтобы цены выглядели
 * приятно (не 10 547 ₽, а 10 550 ₽). Для городов с модификатором 1.0
 * округление сохраняет исходное значение если оно уже круглое.
 */
export function applyCityMultiplier(basePrice: number, citySlug: string | null | undefined): number {
  const mult = getCityMultiplier(citySlug)
  const raw = basePrice * mult
  // Округляем до ближайшего 10 — цены выглядят аккуратнее
  return Math.round(raw / 10) * 10
}
