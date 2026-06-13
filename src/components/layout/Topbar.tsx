import { Search, Bell, ChevronDown, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@clerk/react'
import { useNavigate } from 'react-router-dom'

export const Topbar = () => {
  const { user } = useUser()
  const navigate = useNavigate()

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
        <Button className="hidden md:flex items-center gap-2" onClick={() => navigate('/compose')}>
          <Plus className="w-4 h-4" />
          Quick Compose
        </Button>

        <div className="flex items-center gap-2 px-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-[#0F1117]" />
          </Button>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <Avatar className="w-8 h-8 border border-white/20">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback>{user?.firstName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-white truncate max-w-[100px]">{user?.fullName || user?.username || 'User'}</p>
            <p className="text-[10px] text-muted-foreground">Workspace Admin</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
