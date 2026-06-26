import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Calendar,
  PenTool,
  Image as ImageIcon,
  BarChart3,
  Share2,
  Users,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  MessageSquareText,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { UserButton, useUser, useAuth } from '@clerk/react'
import { apiFetch } from '@/lib/api'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/app' },
  { icon: Calendar, label: 'Calendar', href: '/app/calendar' },
  { icon: PenTool, label: 'Compose', href: '/app/compose' },
  { icon: ImageIcon, label: 'Media Library', href: '/app/media' },
  { icon: Wand2, label: 'Design Studio', href: '/app/media/editor' },
  { icon: MessageSquareText, label: 'Inbox', href: '/app/inbox' },
  { icon: BarChart3, label: 'Analytics', href: '/app/analytics' },
  { icon: Share2, label: 'Channels', href: '/app/channels' },
  { icon: Sparkles, label: 'AI Studio', href: '/app/ai-studio' },
  { icon: Users, label: 'Team', href: '/app/team' },
  { icon: Settings, label: 'Settings', href: '/app/settings' },
]

export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar, workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspace } = useStore()
  const location = useLocation()
  const { user } = useUser()
  const { getToken } = useAuth()
  const [wsOpen, setWsOpen] = useState(false)

  const currentWorkspace = workspaces.find((w: { id: string; name: string; role: string }) => w.id === activeWorkspaceId)

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiFetch('/api/workspaces', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setWorkspaces(data)
          if (!activeWorkspaceId && data.length > 0) {
            setActiveWorkspace(data[0].id, data[0].role)
          }
        }
      } catch (e) {
        console.error('Failed to load workspaces', e)
      }
    }
    load()
  }, [getToken, setWorkspaces, activeWorkspaceId, setActiveWorkspace])

  return (
    <aside
      className={cn(
        "h-screen glass-morphism border-r transition-all duration-300 flex flex-col z-50",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SocialFlow</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hover:bg-white/5"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {/* Workspace Switcher */}
      {!sidebarCollapsed && workspaces.length > 0 && (
        <div className="px-3 mb-2 relative">
          <button
            onClick={() => setWsOpen(!wsOpen)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-sm font-medium text-white truncate">
                {currentWorkspace?.name || 'Workspace'}
              </span>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", wsOpen && "rotate-180")} />
          </button>
          {wsOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-[#1c1824] border border-white/10 rounded-lg shadow-xl z-50 py-1">
              {workspaces.map((w: { id: string; name: string; role: string }) => (
                <button
                  key={w.id}
                  onClick={() => { setActiveWorkspace(w.id, w.role); setWsOpen(false) }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left",
                    w.id === activeWorkspaceId
                      ? "text-purple-400 bg-purple-500/10"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{w.name}</span>
                  <span className="text-[10px] ml-auto opacity-50">{w.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 px-3 space-y-2 mt-2 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-gradient-primary text-white shadow-glow"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-white")} />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}

              {sidebarCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-navy-800 border border-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
        <div className={cn(
          "flex items-center gap-3 pt-2",
          sidebarCollapsed ? "justify-center" : "px-2"
        )}>
          <UserButton />
          {!sidebarCollapsed && user && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.fullName || user.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
