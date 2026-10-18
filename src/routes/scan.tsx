import { useState, useRef, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sliders,
  Trash2,
  PackageCheck,
  RotateCcw,
  Video,
  VideoOff,
  Image as ImageIcon,
} from 'lucide-react'
import { analyzeFoodImage } from '../lib/gemini/client'
import type { DetectedFoodItem } from '../server/gemini'
import { localStorageAdapter } from '../lib/storage/localStorageAdapter'
import { CATEGORY_LABELS, STORAGE_LOCATION_LABELS } from '../lib/storage'
import type { IngredientCategory, StorageLocation } from '../lib/storage/types'

export const Route = createFileRoute('/scan')({
  component: ScanComponent,
})

// Sample demo images (data URLs or lightweight SVGs for instant trial)
const DEMO_PRESETS = [
  {
    label: '🥬 冰箱時蔬範例',
    description: '牛番茄、青花菜、青蔥、大蒜',
    previewColor: 'from-emerald-400 to-green-600',
    mockItems: [
      { name: '牛番茄', category: 'vegetable' as IngredientCategory, quantity: 4, unit: '顆', storageLocation: 'fridge' as StorageLocation, suggestedExpiryDays: 7, notes: '鮮紅飽滿，建議冷藏' },
      { name: '青花菜', category: 'vegetable' as IngredientCategory, quantity: 1, unit: '朵', storageLocation: 'fridge' as StorageLocation, suggestedExpiryDays: 4, notes: '花蕾緊密翠綠' },
      { name: '青蔥', category: 'vegetable' as IngredientCategory, quantity: 3, unit: '根', storageLocation: 'fridge' as StorageLocation, suggestedExpiryDays: 3, notes: '蔥白分明，可切蔥花備用' },
      { name: '大蒜', category: 'seasoning' as IngredientCategory, quantity: 2, unit: '球', storageLocation: 'room' as StorageLocation, suggestedExpiryDays: 30, notes: '乾燥通風常溫保存' },
    ],
  },
  {
    label: '🥩 肉品生鮮範例',
    description: '雞胸肉、雞蛋、洋蔥、胡蘿蔔',
    previewColor: 'from-rose-400 to-orange-600',
    mockItems: [
      { name: '雞胸肉', category: 'meat' as IngredientCategory, quantity: 300, unit: '克', storageLocation: 'freezer' as StorageLocation, suggestedExpiryDays: 30, notes: '新鮮無異味，建議冷凍' },
      { name: '雞蛋', category: 'dairy_egg' as IngredientCategory, quantity: 6, unit: '顆', storageLocation: 'fridge' as StorageLocation, suggestedExpiryDays: 14, notes: '蛋殼乾淨完好' },
      { name: '洋蔥', category: 'vegetable' as IngredientCategory, quantity: 2, unit: '顆', storageLocation: 'room' as StorageLocation, suggestedExpiryDays: 20, notes: '結實乾燥' },
      { name: '胡蘿蔔', category: 'vegetable' as IngredientCategory, quantity: 1, unit: '根', storageLocation: 'fridge' as StorageLocation, suggestedExpiryDays: 10, notes: '外觀平滑無黑斑' },
    ],
  },
]

