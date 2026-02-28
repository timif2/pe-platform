import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message = 'Failed to load data', onRetry, detail }) {
  return (
    <div className="panel p-8 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-10 h-10 rounded bg-red-50 flex items-center justify-center">
        <AlertTriangle size={18} className="text-red-500" />
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-800">{message}</div>
        {detail && <div className="text-xs text-gray-500 mt-1 max-w-sm">{detail}</div>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary mt-1"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  )
}

export function InlineError({ message, onRetry }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded text-xs text-red-600">
      <AlertTriangle size={12} className="flex-shrink-0" />
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
        >
          <RefreshCw size={11} />
          Retry
        </button>
      )}
    </div>
  )
}
