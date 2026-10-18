export type IngredientCategory =
  | 'vegetable'   // 蔬菜
  | 'meat'        // 肉類
  | 'seafood'     // 海鮮
  | 'dairy_egg'   // 蛋豆乳製品
  | 'fruit'       // 水果
  | 'grain'       // 主食穀物
  | 'seasoning'   // 調味料
  | 'other'       // 其他

export type StorageLocation = 'fridge' | 'freezer' | 'room' // 冷藏 / 冷凍 / 常溫

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  quantity: number
  unit: string
  storageLocation: StorageLocation
  expiryDate?: string // YYYY-MM-DD
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CookingStep {
  stepNumber: number
  instruction: string
  tip?: string
  timerSeconds?: number // Optional timer in seconds
}

export interface RecipeIngredientItem {
  name: string
  amount: string
  isPantryItem: boolean
}

export interface Recipe {
  id: string
  title: string
  description: string
  cookingTimeMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  servings: number
  calories?: number
  matchedIngredients: string[]
  missingIngredients: string[]
  ingredientsList: RecipeIngredientItem[]
  prepSteps: string[]
  cookingSteps: CookingStep[]
  chefTips: string[]
  createdAt: string
  isSaved?: boolean
}

export interface UserSettings {
  geminiApiKey: string
  geminiModel: string
  storageType: 'localStorage' | 'supabase'
  supabaseUrl?: string
  supabaseAnonKey?: string
  dietaryPreferences: string[]
  defaultServings: number
}

export interface StorageAdapter {
  getIngredients(): Promise<Ingredient[]>
  getIngredientById(id: string): Promise<Ingredient | null>
  addIngredient(item: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ingredient>
  batchAddIngredients(items: Array<Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Ingredient[]>
  updateIngredient(id: string, updates: Partial<Ingredient>): Promise<Ingredient>
  deleteIngredient(id: string): Promise<void>

  getSavedRecipes(): Promise<Recipe[]>
  getSavedRecipeById(id: string): Promise<Recipe | null>
  saveRecipe(recipe: Recipe): Promise<void>
  deleteSavedRecipe(id: string): Promise<void>
  isRecipeSaved(id: string): Promise<boolean>

  getSettings(): Promise<UserSettings>
  updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>

  resetDemoData(): Promise<void>
  clearAllData(): Promise<void>
}
