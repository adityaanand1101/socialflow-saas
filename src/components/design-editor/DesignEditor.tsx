import { useRef, useState, useCallback } from 'react'
import { EditorProvider, useEditor } from './store'
import { EditorCanvas } from './EditorCanvas'
import { Toolbar } from './Toolbar'
import { SidePanel } from './SidePanel'
import { ImportScreen } from './ImportScreen'
import { Loader2, Check, X } from 'lucide-react'

function EditorWorkspace() {
  const { state, dispatch } = useEditor()
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      const maxW = 400, maxH = 300
      let w = img.width, h = img.height
      if (w > maxW) { h = h * maxW / w; w = maxW }
      if (h > maxH) { w = w * maxH / h; h = maxH }
      dispatch({
        type: 'ADD_ELEMENT',
        payload: {
          id: crypto.randomUUID(),
          type: 'image',
          src: url,
          x: 50, y: 50, width: w, height: h,
          rotation: 0, opacity: 1, visible: true, zIndex: state.elements.length,
        },
      })
    }
    img.src = url
    e.target.value = ''
  }

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      const stageEl = document.querySelector('.konva-container canvas') as HTMLCanvasElement
      if (!stageEl) {
        showToast('Could not find canvas to export')
        setExporting(false)
        return
      }
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = state.canvasWidth
      exportCanvas.height = state.canvasHeight
      const ctx = exportCanvas.getContext('2d')
      if (!ctx) { setExporting(false); return }
      ctx.fillStyle = state.canvasColor
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
      const offscreenCanvas = stageEl
      const scaleX = state.canvasWidth / (offscreenCanvas.width - 80)
      const scaleY = state.canvasHeight / (offscreenCanvas.height - 80)
      const s = Math.min(scaleX, scaleY)
      const ox = (offscreenCanvas.width - 80 - state.canvasWidth / s) / 2
      const oy = (offscreenCanvas.height - 80 - state.canvasHeight / s) / 2
      ctx.drawImage(offscreenCanvas, ox, oy, state.canvasWidth / s, state.canvasHeight / s, 0, 0, exportCanvas.width, exportCanvas.height)
      exportCanvas.toBlob(async (blob) => {
        if (!blob) { setExporting(false); return }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'design.png'
        a.click()
        URL.revokeObjectURL(a.href)
        setExporting(false)
        showToast('Design exported')
      }, 'image/png')
    } catch {
      setExporting(false)
      showToast('Export failed')
    }
  }, [state.canvasWidth, state.canvasHeight, state.canvasColor])

  const handleDelete = () => {
    if (state.selectedId) {
      dispatch({ type: 'DELETE_ELEMENT', payload: state.selectedId })
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#0f1117]">
      <Toolbar onExport={handleExport} onUploadClick={handleUploadClick} />

      <div className="flex-1 flex min-h-0">
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <div className="konva-container w-full h-full">
            <EditorCanvas containerRef={containerRef} />
          </div>

          {/* Delete button */}
          {state.selectedId && (
            <button
              onClick={handleDelete}
              className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-colors z-50"
              title="Delete selected"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <SidePanel />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {exporting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-sm text-white">Exporting...</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-4 py-2.5 rounded-xl text-sm text-green-200 shadow-2xl">
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  )
}

export function DesignEditor() {
  const [hasImage, setHasImage] = useState(false)

  const handleImageLoaded = (_src: string) => {
    setHasImage(true)
  }

  return (
    <EditorProvider>
      <div className="h-[calc(100vh-4rem)] relative rounded-2xl overflow-hidden border border-white/10">
        {hasImage ? (
          <EditorWorkspace />
        ) : (
          <ImportScreen
            onImageLoaded={handleImageLoaded}
          />
        )}
      </div>
    </EditorProvider>
  )
}
