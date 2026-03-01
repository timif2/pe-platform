import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

const ROUTE_TITLES = {
  '/': 'Portfolio Overview',
  '/portfolio': 'Portfolio Explorer',
  '/predictions': 'Predictions Lab',
  '/fund-analytics': 'Fund Analytics',
  '/survival': 'Survival Analysis',
  '/explainability': 'Explainability Lab',
}

function getTitle(pathname) {
  if (pathname.startsWith('/portfolio/')) return 'Company Detail'
  return ROUTE_TITLES[pathname] || 'Ardian PE Analytics'
}

function formatDateTime(date) {
  const d = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const t = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return { d, t }
}

export default function TopBar({ onToggleSidebar }) {
  const location = useLocation()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { d, t } = formatDateTime(now)
  const title = getTitle(location.pathname)

  return (
    <div
      className="flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0"
      style={{ height: 48 }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Menu size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-400">Ardian ASF Platform</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-500 font-medium">Live Data</span>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {d} &nbsp; {t}
        </div>
      </div>
    </div>
  )
}
