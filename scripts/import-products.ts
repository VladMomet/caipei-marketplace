/**
 * Импортёр товаров из Excel-файла nap.xlsx → PostgreSQL.
 *
 * Запуск:  npm run import:products
 *
 * Конфигурация через .env: PRODUCTS_XLSX_PATH (по умолчанию ./data/nap.xlsx)
 *
 * Поведение:
 *  - Берёт только товары бренда JewelryMeverly (см. BRAND_FILTER)
 *  - Авто-категоризация по ключевым словам в названии
 *  - Цена за 1 шт малой партии   ← Цена 3 (×2.5 от cost)
 *  - Цена за 1 шт опт (от 2000)   ← Цена 1 (×1.5 от cost)
 *  - Мерджит по артикулу: новые INSERT, существующие UPDATE
 *  - Товары, которых нет в файле, помечает status='archived'
 *
 * Перед запуском:
 *   npm run db:push          (создать таблицы)
 *   npm run seed:categories  (засеять категории)
 */

import ExcelJS from 'exceljs'
import path from 'path'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../src/db'
import { categories, products, productPhotos } from '../src/db/schema'
import { VOLUME_DISCOUNT_THRESHOLD } from '../src/lib/constants'

const XLSX_PATH = process.env.PRODUCTS_XLSX_PATH ?? './data/nap.xlsx'
const BRAND_FILTER = 'JewelryMeverly'

interface ExcelRow {
  sku: string
  brand: string
  title: string
  description: string | null
  cost: number | null
  price1: number | null // ×1.5 — опт от 2000 шт
  price2: number | null // (не используется — заведём поле на будущее если понадобится)
  price3: number | null // ×2.5 — базовая, от MOQ
  color: string | null
  size: string | null
  url1688: string | null
  imageUrl: string | null
}

/** Категория по ключевым словам в названии. Возвращает slug + name_ru. */
const CATEGORY_RULES: Array<[string, string, string[]]> = [
  ['serjki', 'Серьги', ['серьг', 'каффы', 'пусет']],
  ['cepochki-i-kole', 'Цепочки и колье', ['цепочк', 'колье', 'чокер']],
  ['podveski', 'Подвески', ['подвеск', 'кулон']],
  ['braslety', 'Браслеты', ['браслет']],
  ['broshi', 'Броши', ['брошь', 'броши']],
  ['busy', 'Бусы', ['бусы', 'бодичейн', 'бус с']],
  ['komplekty', 'Комплекты', ['комплект', 'набор украшени']],
  [
    'aksessuary-dlya-volos',
    'Аксессуары для волос',
    [
      'повязка на голов', 'шпильк', 'невидимк', 'заколк', 'венок',
      'ободок', 'диадем', 'тика на голов', 'волос',
    ],
  ],
  ['berety-i-shlyapy', 'Береты и шляпы', ['берет', 'шляп', 'колпак']],
  ['poyasa-i-remni', 'Пояса и ремни', ['пояс', 'ремен', 'ремн', 'подтяжк', 'галстук']],
  ['korsety', 'Корсеты', ['корсет']],
  ['vorotniki-i-manjety', 'Воротники и манжеты', ['воротник', 'манжет', 'съемные рукав']],
  ['sumki', 'Сумки', ['сумк', 'рюкзак', 'ремень плеч', 'футляр', 'чехол для очк']],
  ['odejda', 'Одежда', ['жакет', 'юбк', 'жилет']],
  ['dekor-i-tvorchestvo', 'Декор и творчество', ['скотч', 'стразы', 'синельн', 'бусин', 'бант', 'гирлянд']],
  ['prochee', 'Прочее', ['карабин']],
]

function categorize(title: string): { slug: string; nameRu: string } {
  const t = title.toLowerCase()
  for (const [slug, nameRu, kws] of CATEGORY_RULES) {
    for (const kw of kws) {
      if (t.includes(kw)) return { slug, nameRu }
    }
  }
  return { slug: 'prochee', nameRu: 'Прочее' }
}

/** Убирает «  ·  1688: ...» хвост в полях Цвет / Размер */
function cleanField(v: unknown): string | null {
  if (v === null || v === undefined) return null
  let s = String(v).trim()
  s = s.split(/\s*·\s*1688:\s*/)[0]
  s = s.trim()
  return s || null
}

function getCell(row: ExcelJS.Row, col: number): unknown {
  const cell = row.getCell(col)
  return cell.value
}

function getString(row: ExcelJS.Row, col: number): string | null {
  const v = getCell(row, col)
  if (v === null || v === undefined) return null
  if (typeof v === 'string') return v.trim() || null
  if (typeof v === 'object' && v !== null && 'text' in v) {
    return (v as { text: string }).text.trim() || null
  }
  if (typeof v === 'object' && v !== null && 'hyperlink' in v) {
    return (v as { hyperlink: string }).hyperlink.trim() || null
  }
  return String(v).trim() || null
}

