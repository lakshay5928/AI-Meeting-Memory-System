import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Video, CheckSquare, Search,
  Bell, Settings, LogOut, Menu, X, Shield, User, Zap
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth/store'
import { useUnreadCount } from '@/features/notifications/hooks'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/meetings',      icon: Video,           label: 'Meetings' },
  { to: '/actions',       icon: CheckSquare,     label: 'Action Items' },
  { to: '/search',        icon: Search,          label: 'Smart Search' },
  { to: '/notifications', icon: Bell,            label: 'Notifications', badge: true },
]

export default function DashboardLayout() {
  const [open, setOpen] = useState(false)
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const { data: unread = 0 } = useUnreadCount()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const roleLabel: Record<string, string> = {
    team_member: 'Team Member',
    meeting_owner: 'Meeting Owner',
    workspace_manager: 'Workspace Manager',
    org_admin: 'Admin',
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center glow-brand-sm">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display tracking-wider text-xl text-white">AMMS</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 pl-10">AI Meeting Memory</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active')
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge && unread > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-medium">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))}

        {user?.role === 'org_admin' && (
          <NavLink
            to="/admin"
            onClick={() => setOpen(false)}
            className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
          >
            <Shield size={18} />
            <span>Admin Console</span>
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        <NavLink
          to="/profile"
          onClick={() => setOpen(false)}
          className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
        >
          <User size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {roleLabel[user?.role || 'team_member']}
            </p>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300">
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass border-r border-white/8 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 glass-strong z-50 lg:hidden"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setOpen(false)} className="btn-ghost p-2">
                  <X size={18} />
                </button>
              </div>
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 glass border-b border-white/8">
          <button onClick={() => setOpen(true)} className="btn-ghost p-2">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-brand-400" />
            <span className="font-display tracking-wider text-lg text-white">AMMS</span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
