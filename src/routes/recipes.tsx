import { useState, useEffect } from 'react'
import { createFileRoute, useSearch, Link } from '@tanstack/react-router'
import {
  Sparkles,
  ChefHat,
  Clock,
  Flame,
  Users,
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Filter,
  Sliders,
  Heart,
  Package,
} from 'lucide-react'
import { localStorageAdapter } from '../lib/storage/localStorageAdapter'
import type { Ingredient, Recipe } from '../lib/storage/types'
import { generateRecipes } from '../lib/gemini/client'
import { RecipeModal } from '../components/RecipeModal'

export const Route = createFileRoute('/recipes')({
  component: RecipesComponent,
})

const CUISINE_STYLES = [
  '台式家常料理',
  '日韓和風料理',
  '西式歐陸風味',
  '高蛋白低卡減脂',
  '熱炒下酒好菜',
  '清爽蒸煮湯品',
  '15分鐘快手懶人菜',
]

const TIME_LIMITS = [
  '15 分鐘快速出菜',
  '30 分鐘以內',
  '不限時間，美味至上',
]

const KITCHEN_TOOLS = [
  '瓦斯爐/炒鍋',
  '大同電鍋',
  '氣炸鍋',
  '微波爐',
  '烤箱',
  '湯鍋',
]

function RecipesComponent() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [selectedIngredientNames, setSelectedIngredientNames] = useState<Set<string>>(new Set())
  const [selectedCuisine, setSelectedCuisine] = useState('台式家常料理')
  const [selectedTimeLimit, setSelectedTimeLimit] = useState('30 分鐘以內')
  const [servings, setServings] = useState(2)
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set(['瓦斯爐/炒鍋']))
  const [customNotes, setCustomNotes] = useState('')

  // Generated recipes state
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Modal detail view
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Load ingredients & URL query
  useEffect(() => {
    async function init() {
      const list = await localStorageAdapter.getIngredients()
      setIngredients(list)

      // Check URL query parameters
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const selectedParam = urlParams.get('selected')
        if (selectedParam) {
          const names = selectedParam.split(',').map((s) => s.trim()).filter(Boolean)
          setSelectedIngredientNames(new Set(names))
        } else {
          // Default select all
          setSelectedIngredientNames(new Set(list.map((i) => i.name)))
        }
      }
    }
    init()
  }, [])

  const toggleIngredient = (name: string) => {
    const next = new Set(selectedIngredientNames)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.add(name)
    }
    setSelectedIngredientNames(next)
  }

  const toggleTool = (tool: string) => {
    const next = new Set(selectedTools)
    if (next.has(tool)) {
      next.delete(tool)
    } else {
      next.add(tool)
    }
    setSelectedTools(next)
  }

  const handleGenerate = async () => {
    if (selectedIngredientNames.size === 0) {
      setErrorMessage('請至少挑選 1 項要使用的現有食材！')
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)

    const selectedIngList = ingredients
      .filter((i) => selectedIngredientNames.has(i.name))
      .map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit }))

    try {
      const res = await generateRecipes({
        ingredients: selectedIngList,
        cuisineStyle: selectedCuisine,
        timeLimit: selectedTimeLimit,
        servings: servings,
        kitchenTools: Array.from(selectedTools),
        customNotes: customNotes.trim() || undefined,
      })

      if (!res.success) {
        setErrorMessage(res.error || '食譜生成失敗，請檢查 API Key 或網路連線。')
      } else {
        setGeneratedRecipes(res.recipes)
      }
    } catch (err: any) {
      setErrorMessage(err.message || '連線伺服器時發生問題。')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Page Header */}
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          AI 智慧主廚
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          依現有食材生成專屬食譜與料理教學
        </h1>
        <p className="text-sm sm:text-base text-slate-500">
          勾選您今天想煮的冰箱食材，設定料理喜好，Gemini AI 將為您研發美味配方與詳細步驟指南！
        </p>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold">提示：</strong> {errorMessage}
              <div className="mt-1 text-xs text-rose-600">
                可前往 <Link to="/settings" className="underline font-bold">設定頁面</Link> 確認免費 Gemini API Key 是否填妥。
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Choose Ingredients */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              1. 挑選要使用的現有食材 ({selectedIngredientNames.size} / {ingredients.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedIngredientNames.size === ingredients.length) {
                    setSelectedIngredientNames(new Set())
                  } else {
                    setSelectedIngredientNames(new Set(ingredients.map((i) => i.name)))
                  }
                }}
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                {selectedIngredientNames.size === ingredients.length ? '全部取消' : '全選庫存食材'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 max-h-56 overflow-y-auto p-1">
            {ingredients.map((item) => {
              const isSelected = selectedIngredientNames.has(item.name)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleIngredient(item.name)}
                  className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20 scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-white text-orange-600 font-bold' : 'border border-slate-400'
                  }`}>
                    {isSelected ? '✓' : ''}
                  </span>
                  <span>{item.name}</span>
                  <span className="text-[11px] opacity-75">({item.quantity}{item.unit})</span>
                </button>
              )
            })}

            {ingredients.length === 0 && (
              <div className="text-sm text-slate-400 py-3">
                目前食材庫存為空，請先前往「食材庫存」或「拍照辨識」新增食材。
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Preferences */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cuisine Style */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. 料理風格與口味
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CUISINE_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedCuisine(style)}
                  className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                    selectedCuisine === style
                      ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Servings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. 烹調時間限制
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_LIMITS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTimeLimit(t)}
                    className={`p-2.5 rounded-xl text-xs font-semibold text-center transition-all border ${
                      selectedTimeLimit === t
                        ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  用餐人數
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 4, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setServings(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        servings === num
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {num} 人
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  特殊客製需求 (選填)
                </label>
                <input
                  type="text"
                  placeholder="如：不加辣、少油少鹽、便當菜"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Kitchen Tools */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            現有廚房設備（可複選）
          </label>
          <div className="flex flex-wrap gap-2">
            {KITCHEN_TOOLS.map((tool) => {
              const isChecked = selectedTools.has(tool)
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => toggleTool(tool)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    isChecked
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isChecked ? <Check className="w-3 h-3 text-amber-700" /> : null}
                  <span>{tool}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || selectedIngredientNames.size === 0}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-base shadow-xl shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                <span>AI 大廚正在為您研發食譜中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>立即生成 3 道專屬食譜教學</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isGenerating && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm animate-pulse">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <ChefHat className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            星級大廚正在量身設計您的食譜...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            根據您的【{selectedCuisine}】偏好與現有食材，計算最佳火候、烹飪時間與計時步驟中...
          </p>
        </div>
      )}

      {/* Generated Recipes Grid */}
      {generatedRecipes.length > 0 && !isGenerating && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                AI 研發成果
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                推薦食譜清單 ({generatedRecipes.length} 道)
              </h2>
            </div>
            <p className="text-xs text-slate-400">點擊任意食譜即可開啟逐步烹飪教學</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {generatedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => {
                  setActiveRecipe(recipe)
                  setIsModalOpen(true)
                }}
                className="group p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/10 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                      {recipe.difficulty === 'easy' ? '新手推薦' : recipe.difficulty === 'medium' ? '家常中等' : '大廚技巧'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {recipe.cookingTimeMinutes} 分鐘
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {recipe.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>

                  {/* Matched Ingredients Chips */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-slate-400">使用的冰箱食材：</div>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.matchedIngredients.slice(0, 4).map((ing, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ {ing}
                        </span>
                      ))}
                      {recipe.matchedIngredients.length > 4 && (
                        <span className="text-xs text-slate-400 self-center">
                          +{recipe.matchedIngredients.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>約 {recipe.calories || 350} kcal</span>
                  </div>

                  <span className="text-xs font-extrabold text-orange-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    料理教學與計時 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipe Modal Component */}
      <RecipeModal
        recipe={activeRecipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
