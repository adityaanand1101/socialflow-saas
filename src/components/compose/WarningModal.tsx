import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WarningModalProps {
  showWarnings: boolean
  setShowWarnings: (v: boolean) => void
  allWarnings: Record<string, string[]>
  hasWarnings: boolean
  handlePost: (status: 'published' | 'draft' | 'scheduled', force?: boolean) => void
}

export default function WarningModal({
  showWarnings,
  setShowWarnings,
  allWarnings,
  hasWarnings,
  handlePost,
}: WarningModalProps) {
  if (!showWarnings || !hasWarnings) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowWarnings(false)}>
      <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Post with warnings?</h3>
            <p className="text-sm text-muted-foreground">Some platforms may not display your content correctly.</p>
          </div>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {Object.entries(allWarnings).map(([pid, warnings]) =>
            warnings.map((w, i) => (
              <p key={`${pid}-${i}`} className="text-xs text-amber-300/80 ml-1">{pid}: {w}</p>
            ))
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowWarnings(false)}>Review</Button>
          <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { setShowWarnings(false); handlePost('published', true) }}>
            Post Anyway
          </Button>
        </div>
      </div>
    </div>
  )
}