function getNumber(row: ExcelJS.Row, col: number): number | null {
  const v = getCell(row, col)
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return v
  if (typeof v === 'object' && v !== null && 'result' in v) {
    const r = (v as { result: unknown }).result
    return typeof r === 'number' ? r : null
  }
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

function parseRow(row: ExcelJS.Row): ExcelRow | null {
  // Колонки nap.xlsx (1-based):
  // 1 Артикул | 2 Название | 3 Бренд | 4 Описание | 5 cost (₽)
  // 6 Цена 1 | 7 Цена 2 | 8 Цена 3 | 9 Цвет | 10 Размер | 11 Ссылка 1688 | 12 Фото
  const sku = getString(row, 1)
  const title = getString(row, 2)
  const brand = getString(row, 3)
  if (!sku || !title || !brand) return null

  return {
    sku,
    brand,
    title,
    description: getString(row, 4),
    cost: getNumber(row, 5),
    price1: getNumber(row, 6),
    price2: getNumber(row, 7),
    price3: getNumber(row, 8),
    color: cleanField(getCell(row, 9)),
    size: cleanField(getCell(row, 10)),
    url1688: getString(row, 11),
    imageUrl: getString(row, 12),
  }
}

async function main() {
  const absPath = path.resolve(XLSX_PATH)
  console.log(`📂 Reading ${absPath}`)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(absPath)
  const ws = wb.worksheets[0]
  if (!ws) {
    console.error('❌ No worksheet found')
    process.exit(1)
  }

  // Загружаем все категории в map (slug → id)
  const catRows = await db.select().from(categories)
  const catBySlug = new Map(catRows.map((c) => [c.slug, c]))
  if (catBySlug.size === 0) {
    console.error('❌ No categories in DB. Run: npm run seed:categories')
    process.exit(1)
  }

  // Существующие товары (по SKU) — для определения INSERT vs UPDATE
  const existing = await db.select({ id: products.id, sku: products.sku }).from(products)
  const existingSkus = new Set(existing.map((p) => p.sku))

  const totalRows = ws.rowCount
  let created = 0
  let updated = 0
  let skipped = 0
  let errors = 0
  const seenSkus = new Set<string>()

  // Первая строка — заголовки
  for (let rowIdx = 2; rowIdx <= totalRows; rowIdx++) {
    const row = ws.getRow(rowIdx)
    const parsed = parseRow(row)
    if (!parsed) {
      skipped++
      continue
    }
    if (parsed.brand !== BRAND_FILTER) {
      skipped++
      continue
    }

    // Цены — фолбэки если столбец пустой
    const basePrice = parsed.price3 ?? parsed.price2 ?? parsed.price1
    const volumePrice = parsed.price1 ?? parsed.price2 ?? parsed.price3
    if (!basePrice || !volumePrice) {
      console.warn(`  ⚠ Row ${rowIdx} (${parsed.sku}): нет цены — пропускаем`)
      skipped++
      continue
    }

    const cat = categorize(parsed.title)
    const catRecord = catBySlug.get(cat.slug)
    if (!catRecord) {
      console.error(`  ✗ Row ${rowIdx} (${parsed.sku}): нет категории «${cat.slug}»`)
      errors++
      continue
    }

    seenSkus.add(parsed.sku)

    const data = {
      offerId: parsed.sku, // у нас offer_id = sku
      sku: parsed.sku,
      categoryId: catRecord.id,
      titleRu: parsed.title,
      titleCn: null,
      description: parsed.description,
      priceCnyWholesale: parsed.cost !== null ? String(parsed.cost) : null,
      priceRub: String(Math.round(basePrice)),
      priceRubVolume: String(Math.round(volumePrice)),
      volumeThresholdQty: VOLUME_DISCOUNT_THRESHOLD,
      moq: '10 шт',
      sizeText: parsed.size?.slice(0, 200) ?? null,
      material: null, // в этом датасете нет колонки материал
      style: null,
      color: parsed.color?.slice(0, 100) ?? null,
      sourceUrl: parsed.url1688,
      status: 'active' as const,
      updatedAt: new Date(),
    }

    try {
      const isNew = !existingSkus.has(parsed.sku)
      let productRowId: string | null = null

      if (isNew) {
        const [inserted] = await db
          .insert(products)
          .values({ ...data, createdAt: new Date() })
          .returning({ id: products.id })
        productRowId = inserted?.id ?? null
        if (productRowId) created++
      } else {
        const [u] = await db
          .update(products)
          .set(data)
          .where(eq(products.sku, parsed.sku))
          .returning({ id: products.id })
        productRowId = u?.id ?? null
        if (productRowId) updated++
      }

      // Фотки — пересоздаём заново
      if (productRowId) {
        if (!isNew) {
          await db.delete(productPhotos).where(eq(productPhotos.productId, productRowId))
        }
        if (parsed.imageUrl) {
          await db.insert(productPhotos).values({
            productId: productRowId,
            url: parsed.imageUrl,
            sortOrder: 0,
            isMain: true,
          })
        }
      }
    } catch (e) {
      errors++
      console.error(`  ✗ Row ${rowIdx} (${parsed.sku}):`, (e as Error).message)
    }
  }

  // Архивируем товары, которых нет в файле
  const toArchive = [...existingSkus].filter((s) => !seenSkus.has(s))
  let archived = 0
  if (toArchive.length > 0) {
    const result = await db
      .update(products)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(inArray(products.sku, toArchive))
      .returning({ id: products.id })
    archived = result.length
  }

  console.log('\n══════════════════════════════════════════')
  console.log('✅ Import finished')
  console.log(`  Created:  ${created}`)
  console.log(`  Updated:  ${updated}`)
  console.log(`  Archived: ${archived}`)
  console.log(`  Skipped:  ${skipped}`)
  console.log(`  Errors:   ${errors}`)
  console.log('══════════════════════════════════════════\n')

  process.exit(errors > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('❌ Import failed:', e)
  process.exit(1)
})
