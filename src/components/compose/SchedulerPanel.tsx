import { Calendar, Clock, Loader2, X } from 'lucide-react'
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
  const formatted = isValid(parsed) ? format(parsed, 'MMMM d, yyyy · h:mm a') : ''

  return (
    <div className={cn(
      "fixed bottom-20 left-0 right-0 z-40 flex justify-center pointer-events-none",
      "animate-in fade-in slide-in-from-bottom-4 duration-200"
    )}>
      <div className="pointer-events-auto w-full max-w-4xl mx-4 bg-[#141218] border border-white/[0.08] rounded-2xl shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Schedule for Later</span>
          </div>
          <button
            onClick={() => setShowScheduler(false)}
            className="text-muted-foreground hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.04]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={format(new Date(Date.now() + 10 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")}
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/40 transition-colors"
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
          <p className="text-xs text-muted-foreground mt-2">
            Will publish on {formatted}
          </p>
        )}
      </div>
    </div>
  )
}
