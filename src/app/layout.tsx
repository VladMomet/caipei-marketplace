import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/providers'
import { Ticker } from '@/components/header/ticker'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer'
import { CookieBanner } from '@/components/cookie-banner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CaiPei — Украшения и аксессуары из Китая оптом',
    template: '%s · CaiPei',
  },
  description:
    'B2B-маркетплейс украшений и аксессуаров из Китая. Прозрачная цена сразу с доставкой, ВЭД и документами. Минимум — от 10 шт, доставка 14–45 дней.',
  metadataBase: new URL(
    process.env.AUTH_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  openGraph: {
    title: 'CaiPei — Украшения и аксессуары из Китая оптом',
    description: 'B2B-маркетплейс с прозрачной ценой и белой ВЭД',
    type: 'website',
    locale: 'ru_RU',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4EFE6' },
    { media: '(prefers-color-scheme: dark)', color: '#F4EFE6' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <Ticker />
          <Header />
          <main className="min-h-[calc(100vh-160px)]">{children}</main>
          <Footer />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
