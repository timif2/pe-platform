import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  Brain,
  BarChart3,
  TrendingDown,
  FlaskConical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/predictions', label: 'Predictions Lab', icon: Brain },
  { path: '/fund-analytics', label: 'Fund Analytics', icon: BarChart3 },
  { path: '/survival', label: 'Survival Analysis', icon: TrendingDown },
  { path: '/explainability', label: 'Explainability', icon: FlaskConical },
]

export default function Sidebar({ open, setOpen }) {
  const location = useLocation()

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path)
  }

  return (
    <div
      className="flex flex-col bg-white border-r border-gray-200 transition-all duration-200 flex-shrink-0"
      style={{ width: open ? 220 : 64 }}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200" style={{ minHeight: 48 }}>
        {open && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-gray-900 tracking-widest">Ardian Secondaries & Primaries</div>
            <div className="text-xs text-gray-400 tracking-wide" style={{ fontSize: 10 }}>Data & AI Lab</div>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 mx-2 rounded transition-colors relative group',
                active
                  ? 'bg-blue-50 text-brand-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {active && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-500 rounded-r" />
              )}
              <Icon size={15} className="flex-shrink-0" />
              {open && (
                <span className="text-xs font-medium truncate">{item.label}</span>
              )}
              {!open && (
                <div className="absolute left-14 z-50 hidden group-hover:block">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3">
        {open ? (
          <div className="text-gray-400" style={{ fontSize: 10 }}>POC v1.0 &mdash; Internal Use Only</div>
        ) : (
          <div className="text-gray-400 text-center" style={{ fontSize: 10 }}>v1</div>
        )}
      </div>
    </div>
  )
}
