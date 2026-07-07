/**
 * Yandex.Metrika — счётчик статистики.
 *
 * Особенности:
 * 1. В App Router переходы между страницами идут через клиентский роутер (без перезагрузки).
 *    Метрика по умолчанию отправит только первый `hit` — при загрузке страницы.
 *    Мы вручную триггерим `hit` при каждом изменении pathname через хук.
 * 2. Скрипт грузится через next/script со стратегией `afterInteractive` — после гидратации,
 *    чтобы не блокировать первый рендер.
 * 3. metrikaId берётся из getClientSiteConfig, у каждого tier'а свой. Если у tier'а
 *    metrikaId=null — компонент ничего не рендерит.
 * 4. `noscript` фолбэк для клиентов без JS оставлен по канону из панели Метрики.
 */

'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { getClientSiteConfig } from '@/lib/site-config'

// TypeScript: `ym` глобальная функция, добавляемая скриптом Метрики.
declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void
  }
}

/**
 * Хук: следит за pathname + searchParams и триггерит `hit` в Метрику при каждом
 * клиентском переходе (SPA-навигация через Link/router.push).
 */
function useMetrikaPageview(metrikaId: number) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ym) return
    const query = searchParams?.toString()
    const url = query ? `${pathname}?${query}` : pathname
    window.ym(metrikaId, 'hit', url)
  }, [metrikaId, pathname, searchParams])
}

/**
 * Внутренний компонент — обёрнут в Suspense т.к. useSearchParams требует Suspense boundary.
 */
function MetrikaPageviewTracker({ metrikaId }: { metrikaId: number }) {
  useMetrikaPageview(metrikaId)
  return null
}

export function YandexMetrica() {
  const site = getClientSiteConfig()
  const metrikaId = site.metrikaId

  if (!metrikaId) return null

  return (
    <>
      <Script id="yandex-metrika-init" strategy="afterInteractive">
        {`
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
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>

      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${metrikaId}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>

      <Suspense fallback={null}>
        <MetrikaPageviewTracker metrikaId={metrikaId} />
      </Suspense>
    </>
  )
}
