/**
 * useCart — хук работы с корзиной в localStorage.
 *
 * Хранит снэпшот товара: id, sku, название, фото, цена в Москве для МАЛОЙ
 * и для БОЛЬШОЙ партии (basePriceRub / volumePriceRub), порог опта,
 * цена отображения с учётом текущего города (priceRub), количество.
 *
 * MOQ — 10 шт на позицию. Уменьшить ниже 10 нельзя — есть кнопка «Удалить».
 *
 * Двухтарифная модель: если qty >= volumeThresholdQty (по умолчанию 2000),
 * unitPrice берётся из volumePriceRub. Иначе — из basePriceRub.
 *
 * Синхронизация между табами — событие 'storage'.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { applyCityMultiplier } from '@/lib/city-pricing'
import { MIN_QTY_PER_LINE, VOLUME_DISCOUNT_THRESHOLD } from '@/lib/constants'

const STORAGE_KEY = 'caipei-cart'

/** Минимальное количество штук на одну позицию */
export const MIN_QTY = MIN_QTY_PER_LINE

export interface CartItem {
  productId: string
  sku: string
  title: string
  photo: string | null
  /** Базовая цена за 1 шт (Москва, малая партия) */
  basePriceRub: number
  /** Цена за 1 шт при опте (Москва, от volumeThresholdQty) */
  volumePriceRub: number
  /** Порог опта в штуках */
  volumeThresholdQty: number
  /** Цена отображения с учётом города и текущего qty (tier) */
  priceRub: number
  qty: number
}

interface CartState {
  items: CartItem[]
  totalUnits: number
  totalRub: number
}

/** Цена за 1 шт с учётом tier и города */
function calcDisplayPrice(
  basePrice: number,
  volumePrice: number,
  threshold: number,
  qty: number,
  citySlug: string | null | undefined
): number {
  const base = qty >= threshold ? volumePrice : basePrice
  return applyCityMultiplier(base, citySlug)
}

function readStorage(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (it): it is Partial<CartItem> =>
          typeof it === 'object' &&
          it !== null &&
          typeof it.productId === 'string' &&
          typeof it.qty === 'number' &&
          it.qty > 0
      )
      .map((it) => {
        const priceRub = typeof it.priceRub === 'number' ? it.priceRub : 0
        const basePriceRub =
          typeof it.basePriceRub === 'number' ? it.basePriceRub : priceRub
        const volumePriceRub =
          typeof it.volumePriceRub === 'number' ? it.volumePriceRub : basePriceRub
        const volumeThresholdQty =
          typeof it.volumeThresholdQty === 'number'
            ? it.volumeThresholdQty
            : VOLUME_DISCOUNT_THRESHOLD
        // Поднимаем qty в БД-минимум если со старой корзины пришла единичка/пятёрка
        const qty = Math.max(it.qty!, MIN_QTY)
        return {
          productId: it.productId!,
          sku: typeof it.sku === 'string' ? it.sku : '',
          title: typeof it.title === 'string' ? it.title : '',
          photo: typeof it.photo === 'string' ? it.photo : null,
          basePriceRub,
          volumePriceRub,
          volumeThresholdQty,
          priceRub,
          qty,
        }
      })
  } catch {
    return []
  }
}

function writeStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('caipei:cart-updated'))
  } catch {
    /* silent */
  }
}

function calc(items: CartItem[]): CartState {
  let totalUnits = 0
  let totalRub = 0
  for (const it of items) {
    totalUnits += it.qty
    totalRub += it.qty * it.priceRub
  }
  return { items, totalUnits, totalRub }
}

