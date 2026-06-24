type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type Listener = (toasts: Toast[]) => void

const listeners = new Set<Listener>()
let toasts: Toast[] = []

function emit() {
  listeners.forEach(l => l([...toasts]))
}

export const toastStore = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return toasts
  },
  add(message: string, type: ToastType = 'info', duration = 4000) {
    const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2)
    toasts = [...toasts, { id, message, type, duration }]
    emit()
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration)
    }
  },
  remove(id: string) {
    toasts = toasts.filter(t => t.id !== id)
    emit()
  },
  success(message: string) { this.add(message, 'success') },
  error(message: string) { this.add(message, 'error', 6000) },
  warning(message: string) { this.add(message, 'warning') },
  info(message: string) { this.add(message, 'info') },
}
