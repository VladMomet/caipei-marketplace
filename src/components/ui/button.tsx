/**
 * Button — основной примитив. Pill-форма, варианты primary/secondary/ghost.
 *
 * Использование:
 *   <Button>Click</Button>
 *   <Button variant="secondary" size="lg">Click</Button>
 *   <Button asChild><Link href="/">Link</Link></Button>  ← пока не используем, но возможно
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'cinnabar'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:bg-cinnabar transition-colors duration-200 ease',
  secondary:
    'border border-ink-2 bg-transparent text-ink hover:bg-ink hover:text-paper transition-colors duration-200 ease',
  ghost:
    'bg-transparent text-ink hover:bg-paper-2 transition-colors duration-200 ease',
  cinnabar:
    'bg-cinnabar text-surface-hi hover:bg-cinnabar-2 transition-colors duration-200 ease',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'
