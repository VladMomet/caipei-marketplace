/**
 * Глобальные константы CaiPei marketplace.
 *
 * MVP-решения хардкодом. В будущих версиях вынесем в БД.
 */

/** Курс юаня к рублю — для справочной CNY-цены в карточке (если будем показывать) */
export const CNY_TO_RUB = 11

/**
 * Приблизительная разбивка финальной цены для прозрачности — показываем
 * клиенту, из чего складывается итоговая стоимость. Сумма = 100.
 */
export const COST_BREAKDOWN = {
  factory: 55,    // фабрика
  logistics: 25,  // логистика Иу/Гуанчжоу → РФ
  customs: 3,     // ВЭД, таможня, сертификация
  vat: 17,        // НДС 20% (приблизительно)
} as const

/** Плейсхолдер для пустых полей в карточке */
export const UNCLEAR_VALUE_LABEL = 'уточните у менеджера'

/** Лимит на размер фото-референса в подборе */
export const SOURCING_PHOTO_MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/** Лимит количества фото в подборе */
export const SOURCING_PHOTOS_MAX_COUNT = 3

/** Минимальная длина пароля */
export const PASSWORD_MIN_LENGTH = 6

/** Минимальная длина описания в заявке на подбор */
export const SOURCING_DESCRIPTION_MIN_LENGTH = 20

/** Bcrypt cost — 12 — оптимальный баланс безопасности и скорости */
export const BCRYPT_COST = 12

/** Префикс артикула */
export const SKU_PREFIX = 'CP'

/** Префиксы номеров заказов и заявок на подбор */
export const ORDER_NUMBER_PREFIX = 'CP'
export const SOURCING_NUMBER_PREFIX = 'PICK'

/**
 * Минимальное количество штук на одну позицию в корзине (MOQ).
 * Используется как в zod-валидации API, так и в use-cart на фронте.
 */
export const MIN_QTY_PER_LINE = 10

/**
 * Порог объёмной скидки. От этого количества (на одну позицию)
 * применяется скидочная цена `price_rub_volume` вместо базовой `price_rub`.
 */
export const VOLUME_DISCOUNT_THRESHOLD = 2000

/**
 * Юр.лицо для футера, документов, контактов 152-ФЗ.
 */
export const LEGAL_ENTITY = {
  type: 'ИП',
  name: 'Оболенский Владимир',
  fullName: 'ИП Оболенский Владимир',
  inn: '774397462657',
  ogrn: '324774600177170', // ОГРНИП
  address: 'г. Москва, Пресненская набережная, д. 10, офис 115',
  email: 'hello@caipei.ru',
  phone: '+7 (495) 000-00-00',
} as const
