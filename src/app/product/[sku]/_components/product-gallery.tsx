/**
 * ProductGallery — галерея фото товара.
 *
 * Слева большое активное фото, справа (на десктопе) или снизу (на мобиле)
 * вертикальный/горизонтальный список thumbnails. Клик/наведение — переключает.
 *
 * Поддерживает клавиатуру: стрелки ←→ переключают фото.
 */

'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Photo {
  url: string
  sortOrder: number
  isMain: boolean
}

interface Props {
  photos: Photo[]
  title: string
}

function buildProxyUrl(url: string): string {
  if (url.startsWith('https://cbu')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

export function ProductGallery({ photos, title }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  // Кнопки ←→ для клавиатуры
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (photos.length < 2) return
      if (e.key === 'ArrowLeft') {
        setActiveIdx((i) => (i - 1 + photos.length) % photos.length)
      } else if (e.key === 'ArrowRight') {
        setActiveIdx((i) => (i + 1) % photos.length)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length])

  if (photos.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-xl bg-paper-2 text-ink-4">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path
            d="M10 14h44v36H10zM10 36l12-12 9 9 6-6 17 17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    )
  }

  const activePhoto = photos[activeIdx]

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      {/* Главное фото */}
      <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-xl bg-paper-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={activePhoto.url}
          src={buildProxyUrl(activePhoto.url)}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover animate-[fadeIn_400ms_ease]"
          loading="eager"
        />

        {/* Стрелки навигации (только если >1 фото) */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx((i) => (i - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-paper/85 text-ink shadow-soft backdrop-blur transition-colors hover:bg-paper"
              aria-label="Предыдущее фото"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M7.5 2L3 6L7.5 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => setActiveIdx((i) => (i + 1) % photos.length)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-paper/85 text-ink shadow-soft backdrop-blur transition-colors hover:bg-paper"
              aria-label="Следующее фото"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M4.5 2L9 6L4.5 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}

        {/* Счётчик внизу */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-paper/85 px-3 py-1 font-mono text-[10.5px] tabular-nums tracking-wider text-ink backdrop-blur">
            {activeIdx + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-1">
          {photos.map((photo, idx) => {
            const active = idx === activeIdx
            return (
              <button
                key={photo.url + idx}
                onClick={() => setActiveIdx(idx)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={cn(
                  'relative shrink-0 overflow-hidden rounded-md transition-all',
                  'h-16 w-16 lg:h-20 lg:w-20',
                  active
                    ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper'
                    : 'opacity-70 hover:opacity-100'
                )}
                aria-label={`Фото ${idx + 1}`}
                aria-current={active ? 'true' : 'false'}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildProxyUrl(photo.url)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
