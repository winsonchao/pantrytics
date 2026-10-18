import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Camera,
  Sparkles,
  Package,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Flame,
  ChefHat,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { localStorageAdapter } from '../lib/storage/localStorageAdapter'
import type { Ingredient, Recipe } from '../lib/storage/types'
import { CATEGORY_LABELS } from '../lib/storage'
import { RecipeModal } from '../components/RecipeModal'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const navigate = useNavigate()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [ings, recipes] = await Promise.all([
        localStorageAdapter.getIngredients(),
        localStorageAdapter.getSavedRecipes(),
      ])
      setIngredients(ings)
      setSavedRecipes(recipes)
      setLoading(false)
    }
    loadData()
  }, [])

  // Calculate expiring ingredients (within 3 days or already expired)
  const now = new Date()
  const threeDaysLater = new Date(Date.now() + 3 * 86400000)

  const expiringItems = ingredients.filter((item) => {
    if (!item.expiryDate) return false
    const exp = new Date(item.expiryDate)
    return exp <= threeDaysLater
  })

  // Group by category counts
  const categoryCounts = ingredients.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-xl shadow-orange-500/10 p-6 sm:p-10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            AI 智慧廚房小助手
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            拍張照片，一鍵辨識食材！<br className="hidden sm:inline" />
            依照冰箱現有庫存，變出滿桌美味。
          </h1>
          <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
            不用再煩惱「今天晚餐要煮什麼」！拍照快速記錄冰箱食材，由 Gemini AI 為您量身定制精準食譜與詳細步驟教學。
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-bold text-sm shadow-md transition-all hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              拍照辨識食物
            </Link>
            <Link
              to="/recipes"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-700/80 hover:bg-orange-800 text-white font-bold text-sm border border-orange-400/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              依庫存推薦食譜
            </Link>
            <Link
              to="/pantry"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-bold text-sm transition-all"
            >
              <Package className="w-4 h-4" />
              查看食材庫存 ({ingredients.length})
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <ChefHat className="w-96 h-96 -mr-16 text-white" />
        </div>
      </div>

      {/* Expiring Alert Banner if any */}
      {expiringItems.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                注意！有 {expiringItems.length} 項食材即將過期或已過期
              </h3>
              <p className="text-xs sm:text-sm text-rose-700">
                建議優先烹飪：{expiringItems.map((i) => i.name).join('、')}
              </p>
            </div>
          </div>
          <Link
            to="/recipes"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shrink-0 shadow-sm transition-colors"
          >
            立即用這些食材做菜
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">現有食材總數</div>
            <div className="text-2xl font-extrabold text-slate-800">{ingredients.length} 項</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">即將在 3 天內過期</div>
            <div className={`text-2xl font-extrabold ${expiringItems.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {expiringItems.length} 項
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">已收藏食譜</div>
            <div className="text-2xl font-extrabold text-slate-800">{savedRecipes.length} 道</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">AI 引擎狀態</div>
            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gemini 3.5 Flash Lite
            </div>
          </div>
        </div>
      </div>

      {/* Main Sections: Featured Recipes & Pantry Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Featured / Saved Recipes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-600" />
                精選私房料理推薦
              </h2>
              <p className="text-xs text-slate-500">點擊即可開啟詳細步驟與烹飪計時器</p>
            </div>
            <Link
              to="/recipes"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              客製化推薦 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedRecipes.slice(0, 4).map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => {
                  setSelectedRecipe(recipe)
                  setIsModalOpen(true)
                }}
                className="group p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                      {recipe.difficulty === 'easy' ? '新手友好' : recipe.difficulty === 'medium' ? '家常中等' : '大廚功夫'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recipe.cookingTimeMinutes} 分鐘
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>{recipe.calories || 300} kcal</span>
                  </div>
                  <span className="text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    料理教學 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {savedRecipes.length === 0 && (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <ChefHat className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700">尚未有收藏的食譜</div>
              <p className="text-xs text-slate-500">
                點擊上方「依庫存推薦食譜」，讓 AI 依照您目前的食材生成美味料理！
              </p>
              <Link
                to="/recipes"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold text-xs mt-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                立即生成食譜
              </Link>
            </div>
          )}
        </div>

        {/* Right Col: Recent Pantry Ingredients */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              冰箱庫存一覽
            </h2>
            <Link
              to="/pantry"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              全部庫存 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3 shadow-sm">
            {ingredients.slice(0, 6).map((item) => {
              const meta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other
              const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) <= threeDaysLater
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        {item.name}
                        {isExpiringSoon && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            快過期
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.storageLocation === 'fridge' ? '冷藏' : item.storageLocation === 'freezer' ? '冷凍' : '常溫'}
                        {item.expiryDate ? ` • ${item.expiryDate} 到期` : ''}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              )
            })}

            <div className="pt-2">
              <Link
                to="/pantry"
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-orange-400 hover:text-orange-600 text-slate-500 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增或管理全部食材
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Detail Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecipeSavedChanged={async () => {
          const recipes = await localStorageAdapter.getSavedRecipes()
          setSavedRecipes(recipes)
        }}
      />
    </div>
  )
}
