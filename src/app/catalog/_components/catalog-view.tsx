/**
 * CatalogView — собирает каталог: фильтры (sidebar/drawer), toolbar, грид, пагинация.
 *
 * Клиентский, потому что управляет mobile drawer'ом фильтров.
 * Данные приходят пропсами из server component страницы.
 */

'use client'

import { useState } from 'react'
import { ProductCard } from './product-card'
import { FiltersSidebar } from './filters-sidebar'
import { CatalogToolbar } from './catalog-toolbar'
import { Pagination } from './pagination'
import { Sheet, SheetHeader, SheetTitle, SheetBody, SheetClose, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { pluralize } from '@/lib/utils'
import type { CatalogResult } from '@/lib/queries/catalog'

export function CatalogView({ data }: { data: CatalogResult }) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  // На /catalog/[category] категория уже зафиксирована через URL-сегмент — там
  // чекбоксы категорий не нужны. Признак: data.category не null.
  const hideCategories = data.category !== null

  return (
    <div className="container mx-auto max-w-[1480px] px-6 py-10 lg:px-8 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-10 xl:grid-cols-[280px_1fr] xl:gap-14">
        {/* Sidebar — десктоп */}
        <div className="hidden lg:block">
          <FiltersSidebar filters={data.filters} hideCategories={hideCategories} />
        </div>

        {/* Основной блок */}
        <div className="min-w-0">
          <CatalogToolbar
            total={data.total}
            onOpenMobileFilters={() => setFiltersOpen(true)}
          />

          {data.items.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
                {data.items.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>

              <Pagination total={data.total} page={data.page} perPage={data.per_page} />
            </>
          )}
        </div>
      </div>

      {/* Sheet — мобильные фильтры */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen} widthClassName="w-[380px]">
        <SheetHeader>
          <SheetTitle>Фильтры</SheetTitle>
          <SheetClose onClose={() => setFiltersOpen(false)} />
        </SheetHeader>
        <SheetBody>
          <FiltersSidebar filters={data.filters} inDrawer hideCategories={hideCategories} />
        </SheetBody>
        <SheetFooter>
          <Button onClick={() => setFiltersOpen(false)} className="w-full" size="lg">
            Показать {data.total} {pluralize(data.total, 'товар', 'товара', 'товаров')}
          </Button>
        </SheetFooter>
      </Sheet>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-hair-2 bg-surface px-6 py-20 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-paper-2 text-ink-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mb-2 font-display text-xl font-medium tracking-tight">Ничего не нашлось</p>
      <p className="max-w-sm text-sm text-ink-3">
        Попробуйте смягчить фильтры, изменить запрос, или оставьте заявку на персональный
        подбор — найдём под вас.
      </p>
    </div>
  )
}
