import { localStorageAdapter } from './localStorageAdapter'
import { supabaseAdapter } from './supabaseAdapter'
import type { StorageAdapter, IngredientCategory, StorageLocation } from './types'

export * from './types'
export { localStorageAdapter } from './localStorageAdapter'
export { supabaseAdapter } from './supabaseAdapter'

export function getStorage(): StorageAdapter {
  return localStorageAdapter
}

export const CATEGORY_LABELS: Record<IngredientCategory, { label: string; icon: string; color: string }> = {
  vegetable: { label: '蔬菜時蔬', icon: '🥬', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  meat: { label: '肉類禽類', icon: '🥩', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  seafood: { label: '海鮮水產', icon: '🦐', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  dairy_egg: { label: '蛋豆乳品', icon: '🥚', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  fruit: { label: '新鮮水果', icon: '🍎', color: 'bg-red-50 text-red-700 border-red-200' },
  grain: { label: '主食穀物', icon: '🍚', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  seasoning: { label: '調味佐料', icon: '🧂', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  other: { label: '其他食材', icon: '🥫', color: 'bg-slate-50 text-slate-700 border-slate-200' },
}

export const STORAGE_LOCATION_LABELS: Record<StorageLocation, { label: string; icon: string }> = {
  fridge: { label: '冷藏區', icon: '❄️' },
  freezer: { label: '冷凍庫', icon: '🧊' },
  room: { label: '常溫乾燥', icon: '🧺' },
}
