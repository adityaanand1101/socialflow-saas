import { Calendar, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, isValid } from 'date-fns'
import { cn } from '@/lib/utils'

interface SchedulerPanelProps {
  showScheduler: boolean
  scheduledDate: string
  setScheduledDate: (v: string) => void
  isSubmitting: boolean
  caption: string
  handlePost: (status: 'published' | 'draft' | 'scheduled', force?: boolean) => void
  setShowScheduler: (v: boolean) => void
}

export default function SchedulerPanel({
  showScheduler,
  scheduledDate,
  setScheduledDate,
  isSubmitting,
  caption,
  handlePost,
  setShowScheduler,
}: SchedulerPanelProps) {
  if (!showScheduler) return null

  const parsed = new Date(scheduledDate)
  const formatted = isValid(parsed) ? format(parsed, 'MMMM d, yyyy at h:mm a') : ''

  return (
    <div className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-2 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-bold text-white">Schedule for Later</span>
      </div>
      <div className="flex gap-3 items-center">
        <input
          type="datetime-local"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          min={format(new Date(Date.now() + 10 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")}
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
        />
        <Button
          className="gap-2"
          onClick={() => { handlePost('scheduled'); setShowScheduler(false) }}
          disabled={isSubmitting || !caption}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
          Confirm
        </Button>
      </div>
      {formatted && (
        <p className="text-xs text-muted-foreground">
          Will publish on {formatted}
        </p>
      )}
    </div>
  )
}
