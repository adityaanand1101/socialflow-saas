import { Link, useLocation } from 'react-router-dom'
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
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { UserButton, useUser, SignOutButton } from '@clerk/react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/app' },
  { icon: Calendar, label: 'Calendar', href: '/app/calendar' },
  { icon: PenTool, label: 'Compose', href: '/app/compose' },
  { icon: ImageIcon, label: 'Media Library', href: '/app/media' },
  { icon: BarChart3, label: 'Analytics', href: '/app/analytics' },
  { icon: Share2, label: 'Channels', href: '/app/channels' },
  { icon: Sparkles, label: 'AI Studio', href: '/app/ai-studio' },
  { icon: Users, label: 'Team', href: '/app/team' },
  { icon: Settings, label: 'Settings', href: '/app/settings' },
]

export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useStore()
  const location = useLocation()
  const { user } = useUser()

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
        >
          {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-2 mt-4">
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
              
              {/* Tooltip for collapsed mode */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-navy-800 border border-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <SignOutButton>
          <button className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-200",
            sidebarCollapsed && "justify-center"
          )}>
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="font-medium">Log out</span>}
          </button>
        </SignOutButton>

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

