/**
 * Input, Textarea, Label, FormError — базовые форм-примитивы.
 */

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type LabelHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-md border border-hair-2 bg-surface-hi px-3.5 text-sm',
          'placeholder:text-ink-4',
          'focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10',
          'transition-colors duration-150',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full rounded-md border border-hair-2 bg-surface-hi px-3.5 py-3 text-sm leading-relaxed',
        'placeholder:text-ink-4',
        'focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'min-h-[100px]',
        className
      )}
      {...props}
    />
  )
})

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  function Label({ className, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={cn(
          'mb-1.5 block font-mono text-[10.5px] uppercase tracking-wider text-ink-3',
          className
        )}
        {...props}
      />
    )
  }
)

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="mt-1.5 text-xs text-cinnabar">{children}</p>
}

export function FormHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-ink-3">{children}</p>
}

export function FormField({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

/* ─── Checkbox ─────────────────────────────────────────────────────── */

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  children: ReactNode
  error?: string | null
  className?: string
}

export function Checkbox({
  checked,
  onChange,
  id,
  children,
  error,
  className,
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3',
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          'mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded border transition-colors',
          checked
            ? 'border-ink bg-ink'
            : error
            ? 'border-cinnabar bg-surface-hi'
            : 'border-hair-2 bg-surface-hi peer-focus-visible:border-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink/10',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-ink/10'
        )}
        aria-hidden="true"
      >
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path
              d="M1 4.5L4 7.5L10 1.5"
              stroke="#F7F5F0"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="flex-1 text-sm leading-relaxed text-ink-2">{children}</span>
    </label>
  )
}

/* ─── SegmentControl (для toggle физ/юр) ───────────────────────────── */

interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface SegmentControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-grid w-full overflow-hidden rounded-full bg-paper-2 p-1',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease',
              active
                ? 'bg-ink text-paper shadow-soft'
                : 'bg-transparent text-ink-2 hover:text-ink'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
