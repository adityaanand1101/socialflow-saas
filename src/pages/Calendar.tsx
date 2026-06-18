import { useState, useMemo } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isToday
} from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  Trash2,
  Image as ImageIcon
} from 'lucide-react'
import { 
  Instagram, Linkedin, Twitter, Youtube, Facebook, Threads, Bluesky, 
  Slack, Pinterest, Mastodon, Reddit, Discord, Telegram, GMB, Tumblr 
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { useAuth } from '@clerk/react'
import { apiFetch } from '@/lib/api'

type ViewMode = 'month' | 'week' | 'day'

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  x: Twitter,
  twitter: Twitter,
  facebook: Facebook,
  youtube: Youtube,
  threads: Threads,
  bluesky: Bluesky,
  slack: Slack,
  pinterest: Pinterest,
  mastodon: Mastodon,
  reddit: Reddit,
  discord: Discord,
  telegram: Telegram,
  gmb: GMB,
  tumblr: Tumblr
}

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const { updatePost, removePost } = useStore()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // --- React Query for Posts ---
  const { data: postsData } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const token = await getToken()
      const res = await apiFetch('/api/posts', { headers: { Authorization: `Bearer ${token}` } })
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  const posts = useMemo(() => Array.isArray(postsData) ? postsData : [], [postsData])

  // --- Navigation Logic ---
  const next = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const prev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const goToToday = () => setCurrentDate(new Date())

  // --- Date Range Calculation ---
  const calendarDays = useMemo(() => {
    let start, end;
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(monthStart)
      start = startOfWeek(monthStart)
      end = endOfWeek(monthEnd)
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate)
      end = endOfWeek(currentDate)
    } else {
      start = startOfDay(currentDate)
      end = endOfDay(currentDate)
    }

    return eachDayOfInterval({ start, end })
  }, [currentDate, viewMode])

  // --- Drag & Drop ---
  const handleDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.setData('postId', postId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    const postId = e.dataTransfer.getData('postId')
    if (!postId) return

    try {
      const token = await getToken()
      if (!token) return
      
      const post = posts.find(p => p.id === postId)
      if (!post) return

      const existingDate = new Date(post.scheduledAt || post.scheduledTime || new Date())
      const newDate = new Date(targetDate)
      newDate.setHours(existingDate.getHours())
      newDate.setMinutes(existingDate.getMinutes())

      await updatePost(token, postId, { scheduledTime: newDate.toISOString() })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    } catch (error) {
      console.error('Failed to reschedule post', error)
    }
  }

  const handleAddPost = (date?: Date) => {
    const targetDate = date || new Date()
    const dateStr = format(targetDate, "yyyy-MM-dd'T'HH:mm")
    navigate(`/app/compose?date=${encodeURIComponent(dateStr)}`)
  }

  const handleDeletePost = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this scheduled post?')) return
    const token = await getToken()
    if (token) {
      await removePost(token, id)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">Visualize and manage your multi-platform strategy.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}>
            <Clock className="w-4 h-4" /> Refresh
          </Button>
          <Button className="gap-2 bg-gradient-primary border-none shadow-glow hover:scale-105 transition-transform" onClick={() => handleAddPost()}>
            <Plus className="w-4 h-4" /> Create Post
          </Button>
        </div>
      </div>

      <Card className="flex flex-col border-white/10 bg-white/5 backdrop-blur-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/2 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
              <Button variant="ghost" size="icon" onClick={prev} className="h-9 w-9 text-white hover:bg-white/10"><ChevronLeft className="w-5 h-5" /></Button>
              <Button variant="ghost" className="px-4 text-white hover:bg-white/10 font-bold" onClick={goToToday}>Today</Button>
              <Button variant="ghost" size="icon" onClick={next} className="h-9 w-9 text-white hover:bg-white/10"><ChevronRight className="w-5 h-5" /></Button>
            </div>
            <h2 className="text-xl font-bold text-white min-w-[200px]">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
            </h2>
          </div>
          
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <Button 
                key={mode}
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-8 px-4 rounded-lg transition-all capitalize font-medium",
                  viewMode === mode ? "text-white bg-purple-500/20 shadow-inner" : "text-muted-foreground hover:text-white"
                )}
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        <div className="">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-white/10 bg-[#16141a] sticky top-[73px] sm:top-[73px] z-[40] shadow-md">
            {(viewMode === 'day' ? [currentDate] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, idx) => (
              <div 
                key={typeof day === 'string' ? day : idx} 
                className={cn(
                  "p-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-r border-white/10 last:border-r-0",
                  viewMode === 'day' && "col-span-7"
                )}
              >
                {typeof day === 'string' ? day : format(day, 'EEEE')}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className={cn(
            "grid flex-1 min-h-[700px]",
            viewMode === 'day' ? "grid-cols-1" : "grid-cols-7"
          )}>
            {calendarDays.map((day, i) => {
              const dayPosts = posts.filter(p => {
                const pDate = new Date(p.scheduledAt || p.scheduledTime);
                return isSameDay(pDate, day);
              }).sort((a, b) => new Date(a.scheduledAt || a.scheduledTime).getTime() - new Date(b.scheduledAt || b.scheduledTime).getTime());

              const isCurrentMonth = isSameMonth(day, currentDate)
              
              return (
                <div 
                  key={i} 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, day)}
                  className={cn(
                    "min-h-[140px] p-2 border-r border-b border-white/10 last:border-r-0 relative group transition-all duration-200 flex flex-col",
                    !isCurrentMonth && viewMode === 'month' ? "bg-black/40 opacity-40" : "hover:bg-white/2",
                    isToday(day) && "bg-purple-500/5 ring-1 ring-inset ring-purple-500/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-[10px] sm:text-xs font-bold transition-all",
                      isToday(day) ? "w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow rotate-3" : 
                      isCurrentMonth ? "text-white/80" : "text-white/20"
                    )}>
                      {format(day, 'd')}
                    </span>
                    <button 
                      onClick={() => handleAddPost(day)}
                      className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 pr-1">
                    {dayPosts.map((post) => (
                      <div 
                        key={post.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, post.id)}
                        onClick={() => navigate(`/app/compose?postId=${post.id}`)}
                        className={cn(
                          "p-1 sm:p-1.5 rounded-lg border flex flex-col gap-0.5 sm:gap-1 cursor-grab hover:scale-[1.02] transition-all active:cursor-grabbing group/post relative",
                          post.status === 'published' ? "bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]" :
                          post.status === 'scheduled' ? "bg-purple-500/10 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]" :
                          "bg-white/5 border-white/10"
                        )}
                      >
                         <div className="flex items-center justify-between">
                            <div className="flex -space-x-1">
                               {post.platforms?.map((plat: string) => {
                                 const Icon = platformIcons[plat] || ImageIcon;
                                 return <Icon key={plat} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/80 ring-[1px] sm:ring-2 ring-[#1a1820] rounded-sm bg-[#1a1820]" />;
                               })}
                            </div>
                            <span className="text-[7px] sm:text-[8px] font-bold text-white/40">
                              {format(new Date(post.scheduledAt || post.scheduledTime), 'HH:mm')}
                            </span>
                         </div>
                         <p className="text-[9px] sm:text-[10px] text-white/90 line-clamp-1 sm:line-clamp-2 leading-tight">
                           {post.caption || post.content || 'No caption'}
                         </p>

                         {/* Quick Actions Hover */}
                         <div className="absolute top-0 right-0 p-0.5 sm:p-1 opacity-0 group-hover/post:opacity-100 transition-opacity">
                            <button onClick={(e) => handleDeletePost(e, post.id)} className="p-0.5 sm:p-1 rounded bg-black/60 text-red-400 hover:text-red-300">
                              <Trash2 className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Published</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Draft</span>
            </div>
        </div>
      </Card>
    </div>
  )
}

