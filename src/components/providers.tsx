/**
 * Providers — клиентские провайдеры верхнего уровня (SessionProvider и др.)
 *
 * Используется в RootLayout.
 */

'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
