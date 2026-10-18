import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  BookOpen,
  Clock,
  Flame,
  Users,
  Trash2,
  ChefHat,
  ArrowRight,
  Heart,
  Sparkles,
} from 'lucide-react'
import { localStorageAdapter } from '../lib/storage/localStorageAdapter'
import type { Recipe } from '../lib/storage/types'
import { RecipeModal } from '../components/RecipeModal'

export const Route = createFileRoute('/saved-recipes')({
  component: SavedRecipesComponent,
})

function SavedRecipesComponent() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadRecipes = async () => {
    const list = await localStorageAdapter.getSavedRecipes()
    setRecipes(list)
    setLoading(false)
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  const handleDeleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('確定要取消收藏這道食譜嗎？')) {
      await localStorageAdapter.deleteSavedRecipe(id)
      await loadRecipes()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wide">
            <BookOpen className="w-3.5 h-3.5" />
            私房食譜筆記
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            我的收藏食譜庫 ({recipes.length})
          </h1>
          <p className="text-sm text-slate-500">
            記錄所有您喜愛的料理，離線或隨時重溫備料與計時烹飪步驟。
          </p>
        </div>

        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          生成新食譜
        </Link>
      </div>

      {/* Recipes Grid */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => {
                setSelectedRecipe(recipe)
                setIsModalOpen(true)
              }}
              className="group p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/10 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                    {recipe.difficulty === 'easy' ? '新手推薦' : recipe.difficulty === 'medium' ? '家常中等' : '大廚技巧'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {recipe.cookingTimeMinutes} 分鐘
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteRecipe(recipe.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="移除收藏"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>
                </div>

                {/* Ingredients chips */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400">所需主要食材：</div>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredientsList.slice(0, 4).map((ing, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        {ing.name}
                      </span>
                    ))}
                    {recipe.ingredientsList.length > 4 && (
                      <span className="text-xs text-slate-400 self-center">
                        +{recipe.ingredientsList.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>約 {recipe.calories || 300} kcal</span>
                </div>

                <span className="text-xs font-extrabold text-orange-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  詳細教學與計時 <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
          <div className="text-xl font-bold text-slate-800">目前還沒有收藏任何食譜</div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            當您在「AI 食譜推薦」生成喜歡的料理時，點擊愛心收藏，即可在此隨時查看！
          </p>
          <div className="pt-2">
            <Link
              to="/recipes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-md transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              立即依食材生成食譜
            </Link>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecipeSavedChanged={loadRecipes}
      />
    </div>
  )
}
