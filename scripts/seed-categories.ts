/**
 * Сид категорий каталога CaiPei.
 *
 * Запуск: npm run seed:categories
 * Идемпотентен.
 *
 * ВАЖНО: slug'и здесь и в CATEGORY_RULES импортёра должны совпадать.
 */

import { db } from '../src/db'
import { categories } from '../src/db/schema'

interface SeedCategory {
  slug: string
  nameRu: string
}

// Порядок отражает сортировку в каталоге (от популярных к редким).
const SEED: SeedCategory[] = [
  { slug: 'serjki', nameRu: 'Серьги' },
  { slug: 'cepochki-i-kole', nameRu: 'Цепочки и колье' },
  { slug: 'podveski', nameRu: 'Подвески' },
  { slug: 'braslety', nameRu: 'Браслеты' },
  { slug: 'broshi', nameRu: 'Броши' },
  { slug: 'busy', nameRu: 'Бусы' },
  { slug: 'komplekty', nameRu: 'Комплекты' },
  { slug: 'aksessuary-dlya-volos', nameRu: 'Аксессуары для волос' },
  { slug: 'berety-i-shlyapy', nameRu: 'Береты и шляпы' },
  { slug: 'poyasa-i-remni', nameRu: 'Пояса и ремни' },
  { slug: 'korsety', nameRu: 'Корсеты' },
  { slug: 'vorotniki-i-manjety', nameRu: 'Воротники и манжеты' },
  { slug: 'sumki', nameRu: 'Сумки' },
  { slug: 'odejda', nameRu: 'Одежда' },
  { slug: 'dekor-i-tvorchestvo', nameRu: 'Декор и творчество' },
  { slug: 'prochee', nameRu: 'Прочее' },
]

async function main() {
  console.log('🌱 Seeding categories...')

  for (let i = 0; i < SEED.length; i++) {
    const { slug, nameRu } = SEED[i]
    await db
      .insert(categories)
      .values({ slug, nameRu, sortOrder: i + 1, isActive: true })
      .onConflictDoUpdate({
        target: categories.slug,
        set: { nameRu, sortOrder: i + 1, isActive: true },
      })
    console.log(`  ✓ ${nameRu} (${slug})`)
  }

  console.log(`\n✅ Categories seeded: ${SEED.length}\n`)
  process.exit(0)
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
