/**
 * Сид городов доставки.
 *
 * Запуск: npm run seed:cities
 *   Локально:    DATABASE_URL=... npm run seed:cities
 *   В GitHub Actions: переменные приходят через env: блок workflow.
 *
 * Идемпотентен: при повторном запуске обновляет существующие города по slug.
 */

import { db } from '../src/db'
import { cities } from '../src/db/schema'
import { sql } from 'drizzle-orm'

const SEED = [
  { slug: 'moscow', nameRu: 'Москва', nameAcc: 'Москву', daysMin: 14, daysMax: 45, isDefault: true, sortOrder: 1 },
  { slug: 'saint-petersburg', nameRu: 'Санкт-Петербург', nameAcc: 'Санкт-Петербург', daysMin: 16, daysMax: 48, isDefault: false, sortOrder: 2 },
  { slug: 'nizhny-novgorod', nameRu: 'Нижний Новгород', nameAcc: 'Нижний Новгород', daysMin: 16, daysMax: 48, isDefault: false, sortOrder: 3 },
  { slug: 'kazan', nameRu: 'Казань', nameAcc: 'Казань', daysMin: 16, daysMax: 48, isDefault: false, sortOrder: 4 },
  { slug: 'ekaterinburg', nameRu: 'Екатеринбург', nameAcc: 'Екатеринбург', daysMin: 18, daysMax: 50, isDefault: false, sortOrder: 5 },
  { slug: 'chelyabinsk', nameRu: 'Челябинск', nameAcc: 'Челябинск', daysMin: 18, daysMax: 50, isDefault: false, sortOrder: 6 },
  { slug: 'novosibirsk', nameRu: 'Новосибирск', nameAcc: 'Новосибирск', daysMin: 20, daysMax: 55, isDefault: false, sortOrder: 7 },
  { slug: 'omsk', nameRu: 'Омск', nameAcc: 'Омск', daysMin: 20, daysMax: 55, isDefault: false, sortOrder: 8 },
  { slug: 'samara', nameRu: 'Самара', nameAcc: 'Самару', daysMin: 18, daysMax: 50, isDefault: false, sortOrder: 9 },
  { slug: 'rostov-on-don', nameRu: 'Ростов-на-Дону', nameAcc: 'Ростов-на-Дону', daysMin: 18, daysMax: 50, isDefault: false, sortOrder: 10 },
]

async function main() {
  console.log('🌱 Seeding cities...')

  for (const city of SEED) {
    await db
      .insert(cities)
      .values(city)
      .onConflictDoUpdate({
        target: cities.slug,
        set: {
          nameRu: city.nameRu,
          nameAcc: city.nameAcc,
          daysMin: city.daysMin,
          daysMax: city.daysMax,
          isDefault: city.isDefault,
          sortOrder: city.sortOrder,
        },
      })
    console.log(`  ✓ ${city.nameRu} (${city.slug}): ${city.daysMin}–${city.daysMax} дн.`)
  }

  const total = await db.execute(sql`SELECT COUNT(*) FROM cities`)
  console.log(`\n✅ Cities seeded. Total in DB: ${(total as unknown as Array<{ count: string }>)[0]?.count}\n`)
  process.exit(0)
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
