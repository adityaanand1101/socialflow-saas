import { useState } from 'react'
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
  subMonths 
} from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Download,
} from 'lucide-react'
import { Instagram, Linkedin, Twitter } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { useAuth } from '@clerk/react'

export const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { posts, updatePost } = useStore()
  const { getToken } = useAuth()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.setData('postId', postId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Required to allow drop
  }

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    const postId = e.dataTransfer.getData('postId')
    if (!postId) return

    try {
      const token = await getToken()
      if (!token) return
      
      // Keep the same time of day but change the date
      const post = posts.find(p => p.id === postId)
      if (!post) return

      const newDate = new Date(post.scheduledTime || post.scheduledAt || new Date())
      newDate.setFullYear(targetDate.getFullYear())
      newDate.setMonth(targetDate.getMonth())
      newDate.setDate(targetDate.getDate())

      await updatePost(token, postId, { scheduledTime: newDate.toISOString() })
    } catch (error) {
      console.error('Failed to reschedule post', error)
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">Visualize and schedule your social strategy.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filter</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Bulk Import</Button>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Add Post</Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-white/10 bg-white/5">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex items-center bg-white/5 rounded-lg border border-white/10">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-white"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-white"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex p-1 bg-white/5 rounded-lg border border-white/10">
            <Button variant="ghost" size="sm" className="h-7 text-white bg-white/10">Month</Button>
            <Button variant="ghost" size="sm" className="h-7 text-muted-foreground">Week</Button>
            <Button variant="ghost" size="sm" className="h-7 text-muted-foreground">Day</Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 border-b border-white/10">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest border-r border-white/10 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1 min-h-[600px]">
            {calendarDays.map((day, i) => {
              // Note: handling both scheduledTime (mock schema) and scheduledAt (new backend schema)
              const dayPosts = posts.filter(p => p.scheduledTime || (p as any).scheduledAt ? isSameDay(new Date(p.scheduledTime || (p as any).scheduledAt), day) : false)
              const isCurrentMonth = isSameMonth(day, monthStart)
              
              return (
                <div 
                  key={i} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                  className={cn(
                    "min-h-[120px] p-2 border-r border-b border-white/10 last:border-r-0 relative group transition-colors",
                    !isCurrentMonth ? "bg-black/20" : "hover:bg-white/5"
                  )}
                >
                  <span className={cn(
                    "text-xs font-medium",
                    isSameDay(day, new Date()) ? "w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white" : 
                    isCurrentMonth ? "text-white/60" : "text-white/20"
                  )}>
                    {format(day, 'd')}
                  </span>

                  <div className="mt-2 space-y-1">
                    {dayPosts.map((post) => (
                      <div 
                        key={post.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, post.id)}
                        className="p-1 rounded bg-gradient-primary/20 border border-purple-500/30 flex items-center gap-1 cursor-grab hover:bg-gradient-primary/30 transition-all active:cursor-grabbing"
                      >
                         <div className="shrink-0">
                            {post.platforms?.[0] === 'instagram' && <Instagram className="w-2.5 h-2.5 text-pink-400" />}
                            {post.platforms?.[0] === 'linkedin' && <Linkedin className="w-2.5 h-2.5 text-blue-400" />}
                            {post.platforms?.[0] === 'x' && <Twitter className="w-2.5 h-2.5 text-white" />}
                         </div>
                         <span className="text-[10px] text-white truncate">{post.caption || (post as any).content}</span>
                      </div>
                    ))}
                  </div>

                  <button className="absolute bottom-2 right-2 p-1 rounded-full bg-white/5 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}
