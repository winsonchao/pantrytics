import type { Ingredient, Recipe, StorageAdapter, UserSettings } from './types'
import { DEFAULT_SETTINGS, INITIAL_DEMO_INGREDIENTS, DEMO_SAVED_RECIPES } from './demoData'

const STORAGE_KEYS = {
  INGREDIENTS: 'pantrytics_ingredients_v1',
  SAVED_RECIPES: 'pantrytics_saved_recipes_v1',
  SETTINGS: 'pantrytics_settings_v1',
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

export class LocalStorageAdapter implements StorageAdapter {
  private inMemoryIngredients: Ingredient[] = []
  private inMemorySavedRecipes: Recipe[] = []
  private inMemorySettings: UserSettings = { ...DEFAULT_SETTINGS }

  constructor() {
    this.initIfEmpty()
  }

  private initIfEmpty() {
    if (!isBrowser()) {
      return
    }

    try {
      const existingIng = window.localStorage.getItem(STORAGE_KEYS.INGREDIENTS)
      if (!existingIng) {
        const demoIngs: Ingredient[] = INITIAL_DEMO_INGREDIENTS.map((item, index) => ({
          ...item,
          id: `demo-ing-${index + 1}`,
          createdAt: new Date(Date.now() - (10 - index) * 3600000).toISOString(),
          updatedAt: new Date().toISOString(),
        }))
        window.localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(demoIngs))
      }

      const existingRecipes = window.localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES)
      if (!existingRecipes) {
        window.localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(DEMO_SAVED_RECIPES))
      }

      const existingSettings = window.localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (!existingSettings) {
        window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS))
      }
    } catch (e) {
      console.warn('Failed to access localStorage during initialization:', e)
    }
  }

  async getIngredients(): Promise<Ingredient[]> {
    if (!isBrowser()) return this.inMemoryIngredients
    try {
      this.initIfEmpty()
      const raw = window.localStorage.getItem(STORAGE_KEYS.INGREDIENTS)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  async getIngredientById(id: string): Promise<Ingredient | null> {
    const list = await this.getIngredients()
    return list.find((i) => i.id === id) || null
  }

  async addIngredient(
    item: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Ingredient> {
    const list = await this.getIngredients()
    const now = new Date().toISOString()
    const newIngredient: Ingredient = {
      ...item,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    const updated = [newIngredient, ...list]
    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(updated))
    } else {
      this.inMemoryIngredients = updated
    }
    return newIngredient
  }

  async batchAddIngredients(
    items: Array<Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Ingredient[]> {
    const list = await this.getIngredients()
    const now = new Date().toISOString()
    const newIngredients: Ingredient[] = items.map((item) => ({
      ...item,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }))
    const updated = [...newIngredients, ...list]
    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(updated))
    } else {
      this.inMemoryIngredients = updated
    }
    return newIngredients
  }

  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<Ingredient> {
    const list = await this.getIngredients()
    const index = list.findIndex((i) => i.id === id)
    if (index === -1) {
      throw new Error(`Ingredient with id ${id} not found`)
    }
    const existing = list[index]!
    const updatedItem: Ingredient = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    list[index] = updatedItem
    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(list))
    } else {
      this.inMemoryIngredients = list
    }
    return updatedItem
  }

  async deleteIngredient(id: string): Promise<void> {
    const list = await this.getIngredients()
    const filtered = list.filter((i) => i.id !== id)
    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(filtered))
    } else {
      this.inMemoryIngredients = filtered
    }
  }

  async getSavedRecipes(): Promise<Recipe[]> {
    if (!isBrowser()) return this.inMemorySavedRecipes
    try {
      this.initIfEmpty()
      const raw = window.localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  async getSavedRecipeById(id: string): Promise<Recipe | null> {
    const list = await this.getSavedRecipes()
    return list.find((r) => r.id === id) || null
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    const list = await this.getSavedRecipes()
    const exists = list.some((r) => r.id === recipe.id)
    let updated: Recipe[]
    if (exists) {
      updated = list.map((r) => (r.id === recipe.id ? { ...recipe, isSaved: true } : r))
    } else {
      updated = [{ ...recipe, isSaved: true }, ...list]
    }
    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(updated))
    } else {
      this.inMemorySavedRecipes = updated
    }
  }

  async deleteSavedRecipe(id: string): Promise<void> {
    const list = await this.getSavedRecipes()
    const filtered = list.filter((r) => r.id !== id)
    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(filtered))
    } else {
      this.inMemorySavedRecipes = filtered
    }
  }

  async isRecipeSaved(id: string): Promise<boolean> {
    const list = await this.getSavedRecipes()
    return list.some((r) => r.id === id)
  }

  async getSettings(): Promise<UserSettings> {
    if (!isBrowser()) return this.inMemorySettings
    try {
      this.initIfEmpty()
      const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS)
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings()
    const updated: UserSettings = {
      ...current,
      ...settings,
    }
    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated))
    } else {
      this.inMemorySettings = updated
    }
    return updated
  }

  async resetDemoData(): Promise<void> {
    if (!isBrowser()) return
    const demoIngs: Ingredient[] = INITIAL_DEMO_INGREDIENTS.map((item, index) => ({
      ...item,
      id: `demo-ing-${index + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    window.localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(demoIngs))
    window.localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(DEMO_SAVED_RECIPES))
  }

  async clearAllData(): Promise<void> {
    if (!isBrowser()) return
    window.localStorage.removeItem(STORAGE_KEYS.INGREDIENTS)
    window.localStorage.removeItem(STORAGE_KEYS.SAVED_RECIPES)
  }
}

export const localStorageAdapter = new LocalStorageAdapter()
