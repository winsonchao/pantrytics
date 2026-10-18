import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Navbar } from '../components/Navbar'
import '../styles/app.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Pantrytics - 智慧冰箱食材辨識與 AI 料理食譜小助手' },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: '/src/styles/app.css',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-orange-600">Pantrytics</span>
              <span>•</span>
              <span>智慧食材管理與 AI 食譜料理教學</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>TanStack Start 全端架構</span>
              <span>•</span>
              <span>Gemini 2.5 Flash</span>
              <span>•</span>
              <span>Local Storage / Supabase Ready</span>
            </div>
          </div>
        </footer>
      </div>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased selection:bg-orange-100 selection:text-orange-900 font-sans">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
