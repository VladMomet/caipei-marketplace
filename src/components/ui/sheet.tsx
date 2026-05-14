/**
 * Sheet — drawer выезжающий справа/снизу.
 *
 * Использование:
 *   const [open, setOpen] = useState(false)
 *   <Sheet open={open} onOpenChange={setOpen} side="right">
 *     <SheetHeader>
 *       <SheetTitle>Корзина</SheetTitle>
 *     </SheetHeader>
 *     <SheetBody>...</SheetBody>
 *     <SheetFooter>...</SheetFooter>
 *   </Sheet>
 *
 * Анимации — обычным CSS в globals.css (классы caipei-sheet-right / caipei-sheet-backdrop).
 * Это надёжнее, чем styled-jsx, который иногда отваливается на serverless.
 */

'use client'

import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'right' | 'bottom' | 'left'
  children: ReactNode
  /** Ширина drawer'а на десктопе — Tailwind class */
  widthClassName?: string
}

export function Sheet({
  open,
  onOpenChange,
  side = 'right',
  children,
  widthClassName = 'w-[440px]',
}: SheetProps) {
  // Закрывать по Escape, блокировать скролл body
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onOpenChange])

  if (!open) return null

  const sideClasses = {
    right: cn('right-0 top-0 h-[100dvh]', widthClassName, 'max-w-full', 'caipei-sheet-right'),
    left: cn('left-0 top-0 h-[100dvh]', widthClassName, 'max-w-full', 'caipei-sheet-left'),
    bottom: 'bottom-0 left-0 w-full max-h-[90dvh] caipei-sheet-bottom',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="caipei-sheet-backdrop fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-50 flex flex-col bg-paper shadow-2xl',
          side === 'bottom' ? 'rounded-t-xl' : '',
          sideClasses[side]
        )}
      >
        {children}
      </aside>
    </>
  )
}

export function SheetHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-none items-center justify-between border-b border-hair px-5 py-4 lg:px-6 lg:py-5',
        className
      )}
    >
      {children}
    </header>
  )
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-xl font-medium tracking-tight">{children}</h2>
  )
}

export function SheetClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink"
      aria-label="Закрыть"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2 2l10 10M12 2L2 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}

export function SheetBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5 lg:px-6 lg:py-6', className)}>
      {children}
    </div>
  )
}

export function SheetFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <footer
      className={cn(
        'border-t border-hair bg-surface-hi px-6 py-5',
        className
      )}
    >
      {children}
    </footer>
  )
}
