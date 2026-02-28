import React from 'react'
import clsx from 'clsx'

function Skeleton({ className }) {
  return (
    <div
      className={clsx(
        'bg-gray-200 rounded animate-pulse',
        className
      )}
    />
  )
}

export function KPICardSkeleton() {
  return (
    <div className="panel px-4 py-3">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-7 w-28 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="p-0">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-2 px-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-gray-100">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="py-2 px-3">
                    <Skeleton className="h-3 w-full" style={{ width: `${50 + Math.random() * 50}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ChartSkeleton({ height = 200 }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="p-4">
        <Skeleton className="w-full" style={{ height }} />
      </div>
    </div>
  )
}

export default function LoadingState({ rows = 3, className = '' }) {
  return (
    <div className={clsx('space-y-4', className)}>
      <div className="grid grid-cols-3 gap-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
      <ChartSkeleton height={240} />
      <TableSkeleton rows={rows} />
    </div>
  )
}
