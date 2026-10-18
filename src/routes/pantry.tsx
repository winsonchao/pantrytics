import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  X,
  Check,
  CheckCircle2,
  Camera,
  Layers,
} from 'lucide-react'
import { localStorageAdapter } from '../lib/storage/localStorageAdapter'
import type { Ingredient, IngredientCategory, StorageLocation } from '../lib/storage/types'
import { CATEGORY_LABELS, STORAGE_LOCATION_LABELS } from '../lib/storage'

export const Route = createFileRoute('/pantry')({
  component: PantryComponent,
})

const COMMON_SEASONINGS = [
  '食用油',
  '鹽',
  '白砂糖',
  '黑胡椒',
  '純釀醬油',
  '米酒',
  '大蒜',
  '老薑',
  '青蔥',
  '蠔油',
  '香油',
  '白醋',
  '白胡椒粉',
  '太白粉',
]

function PantryComponent() {
  const navigate = useNavigate()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [filterExpiring, setFilterExpiring] = useState(false)

  // Selection for cooking
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<Set<string>>(new Set())

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetable' as IngredientCategory,
    quantity: 1,
    unit: '顆',
    storageLocation: 'fridge' as StorageLocation,
    expiryDate: '',
    notes: '',
  })

  // Common seasonings state in localStorage
  const [checkedSeasonings, setCheckedSeasonings] = useState<Set<string>>(
    new Set(['食用油', '鹽', '純釀醬油', '大蒜', '青蔥'])
  )

  const loadData = async () => {
    const list = await localStorageAdapter.getIngredients()
    setIngredients(list)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const now = new Date()
  const threeDaysLater = new Date(Date.now() + 3 * 86400000)

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((item) => {
    // Search
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    // Category
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false
    }
    // Storage Location
    if (selectedLocation !== 'all' && item.storageLocation !== selectedLocation) {
      return false
    }
    // Expiring filter
    if (filterExpiring) {
      if (!item.expiryDate) return false
      const exp = new Date(item.expiryDate)
      if (exp > threeDaysLater) return false
    }
    return true
  })

  const openAddModal = () => {
    setEditingId(null)
    setFormData({
      name: '',
      category: 'vegetable',
      quantity: 1,
      unit: '顆',
      storageLocation: 'fridge',
      expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: Ingredient) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      storageLocation: item.storageLocation,
      expiryDate: item.expiryDate || '',
      notes: item.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingId) {
      await localStorageAdapter.updateIngredient(editingId, {
        ...formData,
        quantity: Number(formData.quantity) || 1,
      })
    } else {
      await localStorageAdapter.addIngredient({
        ...formData,
        quantity: Number(formData.quantity) || 1,
      })
    }

    setIsModalOpen(false)
    await loadData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('確定要從冰箱庫存刪除此食材嗎？')) {
      await localStorageAdapter.deleteIngredient(id)
      setSelectedIngredientIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await loadData()
    }
  }

  const handleQuickQuantity = async (id: string, delta: number) => {
    const item = ingredients.find((i) => i.id === id)
    if (!item) return
    const newQty = Math.max(0, item.quantity + delta)
    if (newQty === 0) {
      handleDelete(id)
    } else {
      await localStorageAdapter.updateIngredient(id, { quantity: newQty })
      await loadData()
    }
  }

  const toggleSelectIngredient = (id: string) => {
    const next = new Set(selectedIngredientIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIngredientIds(next)
  }

  const toggleSeasoning = (s: string) => {
    const next = new Set(checkedSeasonings)
    if (next.has(s)) {
      next.delete(s)
    } else {
      next.add(s)
    }
    setCheckedSeasonings(next)
  }

  const handleGoToRecipes = () => {
    // Collect chosen ingredients
    const chosen = ingredients.filter((i) => selectedIngredientIds.has(i.id))
    const params = new URLSearchParams()
    if (chosen.length > 0) {
      params.set('selected', chosen.map((c) => c.name).join(','))
    }
    navigate({ to: `/recipes?${params.toString()}` })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wide">
            <Package className="w-3.5 h-3.5" />
            智慧冰箱庫存管理
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            現有食材庫存 ({ingredients.length})
          </h1>
          <p className="text-sm text-slate-500">
            資料安全儲存在本機瀏覽器 Local Storage，未來可無縫切換到 Supabase 雲端資料庫。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/scan"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-sm border border-orange-200 transition-colors"
          >
            <Camera className="w-4 h-4" />
            拍照辨識加入
          </Link>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            手動新增食材
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋食材名稱（如：番茄、雞肉、洋蔥）..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="all">📍 全部存放位置</option>
            <option value="fridge">❄️ 冷藏區</option>
            <option value="freezer">🧊 冷凍庫</option>
            <option value="room">🧺 常溫乾燥</option>
          </select>

          {/* Expiring Toggle */}
          <button
            type="button"
            onClick={() => setFilterExpiring(!filterExpiring)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              filterExpiring
                ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${filterExpiring ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>只看即將過期</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部分類
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => {
            const isSelected = selectedCategory === catKey
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{catVal.icon}</span>
                <span>{catVal.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Common Seasonings Bar */}
      <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 rounded-3xl border border-amber-200/80 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧂</span>
            <div>
              <h3 className="text-sm font-bold text-amber-950">廚房常備調味料勾選</h3>
              <p className="text-xs text-amber-700">勾選後，生成食譜時 AI 會自動視為已有調味料，省去手動新增的麻煩</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
            已勾選 {checkedSeasonings.size} 種
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {COMMON_SEASONINGS.map((seasoning) => {
            const isChecked = checkedSeasonings.has(seasoning)
            return (
              <button
                key={seasoning}
                type="button"
                onClick={() => toggleSeasoning(seasoning)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isChecked
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white/80 border border-amber-200 text-amber-900 hover:bg-white'
                }`}
              >
                {isChecked ? <Check className="w-3 h-3" /> : null}
                <span>{seasoning}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Ingredients Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>顯示 {filteredIngredients.length} 項食材</span>
          <button
            type="button"
            onClick={() => {
              if (selectedIngredientIds.size === filteredIngredients.length) {
                setSelectedIngredientIds(new Set())
              } else {
                setSelectedIngredientIds(new Set(filteredIngredients.map((i) => i.id)))
              }
            }}
            className="font-semibold text-orange-600 hover:underline"
          >
            {selectedIngredientIds.size === filteredIngredients.length ? '取消全選' : '全選目前顯示'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIngredients.map((item) => {
            const meta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other
            const locationMeta = STORAGE_LOCATION_LABELS[item.storageLocation] || STORAGE_LOCATION_LABELS.fridge
            const isSelected = selectedIngredientIds.has(item.id)

            // Expiry status
            let isExpired = false
            let isExpiringSoon = false
            let daysLeft: number | null = null

            if (item.expiryDate) {
              const exp = new Date(item.expiryDate)
              const diffMs = exp.getTime() - now.getTime()
              daysLeft = Math.ceil(diffMs / 86400000)
              if (daysLeft < 0) isExpired = true
              else if (daysLeft <= 3) isExpiringSoon = true
            }

            return (
              <div
                key={item.id}
                onClick={() => toggleSelectIngredient(item.id)}
                className={`group p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20 shadow-md'
                    : 'border-slate-200/90 bg-white hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Name & Checkbox */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0">
                        {meta.icon}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-800 text-lg group-hover:text-orange-600 transition-colors">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-md font-medium ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span>•</span>
                          <span>{locationMeta.icon} {locationMeta.label}</span>
                        </div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectIngredient(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                    />
                  </div>

                  {/* Notes if any */}
                  {item.notes && (
                    <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Bottom Bar: Expiry & Quantity controls */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Expiry Pill */}
                  <div>
                    {item.expiryDate ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                          isExpired
                            ? 'bg-rose-100 text-rose-800'
                            : isExpiringSoon
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {isExpired
                          ? '已過期'
                          : daysLeft === 0
                          ? '今天到期'
                          : `剩 ${daysLeft} 天到期`}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">常備食材</span>
                    )}
                  </div>

                  {/* Quantity Stepper & Edit */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleQuickQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 font-bold flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800 min-w-[32px] text-center">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 font-bold flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="編輯"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="刪除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredIngredients.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700 text-lg">沒有找到符合條件的食材</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              您可以嘗試清除篩選條件，或點擊「手動新增食材」或「拍照辨識」添加新食材。
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold text-xs"
              >
                手動新增食材
              </button>
              <Link
                to="/scan"
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
              >
                拍照辨識食材
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar when ingredients selected */}
      {selectedIngredientIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 pl-2">
            <CheckCircle2 className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-sm font-bold">已選取 {selectedIngredientIds.size} 項食材</div>
              <div className="text-[10px] text-slate-300">隨時可交給 AI 生成專屬私房食譜</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIngredientIds(new Set())}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              清除
            </button>
            <button
              type="button"
              onClick={handleGoToRecipes}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 font-bold text-sm text-white shadow-lg shadow-orange-600/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              開始做菜
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? '編輯食材資料' : '新增食材到冰箱'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  食材名稱 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：高麗菜、牛肉片、雞蛋"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    分類
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as IngredientCategory })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => (
                      <option key={catKey} value={catKey}>
                        {catVal.icon} {catVal.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    存放位置
                  </label>
                  <select
                    value={formData.storageLocation}
                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value as StorageLocation })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {Object.entries(STORAGE_LOCATION_LABELS).map(([locKey, locVal]) => (
                      <option key={locKey} value={locKey}>
                        {locVal.icon} {locVal.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    數量
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    單位
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="顆、把、克、盒"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  保存期限 (選填)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  備註說明 (選填)
                </label>
                <input
                  type="text"
                  placeholder="如：已洗淨、全聯購買、分裝冷凍"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all"
                >
                  {editingId ? '儲存變更' : '新增食材'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