function ScanComponent() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'ingredients' | 'dish'>('ingredients')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('image/jpeg')
  const [analyzing, setAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [dishName, setDishName] = useState<string | null>(null)
  const [detectedItems, setDetectedItems] = useState<DetectedFoodItem[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [isAddedSuccess, setIsAddedSuccess] = useState(false)

  // Camera state
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Stop camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setErrorMessage(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      mediaStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)
    } catch (err: any) {
      console.error('Camera error:', err)
      setErrorMessage('無法啟動相機，請確認瀏覽器相機權限，或直接選擇照片檔案上傳。')
    }
  }

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setImagePreview(dataUrl)
      setMimeType('image/jpeg')
      stopCamera()
      // Auto analyze after capture
      handleAnalyze(dataUrl, 'image/jpeg')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    setMimeType(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setImagePreview(result)
      handleAnalyze(result, file.type || 'image/jpeg')
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async (base64Data?: string, customMime?: string) => {
    const imgData = base64Data || imagePreview
    if (!imgData) {
      setErrorMessage('請先拍照或上傳一張食物照片！')
      return
    }

    setAnalyzing(true)
    setErrorMessage(null)
    setIsAddedSuccess(false)

    try {
      const res = await analyzeFoodImage(imgData, customMime || mimeType, mode)

      if (!res.success) {
        setErrorMessage(res.error || '分析失敗，請檢查 API Key 或照片清晰度。')
      } else {
        setDishName(res.dishName || null)
        setSummary(res.overallSummary)
        setDetectedItems(res.detectedItems)
        // Select all by default
        setSelectedIndices(new Set(res.detectedItems.map((_, i) => i)))
      }
    } catch (err: any) {
      setErrorMessage(err.message || '連線失敗，請稍後重試。')
    } finally {
      setAnalyzing(false)
    }
  }

  const applyPreset = (preset: typeof DEMO_PRESETS[0]) => {
    stopCamera()
    setImagePreview(null)
    setErrorMessage(null)
    setSummary(`範例照片已載入：${preset.description}。已成功識別出 ${preset.mockItems.length} 種食材！`)
    setDetectedItems(preset.mockItems)
    setSelectedIndices(new Set(preset.mockItems.map((_, i) => i)))
    setIsAddedSuccess(false)
  }

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices)
    if (next.has(index)) {
      next.delete(index)
    } else {
      next.add(index)
    }
    setSelectedIndices(next)
  }

  const updateItem = (index: number, field: keyof DetectedFoodItem, value: any) => {
    setDetectedItems((prev) => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index] = { ...updated[index]!, [field]: value }
      }
      return updated
    })
  }

  const removeItem = (index: number) => {
    setDetectedItems((prev) => prev.filter((_, i) => i !== index))
    setSelectedIndices((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
  }

  const handleBatchAddToPantry = async () => {
    const selected = detectedItems.filter((_, idx) => selectedIndices.has(idx))
    if (selected.length === 0) {
      setErrorMessage('請至少勾選一項要加入的食材！')
      return
    }

    try {
      const now = new Date()
      const toAdd = selected.map((item) => {
        let expiryDate: string | undefined = undefined
        if (item.suggestedExpiryDays && item.suggestedExpiryDays > 0) {
          const exp = new Date(now.getTime() + item.suggestedExpiryDays * 86400000)
          expiryDate = exp.toISOString().split('T')[0]
        }

        return {
          name: item.name,
          category: item.category,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || '份',
          storageLocation: item.storageLocation || 'fridge',
          expiryDate,
          notes: item.notes,
        }
      })

      await localStorageAdapter.batchAddIngredients(toAdd)
      setIsAddedSuccess(true)
    } catch (err: any) {
      setErrorMessage('加入庫存失敗：' + err.message)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold tracking-wide uppercase">
          <Camera className="w-3.5 h-3.5" />
          AI 影像多模態分析
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          拍下食物，一秒辨識食材
        </h1>
        <p className="text-sm sm:text-base text-slate-500">
          支援手機相機即時拍照、圖片上傳或貼上。Gemini AI 會自動辨識食材、推估數量單位與建議保存方式！
        </p>

        {/* Mode Selector */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 border border-slate-300 mt-2">
          <button
            type="button"
            onClick={() => setMode('ingredients')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'ingredients'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🥬 辨識生鮮食材 (加入冰箱)
          </button>
          <button
            type="button"
            onClick={() => setMode('dish')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'dish'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🍲 拆解成品菜餚 (分析原料)
          </button>
        </div>
      </div>

      {/* Camera & Upload Area */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold">發生錯誤：</strong> {errorMessage}
              <div className="mt-1 text-xs text-rose-600">
                若尚未設定 API Key，可前往{' '}
                <Link to="/settings" className="underline font-bold">
                  設定頁面
                </Link>{' '}
                填寫免費的 Google Gemini API Key。
              </div>
            </div>
          </div>
        )}

        {/* Camera Live Stream View */}
        {cameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[420px] mx-auto flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                按下快門拍照
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-3 rounded-full bg-black/60 hover:bg-black/80 text-white font-medium text-sm transition-colors flex items-center gap-1.5"
              >
                <VideoOff className="w-4 h-4" />
                關閉相機
              </button>
            </div>
          </div>
        ) : (
          /* Preview or Upload Placeholder */
          <div>
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-[380px] mx-auto flex items-center justify-center shadow-inner">
                <img
                  src={imagePreview}
                  alt="食物預覽"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setDetectedItems([])
                      setSummary(null)
                    }}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors"
                    title="移除照片"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-orange-50/20 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  點擊上傳或拖曳食物照片至此
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  支援 JPG、PNG、WEBP 格式，亦可使用手機拍照
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
              >
                <Video className="w-4 h-4 text-orange-600" />
                開啟相機即時拍照
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-orange-600" />
                選擇本機圖片檔案
              </button>

              {imagePreview && (
                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  disabled={analyzing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      AI 辨識分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      開始 AI 辨識分析
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Demo Presets */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            沒有照片？點擊下方範例即可一鍵體驗：
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="p-3 rounded-2xl border border-slate-200 hover:border-orange-300 bg-slate-50/70 hover:bg-orange-50/40 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-sm text-slate-800 group-hover:text-orange-600 transition-colors">
                    {preset.label}
                  </div>
                  <div className="text-xs text-slate-400">{preset.description}</div>
                </div>
                <span className="text-xs font-bold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  載入範例 →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Results View */}
      {analyzing && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm animate-pulse">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Gemini Vision 正在分析照片中...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            正在辨識蔬果外觀、肉品色澤、推估數量單位與最適保存方式，請稍候幾秒鐘...
          </p>
        </div>
      )}

      {/* Detected Results Display */}
      {detectedItems.length > 0 && !analyzing && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
          {/* Header Summary */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                  辨識成功
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  {dishName ? `料理名稱：${dishName}` : `檢測到 ${detectedItems.length} 項食材`}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIndices.size === detectedItems.length) {
                      setSelectedIndices(new Set())
                    } else {
                      setSelectedIndices(new Set(detectedItems.map((_, i) => i)))
                    }
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {selectedIndices.size === detectedItems.length ? '取消全選' : '全選所有'}
                </button>
              </div>
            </div>

            {summary && (
              <p className="text-sm text-slate-600 bg-orange-50/70 p-3.5 rounded-2xl border border-orange-100 leading-relaxed">
                💡 <span className="font-semibold text-orange-950">AI 分析：</span> {summary}
              </p>
            )}
          </div>

          {/* Editable Detected Items List */}
          <div className="space-y-3">
            {detectedItems.map((item, idx) => {
              const isSelected = selectedIndices.has(idx)
              const meta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-orange-400 bg-orange-50/20 shadow-sm'
                      : 'border-slate-200 bg-white opacity-60'
                  }`}
                >
                  {/* Left: Checkbox & Name & Category */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(idx)}
                      className="w-5 h-5 mt-1 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.icon}</span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          className="font-bold text-slate-800 text-base bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-orange-500 focus:outline-none px-1 py-0.5"
                          placeholder="食材名稱"
                        />
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-400 pl-7">{item.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Middle / Right: Editable Fields */}
                  <div className="flex flex-wrap items-center gap-3 pl-8 md:pl-0">
                    {/* Category Selector */}
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(idx, 'category', e.target.value)}
                      className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => (
                        <option key={catKey} value={catKey}>
                          {catVal.icon} {catVal.label}
                        </option>
                      ))}
                    </select>

                    {/* Quantity & Unit */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="w-16 text-xs text-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        className="w-12 text-xs text-center rounded-xl border border-slate-200 bg-slate-50 px-1 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    {/* Storage Location */}
                    <select
                      value={item.storageLocation}
                      onChange={(e) => updateItem(idx, 'storageLocation', e.target.value)}
                      className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {Object.entries(STORAGE_LOCATION_LABELS).map(([locKey, locVal]) => (
                        <option key={locKey} value={locKey}>
                          {locVal.icon} {locVal.label}
                        </option>
                      ))}
                    </select>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="移除此項"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Success Banner */}
          {isAddedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">食材已成功加入您的現有庫存！</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/pantry"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  前往食材庫存 →
                </Link>
                <Link
                  to="/recipes"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  生成食譜 →
                </Link>
              </div>
            </div>
          )}

          {/* Footer Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              已勾選 {selectedIndices.size} / {detectedItems.length} 項食材
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleBatchAddToPantry}
                disabled={selectedIndices.size === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all hover:scale-105 disabled:opacity-50"
              >
                <PackageCheck className="w-4 h-4" />
                一鍵加入現有食材庫存 ({selectedIndices.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