export function useCart() {
  const [state, setState] = useState<CartState>(() => calc(readStorage()))

  useEffect(() => {
    const handler = () => setState(calc(readStorage()))

    const onCityChange = (e: Event) => {
      const detail = (e as CustomEvent<{ slug?: string | null }>).detail
      const newSlug = detail?.slug ?? null
      const current = readStorage()
      if (current.length === 0) return
      const next = current.map((it) => ({
        ...it,
        priceRub: calcDisplayPrice(
          it.basePriceRub,
          it.volumePriceRub,
          it.volumeThresholdQty,
          it.qty,
          newSlug
        ),
      }))
      writeStorage(next)
    }

    window.addEventListener('storage', handler)
    window.addEventListener('caipei:cart-updated', handler)
    window.addEventListener('caipei:city-changed', onCityChange)
    handler()

    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('caipei:cart-updated', handler)
      window.removeEventListener('caipei:city-changed', onCityChange)
    }
  }, [])

  /**
   * Добавить товар.
   */
  const add = useCallback(
    (item: {
      productId: string
      sku: string
      title: string
      photo: string | null
      basePriceRub: number
      volumePriceRub: number
      volumeThresholdQty?: number
      citySlug: string | null | undefined
      qty?: number
    }) => {
      const current = readStorage()
      const threshold = item.volumeThresholdQty ?? VOLUME_DISCOUNT_THRESHOLD
      const addQty = item.qty ?? MIN_QTY
      const existing = current.find((it) => it.productId === item.productId)
      let next: CartItem[]
      if (existing) {
        const newQty = existing.qty + addQty
        next = current.map((it) =>
          it.productId === item.productId
            ? {
                ...it,
                qty: newQty,
                basePriceRub: item.basePriceRub,
                volumePriceRub: item.volumePriceRub,
                volumeThresholdQty: threshold,
                priceRub: calcDisplayPrice(
                  item.basePriceRub,
                  item.volumePriceRub,
                  threshold,
                  newQty,
                  item.citySlug
                ),
              }
            : it
        )
      } else {
        const qty = Math.max(addQty, MIN_QTY)
        next = [
          ...current,
          {
            productId: item.productId,
            sku: item.sku,
            title: item.title,
            photo: item.photo,
            basePriceRub: item.basePriceRub,
            volumePriceRub: item.volumePriceRub,
            volumeThresholdQty: threshold,
            priceRub: calcDisplayPrice(
              item.basePriceRub,
              item.volumePriceRub,
              threshold,
              qty,
              item.citySlug
            ),
            qty,
          },
        ]
      }
      writeStorage(next)
    },
    []
  )

  /** Пересчитать все цены под новый город (используется в useCity.select). */
  const recalcForCity = useCallback((citySlug: string | null | undefined) => {
    const current = readStorage()
    const next = current.map((it) => ({
      ...it,
      priceRub: calcDisplayPrice(
        it.basePriceRub,
        it.volumePriceRub,
        it.volumeThresholdQty,
        it.qty,
        citySlug
      ),
    }))
    writeStorage(next)
  }, [])

  const setQty = useCallback((productId: string, qty: number, citySlug?: string | null) => {
    const current = readStorage()
    if (qty < MIN_QTY) {
      writeStorage(current.filter((it) => it.productId !== productId))
      return
    }
    writeStorage(
      current.map((it) =>
        it.productId === productId
          ? {
              ...it,
              qty,
              priceRub: calcDisplayPrice(
                it.basePriceRub,
                it.volumePriceRub,
                it.volumeThresholdQty,
                qty,
                citySlug
              ),
            }
          : it
      )
    )
  }, [])

  const remove = useCallback((productId: string) => {
    const current = readStorage()
    writeStorage(current.filter((it) => it.productId !== productId))
  }, [])

  const clear = useCallback(() => {
    writeStorage([])
  }, [])

  const getQty = useCallback(
    (productId: string): number => {
      const found = state.items.find((it) => it.productId === productId)
      return found?.qty ?? 0
    },
    [state.items]
  )

  return {
    items: state.items,
    totalUnits: state.totalUnits,
    totalRub: state.totalRub,
    isEmpty: state.items.length === 0,
    add,
    setQty,
    remove,
    clear,
    getQty,
    recalcForCity,
    MIN_QTY,
  }
}
