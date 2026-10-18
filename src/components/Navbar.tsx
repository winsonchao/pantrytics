import { useState, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  UtensilsCrossed,
  Camera,
  Package,
  BookOpen,
  Settings,
  Sparkles,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react'
import { localStorageAdapter } from '../lib/storage/localStorageAdapter'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expiringCount, setExpiringCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  useEffect(() => {
    async function loadStats() {
      const items = await localStorageAdapter.getIngredients()
      setTotalCount(items.length)
      const now = new Date()
      const threeDaysLater = new Date(Date.now() + 3 * 86400000)
      const expiring = items.filter((item) => {
        if (!item.expiryDate) return false
        const exp = new Date(item.expiryDate)
        return exp <= threeDaysLater
      }).length
      setExpiringCount(expiring)
    }

    loadStats()
    const timer = setInterval(loadStats, 3000)
    return () => clearInterval(timer)
  }, [])

  const navItems = [
    { label: '首頁儀表板', path: '/', icon: UtensilsCrossed },
    { label: '拍照辨識', path: '/scan', icon: Camera, badge: 'AI' },
    {
      label: '食材庫存',
      path: '/pantry',
      icon: Package,
      count: totalCount,
      alertCount: expiringCount,
    },
    { label: 'AI 食譜生成', path: '/recipes', icon: Sparkles },
    { label: '收藏食譜', path: '/saved-recipes', icon: BookOpen },
    { label: '設定', path: '/settings', icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Pantrytics
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-1">
                智慧食材與料理指南
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white leading-none">
                      {item.badge}
                    </span>
                  )}

                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      {item.count}
                    </span>
                  )}

                  {typeof item.alertCount === 'number' && item.alertCount > 0 && (
                    <span
                      title={`${item.alertCount} 項食材即將過期`}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {item.alertCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="打開導覽選單"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                      {item.badge}
                    </span>
                  )}
                  {typeof item.alertCount === 'number' && item.alertCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {item.alertCount}
                    </span>
                  )}
                  {typeof item.count === 'number' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      {item.count}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
