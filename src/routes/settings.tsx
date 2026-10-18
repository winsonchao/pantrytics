import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Settings,
  Key,
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Server,
  Cloud,
  Copy,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { localStorageAdapter } from '../lib/storage/localStorageAdapter'
import type { UserSettings } from '../lib/storage/types'

export const Route = createFileRoute('/settings')({
  component: SettingsComponent,
})

const SUPABASE_SCHEMA_SQL = `-- Supabase Table Schema for Pantrytics
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  name text not null,
  category text not null,
  quantity numeric not null default 1,
  unit text not null default '份',
  storage_location text not null default 'fridge',
  expiry_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saved_recipes (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  data jsonb not null,
  created_at timestamptz default now()
);`

function SettingsComponent() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [modelInput, setModelInput] = useState('gemini-3.5-flash-lite')
  const [showKey, setShowKey] = useState(false)
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('')
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testingKey, setTestingKey] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  useEffect(() => {
    async function load() {
      const s = await localStorageAdapter.getSettings()
      setSettings(s)
      setApiKeyInput(s.geminiApiKey || '')
      setModelInput(s.geminiModel || 'gemini-3.5-flash-lite')
      setSupabaseUrl(s.supabaseUrl || '')
      setSupabaseAnonKey(s.supabaseAnonKey || '')
    }
    load()
  }, [])

  const handleSaveSettings = async () => {
    try {
      const updated = await localStorageAdapter.updateSettings({
        geminiApiKey: apiKeyInput.trim(),
        geminiModel: modelInput.trim() || 'gemini-3.5-flash-lite',
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
      })
      setSettings(updated)
      setStatusMessage({ type: 'success', text: '設定已成功儲存！' })
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: '儲存失敗：' + e.message })
    }
  }

  const handleTestApiKey = async () => {
    const key = apiKeyInput.trim()
    if (!key) {
      setStatusMessage({ type: 'error', text: '請先輸入 Gemini API Key 後再進行測試！' })
      return
    }

    setTestingKey(true)
    setStatusMessage(null)

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(key)
      const targetModel = modelInput.trim() || 'gemini-3.5-flash-lite'
      const model = genAI.getGenerativeModel({ model: targetModel })
      const res = await model.generateContent('請回傳一個中文字：「好」')
      const text = res.response.text()
      if (text) {
        setStatusMessage({ type: 'success', text: `✅ Gemini API Key 驗證成功！(${targetModel}) 可正常使用免費 AI 分析與食譜生成。` })
      } else {
        setStatusMessage({ type: 'error', text: 'API 回傳內容為空，請檢查金鑰權限。' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: '驗證失敗：' + (err.message || '金鑰可能無效或額度已達上限。') })
    } finally {
      setTestingKey(false)
    }
  }

  const handleExportJson = async () => {
    const ingredients = await localStorageAdapter.getIngredients()
    const recipes = await localStorageAdapter.getSavedRecipes()
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      ingredients,
      recipes,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pantrytics-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const raw = event.target?.result as string
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.ingredients)) {
          window.localStorage.setItem('pantrytics_ingredients_v1', JSON.stringify(parsed.ingredients))
        }
        if (Array.isArray(parsed.recipes)) {
          window.localStorage.setItem('pantrytics_saved_recipes_v1', JSON.stringify(parsed.recipes))
        }
        setStatusMessage({ type: 'success', text: '備份資料已成功匯入！' })
        setTimeout(() => window.location.reload(), 1200)
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: '檔案解析失敗：' + err.message })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleResetDemo = async () => {
    if (confirm('確定要還原成初始範例食材與食譜嗎？')) {
      await localStorageAdapter.resetDemoData()
      setStatusMessage({ type: 'success', text: '已重置為初始示範資料！' })
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  const copySql = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL)
      setCopiedSql(true)
      setTimeout(() => setCopiedSql(false), 2000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide">
          <Settings className="w-3.5 h-3.5" />
          系統偏好設定
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          設定與 API 金鑰管理
        </h1>
        <p className="text-sm text-slate-500">
          管理 Gemini AI 免費方案金鑰、儲存模式切換以及資料備份匯出。
        </p>
      </div>

      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Section 1: Gemini API Key */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Google Gemini API 金鑰 (免費方案)
              </h2>
              <p className="text-xs text-slate-500">
                用於拍照識別食材 (Gemini Vision) 與依現有食材生成客製化食譜教學。
              </p>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition-colors shrink-0"
          >
            <span>免費取得金鑰</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Model Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            預設 AI 分析與食譜生成模型
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', desc: '新世代極速輕量，推薦免費首選', badge: '預設推薦' },
              { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', desc: '輕量高性價比模型', badge: '輕量' },
              { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: '兼具思考與多模態能力', badge: '平衡' },
              { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: '經典穩定長上下文模型', badge: '相容' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModelInput(m.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  modelInput === m.id
                    ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{m.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    modelInput === m.id ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {m.badge}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input & Actions */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Gemini API 金鑰
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="請貼上您的 Gemini API Key (例如：AIzaSy...)"
              className="w-full pl-4 pr-24 py-3 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {showKey ? '隱藏' : '顯示'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>金鑰安全保存在您的個人瀏覽器 LocalStorage 中，不會洩漏給第三方。</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={testingKey || !apiKeyInput}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {testingKey ? '測試中...' : '測試連線'}
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-105"
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>

        {/* Step Guide */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-orange-600" />
            如何 1 分鐘免費申請 Google Gemini API Key：
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1 leading-relaxed">
            <li>前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-orange-600 font-bold underline">Google AI Studio</a> 並登入 Google 帳號。</li>
            <li>點擊「Create API Key」，選擇建立一個全新的 Key。</li>
            <li>複製產生的金鑰，貼入上方輸入框並點擊「儲存設定」即可永久免費使用！</li>
          </ol>
        </div>
      </div>

      {/* Section 2: Storage Engine & Supabase Migration Ready */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">資料儲存架構</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  目前模式：本地瀏覽器 (LocalStorage)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                系統已採用 StorageAdapter 抽象層封裝，資料目前零延遲存於本地，未來可隨時無痛切換至 Supabase 雲端！
              </p>
            </div>
          </div>
        </div>

        {/* Future Supabase Settings Box */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-800">
                未來 Supabase 雲端資料庫接入 (預留接口)
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
              預留擴充就緒
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            若未來需要多人共用冰箱、跨手機/電腦即時同步，只需在下方填入您的 Supabase 專案 URL 與 Anon Key，程式碼已內建 <code className="bg-white px-1 py-0.5 rounded border border-slate-200">SupabaseAdapter</code>，可立即無縫對接！
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase URL (選填)
              </label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Anon Key (選填)
              </label>
              <input
                type="password"
                placeholder="eyJh..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={copySql}
              className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? '已複製建表 SQL！' : '複製 Supabase 建表 SQL'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              儲存 Supabase 設定
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Data Management, Backup & Reset */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">資料備份與維護</h2>
            <p className="text-xs text-slate-500">
              將目前的食材與收藏食譜匯出成 JSON 備份檔，或隨時還原初始資料。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 font-semibold text-xs transition-all hover:shadow-sm"
          >
            <Download className="w-4 h-4 text-orange-600" />
            <span>匯出備份 JSON</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 font-semibold text-xs transition-all hover:shadow-sm cursor-pointer">
            <Upload className="w-4 h-4 text-orange-600" />
            <span>匯入備份 JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleResetDemo}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-amber-200 hover:border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition-all"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>還原示範食材</span>
          </button>
        </div>
      </div>
    </div>
  )
}
