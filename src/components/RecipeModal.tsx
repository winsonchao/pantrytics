import { useState, useEffect } from 'react'
import {
  X,
  Clock,
  Flame,
  Users,
  Heart,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChefHat,
  Bookmark,
  Share2,
  Check,
} from 'lucide-react'
import type { Recipe } from '../lib/storage/types'
import { localStorageAdapter } from '../lib/storage/localStorageAdapter'
import { CookingTimer } from './CookingTimer'

interface RecipeModalProps {
  recipe: Recipe | null
  isOpen: boolean
  onClose: () => void
  onRecipeSavedChanged?: () => void
}

export function RecipeModal({ recipe, isOpen, onClose, onRecipeSavedChanged }: RecipeModalProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)

  useEffect(() => {
    if (!recipe) return
    localStorageAdapter.isRecipeSaved(recipe.id).then((saved) => setIsSaved(saved))
  }, [recipe])

  if (!isOpen || !recipe) return null

  const toggleSave = async () => {
    if (isSaved) {
      await localStorageAdapter.deleteSavedRecipe(recipe.id)
      setIsSaved(false)
    } else {
      await localStorageAdapter.saveRecipe({ ...recipe, isSaved: true })
      setIsSaved(true)
    }
    if (onRecipeSavedChanged) onRecipeSavedChanged()
  }

  const handleShare = () => {
    const text = `【${recipe.title}】\n${recipe.description}\n烹調時間：${recipe.cookingTimeMinutes} 分鐘\n\n【食材清單】\n${recipe.ingredientsList
      .map((i) => `- ${i.name}：${i.amount}`)
      .join('\n')}\n\n【烹調步驟】\n${recipe.cookingSteps
      .map((s) => `${s.stepNumber}. ${s.instruction}`)
      .join('\n')}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const difficultyMap = {
    easy: { label: '新手零失敗', color: 'bg-emerald-100 text-emerald-800' },
    medium: { label: '家常中等', color: 'bg-amber-100 text-amber-800' },
    hard: { label: '功夫大廚', color: 'bg-rose-100 text-rose-800' },
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${difficultyMap[recipe.difficulty]?.color}`}>
                  {difficultyMap[recipe.difficulty]?.label}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                  {recipe.servings} 人份
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{recipe.title}</h2>
              <p className="text-orange-100 text-sm leading-relaxed max-w-xl">{recipe.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSave}
                className={`p-2.5 rounded-full transition-all ${
                  isSaved
                    ? 'bg-white text-rose-500 shadow-md'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
                title={isSaved ? '已收藏' : '收藏食譜'}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="關閉"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-6 grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/20">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 text-orange-100 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" /> 總時間
              </div>
              <span className="text-lg font-bold mt-0.5">{recipe.cookingTimeMinutes} 分鐘</span>
            </div>
            <div className="flex flex-col items-center justify-center border-x border-white/20">
              <div className="flex items-center gap-1.5 text-orange-100 text-xs font-medium">
                <Flame className="w-3.5 h-3.5" /> 預估熱量
              </div>
              <span className="text-lg font-bold mt-0.5">{recipe.calories || 320} kcal</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 text-orange-100 text-xs font-medium">
                <Users className="w-3.5 h-3.5" /> 適合人數
              </div>
              <span className="text-lg font-bold mt-0.5">{recipe.servings} 人份</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
          {/* Section 1: Ingredients Needed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-orange-500 rounded-full inline-block" />
                準備食材與比例
              </h3>
              <span className="text-xs text-slate-400">綠色打勾代表已在庫存中</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recipe.ingredientsList.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    item.isPantryItem
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.isPantryItem ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold opacity-90">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Prep Steps */}
          {recipe.prepSteps && recipe.prepSteps.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
                <span className="w-2 h-6 bg-amber-500 rounded-full inline-block" />
                備料準備指南 (Prep)
              </h3>
              <div className="space-y-2.5 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                {recipe.prepSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Step-by-Step Cooking Guide */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-orange-600 rounded-full inline-block" />
                烹調料理步驟 (Cooking Steps)
              </h3>
              <span className="text-xs text-orange-600 font-medium">附有倒數計時器輔助</span>
            </div>

            <div className="space-y-4">
              {recipe.cookingSteps.map((step) => {
                const isSelected = activeStep === step.stepNumber
                return (
                  <div
                    key={step.stepNumber}
                    onClick={() => setActiveStep(step.stepNumber)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 shadow-sm ring-1 ring-orange-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                          {step.stepNumber}
                        </span>
                        <h4 className="font-bold text-slate-800 text-base">步驟 {step.stepNumber}</h4>
                      </div>

                      {step.timerSeconds && step.timerSeconds > 0 ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <CookingTimer
                            initialSeconds={step.timerSeconds}
                            label={`步驟 ${step.stepNumber} 計時`}
                          />
                        </div>
                      ) : null}
                    </div>

                    <p className="text-slate-700 text-sm leading-relaxed pl-9 mb-3">
                      {step.instruction}
                    </p>

                    {step.tip && (
                      <div className="ml-9 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">主廚小撇步：</strong> {step.tip}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 4: Chef Pro Tips */}
          {recipe.chefTips && recipe.chefTips.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/80">
              <h3 className="text-base font-bold text-orange-950 flex items-center gap-2 mb-3">
                <ChefHat className="w-5 h-5 text-orange-600" />
                主廚美味秘笈
              </h3>
              <ul className="space-y-2">
                {recipe.chefTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-medium text-sm transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">已複製食譜！</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>分享/複製食譜</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSave}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isSaved
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? '已收藏在食譜庫' : '收藏此食譜'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
