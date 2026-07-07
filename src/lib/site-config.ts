/**
 * Site configuration — три сайта на одном коде.
 *
 * SITE_TIER — env-переменная, задаётся при запуске каждого инстанса:
 *
 *   SITE_TIER=lite       → caipei-lite.ru      × 1.0  🟢 [LITE]
 *   SITE_TIER=standard   → caipei.ru           × 1.5  🟡 [STANDARD]
 *   SITE_TIER=prestige   → caipei-premium.ru   × 2.5  🔴 [PRESTIGE]
 *
 * Все три инстанса делят одну БД, но:
 *   - цена умножается на разный коэффициент
 *   - Telegram-уведомления имеют разный префикс
 *   - бренд, тайтл, canonical, footer — разные
 *   - куки авторизации изолированы по домену браузером (nothing to do)
 */

export type SiteTier = 'lite' | 'standard' | 'prestige'

export interface SiteConfig {
  tier: SiteTier
  /** Публичное имя бренда — footer, header, тайтл */
  name: string
  /** Короткое имя без префикса «CaiPei» — для тех мест где префикс уже есть в контексте */
  shortName: string
  /** Домен без схемы — для canonical, sitemap, OG */
  host: string
  /** Полный origin (для canonical URL) */
  origin: string
  /** Множитель поверх городской цены. 1.0 → цена не меняется */
  priceMultiplier: number
  /** Метка для Telegram-уведомлений. Ставим первой строкой */
  telegramLabel: string
  /** Цветовой акцент для отличия в UI (для будущего) */
  accentColor: string
  /** Slug — используется в куке, кэше, событиях */
  slug: string
  /** Номер счётчика Яндекс.Метрики (null если не подключён) */
  metrikaId: number | null
}

const CONFIGS: Record<SiteTier, SiteConfig> = {
  lite: {
    tier: 'lite',
    name: 'CaiPei Lite',
    shortName: 'Lite',
    host: 'caipei-lite.ru',
    origin: 'https://caipei-lite.ru',
    priceMultiplier: 1.0,
    telegramLabel: '🟢 [LITE]',
    accentColor: '#7F9C6E', // sage
    slug: 'lite',
    metrikaId: 110469161,
  },
  standard: {
    tier: 'standard',
    name: 'CaiPei',
    shortName: 'Standard',
    host: 'caipei.ru',
    origin: 'https://caipei.ru',
    priceMultiplier: 1.5,
    telegramLabel: '🟡 [STANDARD]',
    accentColor: '#B33A2D', // cinnabar (original)
    slug: 'standard',
    metrikaId: 110469098,
  },
  prestige: {
    tier: 'prestige',
    name: 'CaiPei Prestige',
    shortName: 'Prestige',
    host: 'caipei-premium.ru',
    origin: 'https://caipei-premium.ru',
    priceMultiplier: 2.5,
    telegramLabel: '🔴 [PRESTIGE]',
    accentColor: '#8B6F47', // gold-brown
    slug: 'prestige',
    metrikaId: 110469209,
  },
}

/**
 * Резолвит текущий SITE_TIER из env.
 * Дефолт — 'standard' (базовый caipei.ru).
 */
function resolveTier(): SiteTier {
  const raw = process.env.SITE_TIER
  if (raw === 'lite' || raw === 'standard' || raw === 'prestige') {
    return raw
  }
  return 'standard'
}

/**
 * Активный конфиг сайта — читается один раз при импорте.
 *
 * На сервере: определяется env SITE_TIER.
 * На клиенте: инжектится через NEXT_PUBLIC_SITE_TIER (см. resolveClientTier ниже).
 */
export const siteConfig: SiteConfig = CONFIGS[resolveTier()]

/**
 * Client-side резолв: во время сборки Next.js подставляет значение
 * process.env.NEXT_PUBLIC_SITE_TIER в клиентский бандл. На каждом инстансе
 * бандл собирается свой.
 */
export function getClientSiteConfig(): SiteConfig {
  const raw = process.env.NEXT_PUBLIC_SITE_TIER
  const tier: SiteTier =
    raw === 'lite' || raw === 'standard' || raw === 'prestige' ? raw : 'standard'
  return CONFIGS[tier]
}

/** Экспорт всех конфигов — для sitemap, robots, etc. */
export const ALL_SITE_CONFIGS = CONFIGS
