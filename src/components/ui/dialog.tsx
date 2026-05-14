/**
 * Dialog — модальное окно по центру.
 *
 * Использование:
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogHeader>
 *       <DialogTitle>Заголовок</DialogTitle>
 *     </DialogHeader>
 *     <DialogBody>...</DialogBody>
 *     <DialogFooter>...</DialogFooter>
 *   </Dialog>
 */

'use client'

import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  /** Максимальная ширина диалога (Tailwind class) */
  maxWidthClass?: string
}

export function Dialog({
  open,
  onOpenChange,
  children,
  maxWidthClass = 'max-w-[560px]',
}: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <>
      <style jsx global>{`
        @keyframes dialogIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm animate-[fadeIn_220ms_ease]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'pointer-events-auto w-full overflow-hidden rounded-xl bg-paper shadow-2xl',
            'animate-[dialogIn_240ms_cubic-bezier(0.22,1,0.36,1)]',
            maxWidthClass
          )}
        >
          {children}
        </div>
      </div>
    </>
  )
}

export function DialogHeader({
  children,
  onClose,
}: {
  children: ReactNode
  onClose?: () => void
}) {
  return (
    <header className="flex items-center justify-between border-b border-hair px-7 py-5">
      <div>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink"
          aria-label="Закрыть"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </header>
  )
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl font-medium tracking-tight">{children}</h2>
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-sm text-ink-3">{children}</p>
}

export function DialogBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('px-7 py-6', className)}>{children}</div>
}

export function DialogFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <footer
      className={cn(
        'flex items-center justify-end gap-3 border-t border-hair bg-surface-hi px-7 py-5',
        className
      )}
    >
      {children}
    </footer>
  )
}
