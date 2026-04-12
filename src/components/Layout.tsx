import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 10l8-8 8 8M4 9v8c0 .553.447 1 1 1h10c.553 0 1-.447 1-1V9" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 3h10v14H4V3M8 7h4M8 11h4M8 15h2" />
    </svg>
  )
}

function MaintenanceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 14l2-2M6 14l6-6M12 14l2-2M4 7.5l2-2 4 4" />
    </svg>
  )
}

function RentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2c4.418 0 8 1.791 8 4v8c0 2.209-3.582 4-8 4s-8-1.791-8-4V6c0-2.209 3.582-4 8-4M2 6c0 2.209 3.582 4 8 4s8-1.791 8-4M2 10c0 2.209 3.582 4 8 4s8-1.791 8-4" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 10c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3M4 18c0-2.209 2.686-4 6-4s6 1.791 6 4" />
    </svg>
  )
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const tabs = useMemo(
    () => [
      { id: 'home', label: 'Home', href: '/home', icon: HomeIcon },
      { id: 'documents', label: 'Documents', href: '/documents', icon: DocumentIcon },
      { id: 'maintenance', label: 'Maintenance', href: '/maintenance', icon: MaintenanceIcon },
      { id: 'rent', label: 'Rent', href: '/rent', icon: RentIcon },
      { id: 'profile', label: 'Profile', href: '/profile', icon: ProfileIcon },
    ],
    []
  )

  const activeTab = useMemo(() => {
    return tabs.find((tab) => location.pathname.startsWith(tab.href))?.id || 'home'
  }, [location.pathname, tabs])

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Guest'

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shrink-0">
        {/* Logo and greeting */}
        <div className="max-w-[430px] mx-auto">
          <div className="flex items-center gap-2 mb-3">
            {/* Logo - blue square with house icon */}
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
              </svg>
            </div>
            <span className="text-sm font-fraunces text-slate-900 font-semibold">Tenancy Portal</span>
          </div>
          <p className="font-fraunces italic text-slate-900 text-sm mb-1">
            {getGreeting()}, {firstName}
          </p>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-[1.5px]">
            Your home dashboard
          </p>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4 scroll-area">
        <div className="max-w-[430px] mx-auto">
          {children}
        </div>
      </main>

      {/* Sticky Bottom Navigation */}
      <nav className="sticky bottom-0 z-40 bg-white border-t border-slate-200 px-4 py-2 shrink-0">
        <div className="max-w-[430px] mx-auto flex items-center justify-around gap-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors flex-1 ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <TabIcon />
                <span className="text-xs font-mono font-medium tracking-[0.5px]">
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User menu button (floating, top-right) */}
      <div className="fixed top-4 right-4 z-30">
        <button
          onClick={logout}
          className="text-slate-400 hover:text-slate-900 text-xs font-mono uppercase tracking-[1px] transition-colors p-2"
          title="Sign out"
        >
          Exit
        </button>
      </div>
    </div>
  )
}
