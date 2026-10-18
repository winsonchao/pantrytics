import type { Ingredient, Recipe, StorageAdapter, UserSettings } from './types'
import { localStorageAdapter } from './localStorageAdapter'

/**
 * SupabaseAdapter is prepared for seamless future migration to Supabase.
 *
 * Suggested Supabase Table Schema:
 *
 * 1. Table: ingredients
 *    - id: uuid primary key default gen_random_uuid()
 *    - user_id: uuid references auth.users(id) default auth.uid()
 *    - name: text not null
 *    - category: text not null
 *    - quantity: numeric not null
 *    - unit: text not null
 *    - storage_location: text not null
 *    - expiry_date: date
 *    - notes: text
 *    - created_at: timestamptz default now()
 *    - updated_at: timestamptz default now()
 *
 * 2. Table: saved_recipes
 *    - id: text primary key
 *    - user_id: uuid references auth.users(id) default auth.uid()
 *    - data: jsonb not null
 *    - created_at: timestamptz default now()
 *
 * 3. Table: user_settings
 *    - user_id: uuid primary key references auth.users(id) default auth.uid()
 *    - settings: jsonb not null
 *    - updated_at: timestamptz default now()
 */
export class SupabaseAdapter implements StorageAdapter {
  private url?: string
  private anonKey?: string

  constructor(config?: { url: string; anonKey: string }) {
    this.url = config?.url
    this.anonKey = config?.anonKey
  }

  isConfigured(): boolean {
    return Boolean(this.url && this.anonKey)
  }

  async getIngredients(): Promise<Ingredient[]> {
    if (!this.isConfigured()) {
      // Fallback to local storage when Supabase is not yet configured
      return localStorageAdapter.getIngredients()
    }
    // Future Supabase call:
    // const { data, error } = await supabase.from('ingredients').select('*').order('created_at', { ascending: false })
    return localStorageAdapter.getIngredients()
  }

  async getIngredientById(id: string): Promise<Ingredient | null> {
    if (!this.isConfigured()) return localStorageAdapter.getIngredientById(id)
    return localStorageAdapter.getIngredientById(id)
  }

  async addIngredient(
    item: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Ingredient> {
    if (!this.isConfigured()) return localStorageAdapter.addIngredient(item)
    return localStorageAdapter.addIngredient(item)
  }

  async batchAddIngredients(
    items: Array<Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Ingredient[]> {
    if (!this.isConfigured()) return localStorageAdapter.batchAddIngredients(items)
    return localStorageAdapter.batchAddIngredients(items)
  }

  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<Ingredient> {
    if (!this.isConfigured()) return localStorageAdapter.updateIngredient(id, updates)
    return localStorageAdapter.updateIngredient(id, updates)
  }

  async deleteIngredient(id: string): Promise<void> {
    if (!this.isConfigured()) return localStorageAdapter.deleteIngredient(id)
    return localStorageAdapter.deleteIngredient(id)
  }

  async getSavedRecipes(): Promise<Recipe[]> {
    if (!this.isConfigured()) return localStorageAdapter.getSavedRecipes()
    return localStorageAdapter.getSavedRecipes()
  }

  async getSavedRecipeById(id: string): Promise<Recipe | null> {
    if (!this.isConfigured()) return localStorageAdapter.getSavedRecipeById(id)
    return localStorageAdapter.getSavedRecipeById(id)
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    if (!this.isConfigured()) return localStorageAdapter.saveRecipe(recipe)
    return localStorageAdapter.saveRecipe(recipe)
  }

  async deleteSavedRecipe(id: string): Promise<void> {
    if (!this.isConfigured()) return localStorageAdapter.deleteSavedRecipe(id)
    return localStorageAdapter.deleteSavedRecipe(id)
  }

  async isRecipeSaved(id: string): Promise<boolean> {
    if (!this.isConfigured()) return localStorageAdapter.isRecipeSaved(id)
    return localStorageAdapter.isRecipeSaved(id)
  }

  async getSettings(): Promise<UserSettings> {
    return localStorageAdapter.getSettings()
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return localStorageAdapter.updateSettings(settings)
  }

  async resetDemoData(): Promise<void> {
    return localStorageAdapter.resetDemoData()
  }

  async clearAllData(): Promise<void> {
    return localStorageAdapter.clearAllData()
  }
}

export const supabaseAdapter = new SupabaseAdapter()
