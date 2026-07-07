/**
 * robots.txt — динамический, зависит от текущего сайта.
 *
 * Каждый из 3 инстансов отдаёт свой robots с ссылкой на свой sitemap.
 */

import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/account/', '/checkout/'],
      },
    ],
    sitemap: `${siteConfig.origin}/sitemap.xml`,
    host: siteConfig.host,
  }
}
