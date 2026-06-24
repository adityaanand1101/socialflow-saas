import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  const confirmStyles = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    default: 'bg-gradient-primary text-white',
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            variant === 'danger' ? 'bg-red-500/20' : variant === 'warning' ? 'bg-amber-500/20' : 'bg-purple-500/20'
          )}>
            <AlertTriangle className={cn(
              "w-5 h-5",
              variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-amber-400' : 'text-purple-400'
            )} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className={cn("flex-1", confirmStyles[variant])}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
