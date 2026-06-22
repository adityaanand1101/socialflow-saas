import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Bell, Plus, ExternalLink, Settings, LogOut, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUser, useAuth } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body?: string | null
  link?: string | null
  read: boolean
  createdAt: string
}

export const Topbar = () => {
  const { user } = useUser()
  const { getToken, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const res = await apiFetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // silently fail
    }
  }, [getToken])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markRead = async (id: string) => {
    try {
      const token = await getToken()
      await apiFetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // silently fail
    }
  }

  const markAllRead = async () => {
    try {
      const token = await getToken()
      await apiFetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // silently fail
    }
  }

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markRead(n.id)
    if (n.link) navigate(n.link)
    setOpen(false)
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <header className="h-16 glass-morphism border-b flex items-center justify-between px-8 z-40">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search posts, analytics, or media..." 
            className="pl-10 bg-white/5 border-white/10 text-white w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button className="hidden md:flex items-center gap-2" onClick={() => navigate('/app/compose')}>
          <Plus className="w-4 h-4" />
          Quick Compose
        </Button>

        <div className="flex items-center gap-2 px-3" ref={dropdownRef}>
          <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-pink-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {open && (
            <div className="absolute top-16 right-24 w-80 bg-[#1c1824] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                    Mark all read
                  </Button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors border-b border-white/5 last:border-0 hover:bg-white/5",
                        !n.read && "bg-purple-500/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          n.read ? "bg-transparent" : "bg-purple-400"
                        )}>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", n.read ? "text-muted-foreground" : "text-white font-medium")}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {n.link && <ExternalLink className="w-3 h-3 text-muted-foreground/40 mt-1 shrink-0" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10" ref={userMenuRef}>
          <div className="hidden lg:block text-right">
            <p className="text-xs font-semibold text-white truncate max-w-[150px]">{user?.fullName || user?.username || 'User'}</p>
            <p className="text-[10px] text-muted-foreground">Workspace Admin</p>
          </div>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shrink-0 hover:ring-2 hover:ring-white/20 transition-all"
          >
            {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
          </button>

          {userMenuOpen && (
            <div className="absolute top-16 right-8 w-48 bg-[#1c1824] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white truncate">{user?.fullName || user?.username || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/app/settings'); setUserMenuOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => { signOut(); setUserMenuOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
