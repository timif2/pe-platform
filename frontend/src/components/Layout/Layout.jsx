import React, { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
