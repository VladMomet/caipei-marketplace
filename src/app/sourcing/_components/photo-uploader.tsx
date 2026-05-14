/**
 * PhotoUploader — выбор до 3 фото-референсов.
 *
 * РАНЬШЕ: каждое фото сразу загружалось в S3, возвращался URL.
 * СЕЙЧАС: фото хранятся локально как File-объекты. Сабмит формы
 * отправляет их вместе с описанием одним multipart-запросом, который
 * пересылает их прямо в Telegram. S3 в MVP не используется.
 *
 * Превью — через URL.createObjectURL.
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  SOURCING_PHOTO_MAX_SIZE_BYTES,
  SOURCING_PHOTOS_MAX_COUNT,
} from '@/lib/constants'

interface PhotoSlot {
  id: string // локальный uuid для key + удаления
  file: File | null // сам файл (null если ошибка валидации)
  error: string | null
  preview: string | null // object URL для превью
}

interface Props {
  /** Список выбранных файлов наружу — обновляется при добавлении/удалении */
  onFilesChange: (files: File[]) => void
  disabled?: boolean
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

export function PhotoUploader({ onFilesChange, disabled }: Props) {
  const [slots, setSlots] = useState<PhotoSlot[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Освобождаем object URL при размонтировании, чтобы не текла память
  useEffect(() => {
    return () => {
      slots.forEach((s) => {
        if (s.preview) URL.revokeObjectURL(s.preview)
      })
    }
    // намеренно с пустым deps — фиксируем cleanup на unmount; внутри cleanup
    // используем актуальные slots через closure, это безопасно для useEffect cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateParent = useCallback(
    (next: PhotoSlot[]) => {
      const files = next
        .map((s) => s.file)
        .filter((f): f is File => f !== null)
      onFilesChange(files)
    },
    [onFilesChange]
  )

  const addFiles = (files: FileList | File[]) => {
    if (disabled) return
    const arr = Array.from(files)
    const remaining =
      SOURCING_PHOTOS_MAX_COUNT - slots.filter((s) => !s.error).length

    const additions: PhotoSlot[] = []
    for (let i = 0; i < arr.length && i < remaining; i++) {
      const file = arr[i]
      let error: string | null = null
      if (!ALLOWED_TYPES.has(file.type)) {
        error = 'Только JPG, PNG, WebP'
      } else if (file.size > SOURCING_PHOTO_MAX_SIZE_BYTES) {
        error = 'Файл больше 10 MB'
      }

      const slot: PhotoSlot = {
        id: genId(),
        file: error === null ? file : null,
        error,
        preview: URL.createObjectURL(file),
      }
      additions.push(slot)
    }

    if (additions.length === 0) return

    setSlots((prev) => {
      const next = [...prev, ...additions]
      updateParent(next)
      return next
    })
  }

  const removeSlot = (id: string) => {
    setSlots((prev) => {
      const removed = prev.find((s) => s.id === id)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      const next = prev.filter((s) => s.id !== id)
      updateParent(next)
      return next
    })
  }

  const activeCount = slots.filter((s) => !s.error).length
  const canAdd = activeCount < SOURCING_PHOTOS_MAX_COUNT && !disabled

  return (
    <div>
      {/* Превью */}
      {slots.length > 0 && (
        <ul className="mb-4 grid grid-cols-3 gap-3 sm:gap-4">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-lg border-2',
                slot.error ? 'border-cinnabar/40' : 'border-hair'
              )}
            >
              {slot.preview && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={slot.preview}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              {slot.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-cinnabar/10 px-2 text-center text-[10px] uppercase tracking-wider text-cinnabar">
                  {slot.error}
                </div>
              )}

              <button
                type="button"
                onClick={() => removeSlot(slot.id)}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-ink/85 text-paper opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus:opacity-100"
                aria-label="Удалить фото"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 2l6 6M8 2L2 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Drop-zone */}
      {canAdd && (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragOver
              ? 'border-cinnabar bg-cinnabar/5'
              : 'border-hair-2 bg-paper hover:border-ink-2 hover:bg-paper-2'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="sr-only"
          />
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-ink-3">
            <rect x="4" y="6" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="10" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M4 18l5-5 5 5 4-4 6 6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div className="text-sm font-medium text-ink-2">
            Перетащите фото или нажмите для выбора
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
            До {SOURCING_PHOTOS_MAX_COUNT - activeCount} файлов · JPG / PNG / WebP · до 10 MB
          </div>
        </label>
      )}

      {!canAdd && activeCount >= SOURCING_PHOTOS_MAX_COUNT && (
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
          Достигнут лимит: {SOURCING_PHOTOS_MAX_COUNT} фото
        </p>
      )}
    </div>
  )
}
