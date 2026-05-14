/**
 * /product/[sku] — детальная карточка товара.
 *
 * SSR с полными метаданными для SEO и JSON-LD структурированных данных.
 * 404 если товар не найден, 410 если архивирован.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductDetail } from '@/lib/queries/product'
import { ProductGallery } from './_components/product-gallery'
import { PriceBlock } from './_components/price-block'
import { DeliveryBlock } from './_components/delivery-block'
import { Specifications } from './_components/specifications'
import { AddToCartBlock } from './_components/add-to-cart-block'
import { LEGAL_ENTITY } from '@/lib/constants'
import { formatRub } from '@/lib/utils'

interface Props {
  params: Promise<{ sku: string }>
}

export const revalidate = 300 // ISR — карточки перегенерируются каждые 5 минут

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sku } = await params
  const product = await getProductDetail(sku)
  if (!product) return { title: 'Не найдено' }

  const mainPhoto = product.photos.find((p) => p.isMain) ?? product.photos[0]
  const ogImage = mainPhoto
    ? `/api/img-proxy?url=${encodeURIComponent(mainPhoto.url)}`
    : undefined

  return {
    title: product.title_ru,
    description:
      product.description?.slice(0, 160) ??
      `${product.title_ru} из Китая оптом. Цена с доставкой ${formatRub(product.price.rub).replace(' ₽', '')} ₽. Документы, ВЭД.`,
    openGraph: {
      title: product.title_ru,
      description:
        product.description?.slice(0, 200) ??
        `Цена с доставкой ${formatRub(product.price.rub)}`,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 1200 }] : undefined,
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { sku } = await params
  const product = await getProductDetail(sku)

  if (!product) notFound()

  if (product.status === 'archived') {
    return (
      <div className="container mx-auto max-w-2xl px-6 py-20 text-center lg:py-32">
        <div className="mb-5 inline-flex rounded-full bg-paper-2 px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
          410 · товар архивирован
        </div>
        <h1 className="mb-4 font-display text-3xl font-light tracking-tight md:text-4xl">
          Этой позиции больше нет в каталоге
        </h1>
        <p className="mb-8 text-base text-ink-3">
          Похоже, фабрика сняла этот товар с продажи. Но мы найдём аналог — в каталоге
          много похожих, или оставьте заявку на персональный подбор.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={`/catalog/${product.category.slug}`}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-cinnabar transition-colors"
          >
            Похожие в категории «{product.category.name_ru}»
          </Link>
          <Link
            href="/sourcing"
            className="inline-flex h-12 items-center rounded-full border border-ink-2 px-6 text-sm font-semibold text-ink hover:bg-ink hover:text-paper transition-colors"
          >
            Заказать подбор
          </Link>
        </div>
      </div>
    )
  }

  const mainPhoto = product.photos.find((p) => p.isMain) ?? product.photos[0]

  // JSON-LD: Product + Offer
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title_ru,
    description: product.description ?? undefined,
    sku: product.sku,
    image: mainPhoto?.url,
    category: product.category.name_ru,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: product.price.rub,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: LEGAL_ENTITY.fullName,
      },
    },
  }

  return (
    <>
      {/* JSON-LD структурированные данные */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Хлебные крошки + кнопка Назад */}
      <div className="border-b border-hair bg-paper">
        <div className="container mx-auto flex max-w-[1480px] items-center gap-4 px-6 py-4 lg:px-8 lg:py-5">
          <Link
            href={`/catalog/${product.category.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-hair bg-surface-hi px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-2 transition-colors hover:border-ink-2 hover:text-ink"
            aria-label="Вернуться в каталог"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 2L4 6l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>В каталог</span>
          </Link>

          {/* Десктопные крошки рядом */}
          <nav
            aria-label="Хлебные крошки"
            className="hidden font-mono text-[10.5px] uppercase tracking-wider text-ink-3 md:block"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              Главная
            </Link>
            <span className="mx-2">·</span>
            <Link href="/catalog" className="hover:text-ink transition-colors">
              Каталог
            </Link>
            <span className="mx-2">·</span>
            <Link
              href={`/catalog/${product.category.slug}`}
              className="hover:text-ink transition-colors"
            >
              {product.category.name_ru}
            </Link>
            <span className="mx-2">·</span>
            <span className="text-ink">{product.sku}</span>
          </nav>
        </div>
      </div>

      {/* Основная двухколоночная сетка */}
      <div className="container mx-auto max-w-[1480px] px-6 py-8 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14 xl:gap-20">
          {/* Левая колонка: галерея (sticky на десктопе) */}
          <div className="lg:sticky lg:top-[100px] lg:self-start">
            <ProductGallery photos={product.photos} title={product.title_ru} />
          </div>

          {/* Правая колонка: всё остальное */}
          <div className="flex flex-col gap-8">
            <header>
              <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-cinnabar">
                {product.category.name_ru}
              </div>
              <h1 className="mb-3 font-display text-3xl font-light leading-tight tracking-tight md:text-4xl lg:text-5xl">
                {product.title_ru}
              </h1>
              {product.title_cn && (
                <p className="font-mono text-sm text-ink-4">
                  «{product.title_cn}»
                </p>
              )}
            </header>

            <PriceBlock
              rub={product.price.rub}
              cityName={
                product.delivery?.city.name_acc ?? product.delivery?.city.name_ru ?? 'Москву'
              }
            />

            <DeliveryBlock initial={product.delivery} />

            <AddToCartBlock
              productId={product.id}
              sku={product.sku}
              title={product.title_ru}
              photo={mainPhoto?.url ?? null}
              basePriceRub={product.price.rub}
              volumePriceRub={product.price.rub_volume}
              volumeThresholdQty={product.price.volume_threshold_qty}
            />

            <Specifications
              sizeText={product.size_text}
              material={product.material}
              style={product.style}
              color={product.color}
              moq={product.moq}
              sku={product.sku}
            />

            {product.description && (
              <section>
                <h2 className="mb-4 font-display text-xl font-medium tracking-tight">
                  Описание
                </h2>
                <p className="whitespace-pre-line text-base leading-relaxed text-ink-2">
                  {product.description}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
