/**
 * Yandex.Metrika — счётчик статистики.
 *
 * SPA-совместимая обработка: при клиентской навигации через Link/router.push
 * вручную вызываем ym('hit', url) — стандартный скрипт Метрики этого не делает.
 *
 * ВАЖНО: компонент разделён на два — Script (грузим при монтировании один раз)
 * и Tracker (только при клиентской навигации, обёрнут в Suspense из-за useSearchParams).
 * Оба помечены 'use client' — на сервере ничего не рендерят, поэтому SSR/CSR
 * не расходятся.
 */

'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getClientSiteConfig } from '@/lib/site-config'

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void
  }
}

function Tracker({ metrikaId }: { metrikaId: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ym) return
    const query = searchParams?.toString()
    const url = query ? `${pathname}?${query}` : pathname
    window.ym(metrikaId, 'hit', url)
  }, [metrikaId, pathname, searchParams])

  return null
}

export function YandexMetrica() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const site = getClientSiteConfig()
  const metrikaId = site.metrikaId

  if (!metrikaId) return null
  if (!mounted) return null

  return (
    <>
      <Script
        id="yandex-metrika-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) { return; }
              }
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,
              a.parentNode.insertBefore(k,a)
            })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${metrikaId}', 'ym');
            ym(${metrikaId}, 'init', {
              webvisor: true,
              clickmap: true,
              ecommerce: "dataLayer",
              accurateTrackBounce: true,
              trackLinks: true
            });
          `,
        }}
      />

      <Suspense fallback={null}>
        <Tracker metrikaId={metrikaId} />
      </Suspense>
    </>
  )
}
