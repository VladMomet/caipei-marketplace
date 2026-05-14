/**
 * Бейджи статусов для заказов и заявок на подбор.
 * Цвет соответствует семантике: 'new' нейтральный, 'completed' зелёный, и т.д.
 */

import { cn } from '@/lib/utils'

const ORDER_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  new: { label: 'Новый', tone: 'bg-paper-2 text-ink-2 border-hair-2' },
  in_progress: { label: 'В работе', tone: 'bg-ochre/10 text-ochre border-ochre/30' },
  completed: { label: 'Выполнен', tone: 'bg-positive/10 text-positive border-positive/30' },
  cancelled: { label: 'Отменён', tone: 'bg-cinnabar/10 text-cinnabar border-cinnabar/30' },
}

const SOURCING_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  new: { label: 'Принята', tone: 'bg-paper-2 text-ink-2 border-hair-2' },
  in_progress: { label: 'В поиске', tone: 'bg-ochre/10 text-ochre border-ochre/30' },
  completed: { label: 'Закрыта', tone: 'bg-positive/10 text-positive border-positive/30' },
  cancelled: { label: 'Отменена', tone: 'bg-cinnabar/10 text-cinnabar border-cinnabar/30' },
}

interface BadgeProps {
  status: string
  type?: 'order' | 'sourcing'
  className?: string
}

export function StatusBadge({ status, type = 'order', className }: BadgeProps) {
  const map = type === 'sourcing' ? SOURCING_STATUS_LABELS : ORDER_STATUS_LABELS
  const meta = map[status] ?? { label: status, tone: 'bg-paper-2 text-ink-2 border-hair-2' }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
        meta.tone,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {meta.label}
    </span>
  )
}
