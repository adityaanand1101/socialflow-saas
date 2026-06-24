import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { toastStore, type Toast } from '@/lib/toast/store'
import { cn } from '@/lib/utils'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles: Record<string, string> = {
  success: 'border-green-500/30 bg-green-500/10 text-green-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
}

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    const unsub = toastStore.subscribe(setItems)
    return () => unsub()
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm">
      {items.map(t => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border backdrop-blur-xl shadow-lg animate-in slide-in-from-right-2 fade-in",
              styles[t.type]
            )}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm flex-1">{t.message}</p>
            <button
              onClick={() => toastStore.remove(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
