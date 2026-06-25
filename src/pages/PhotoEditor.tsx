import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Stage, Layer, Image as KonvaImage, Transformer, Text, Rect, Circle, Line, Group } from 'react-konva'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/react'
import { apiFetch } from '@/lib/api'
import { Loader2, X, Undo2, Redo2, ZoomIn, ZoomOut, Download, Save, Trash2, RotateCcw, FlipHorizontal, FlipVertical, ImagePlus, Type, Square, Circle as CircleIcon, Pencil, Crop, Sliders, Palette, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToolType = 'select' | 'crop' | 'adjust' | 'filter' | 'text' | 'draw' | 'shape' | 'bgremove'

interface TextLayer {
  id: string
  type: 'text'
  x: number
  y: number
  text: string
  fontSize: number
  fontFamily: string
  fill: string
  rotation: number
  visible: boolean
}

interface ShapeLayer {
  id: string
  type: 'rect' | 'circle' | 'line'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  fill: string
  stroke: string
  strokeWidth: number
  rotation: number
  visible: boolean
  points?: number[]
}

interface DrawLayer {
  id: string
  type: 'draw'
  points: number[]
  stroke: string
  strokeWidth: number
  visible: boolean
}

type EditorLayer = TextLayer | ShapeLayer | DrawLayer

interface FilterSettings {
  brightness: number
  contrast: number
  saturate: number
  blur: number
  grayscale: number
  sepia: number
  hueRotate: number
}

const PRESET_FILTERS: { name: string; filters: Partial<FilterSettings> }[] = [
  { name: 'Normal', filters: {} },
  { name: 'Grayscale', filters: { grayscale: 100 } },
  { name: 'Sepia', filters: { sepia: 80 } },
  { name: 'Vintage', filters: { sepia: 40, contrast: 20, brightness: 10 } },
  { name: 'Dramatic', filters: { contrast: 50, saturate: 30 } },
  { name: 'Noir', filters: { grayscale: 100, contrast: 30, brightness: -10 } },
  { name: 'Warm', filters: { sepia: 20, saturate: 20 } },
  { name: 'Cool', filters: { hueRotate: 200, saturate: 20 } },
  { name: 'Fade', filters: { contrast: -20, saturate: -30 } },
  { name: 'Vibrant', filters: { saturate: 60, contrast: 20 } },
]

const filterToCss = (f: Partial<FilterSettings>) => {
  const b = ((f.brightness ?? 0) + 100) / 100
  const c = ((f.contrast ?? 0) + 100) / 100
  const s = ((f.saturate ?? 0) + 100) / 100
  const bl = (f.blur ?? 0)
  const gs = (f.grayscale ?? 0) / 100
  const sp = (f.sepia ?? 0) / 100
  const hr = (f.hueRotate ?? 0)
  return `brightness(${b}) contrast(${c}) saturate(${s}) blur(${bl}px) grayscale(${gs}) sepia(${sp}) hue-rotate(${hr}deg)`
}

let layerIdCounter = 0
const newLayerId = () => `layer_${++layerIdCounter}_${Date.now()}`

export const PhotoEditor = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialImageUrl = searchParams.get('imageUrl') || ''
  const initialAssetId = searchParams.get('assetId') || ''
  const { getToken } = useAuth()

  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageUrl, setImageUrl] = useState(initialImageUrl)
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 })
  const [assetId, setAssetId] = useState(initialAssetId)
  const [saving, setSaving] = useState(false)
  const [tool, setTool] = useState<ToolType>('select')

  const [layers, setLayers] = useState<EditorLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [history, setHistory] = useState<EditorLayer[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    brightness: 0, contrast: 0, saturate: 0, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0,
  })
  const [activeFilter, setActiveFilter] = useState<string>('Normal')

  const [textInput, setTextInput] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textSize, setTextSize] = useState(32)
  const [drawColor, setDrawColor] = useState('#ffffff')
  const [drawWidth, setDrawWidth] = useState(3)
  const [, setIsDrawing] = useState(false)
  const [shapeType, setShapeType] = useState<'rect' | 'circle'>('rect')
  const [shapeColor, setShapeColor] = useState('#6366f1')
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [bgRemoving, setBgRemoving] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const stageRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const currentDrawPointsRef = useRef<number[]>([])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    if (initialImageUrl) loadImage(initialImageUrl)
  }, [initialImageUrl])

  useEffect(() => {
    if (transformerRef.current && selectedLayerId) {
      const node = stageRef.current?.findOne(`#${selectedLayerId}`)
      if (node) {
        transformerRef.current.nodes([node])
        transformerRef.current.getLayer()?.batchDraw()
        return
      }
    }
    if (transformerRef.current) {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedLayerId, layers])

  const pushHistory = useCallback((newLayers: EditorLayer[]) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1)
      next.push(JSON.parse(JSON.stringify(newLayers)))
      return next
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const loadImage = (url: string) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      const w = Math.min(img.naturalWidth, 1200)
      const h = Math.min(img.naturalHeight, 900)
      setImageSize({ width: w, height: h })
      setFilterSettings({ brightness: 0, contrast: 0, saturate: 0, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0 })
      setActiveFilter('Normal')
      setRotation(0)
      setFlipH(false)
      setFlipV(false)
      setLayers([])
      setSelectedLayerId(null)
      setHistory([[]])
      setHistoryIndex(0)
    }
    img.onerror = () => showToast('Failed to load image')
    img.src = url
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setAssetId('')
    loadImage(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setAssetId('')
      loadImage(url)
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setLayers(JSON.parse(JSON.stringify(history[historyIndex - 1])))
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setLayers(JSON.parse(JSON.stringify(history[historyIndex + 1])))
    }
  }

  const addLayer = (layer: EditorLayer) => {
    const newLayers = [...layers, layer]
    setLayers(newLayers)
    setSelectedLayerId(layer.id)
    pushHistory(newLayers)
  }

  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return
    const newLayers = layers.filter(l => l.id !== selectedLayerId)
    setLayers(newLayers)
    setSelectedLayerId(null)
    pushHistory(newLayers)
  }

  const handleStageClick = (e: any) => {
    if (tool === 'text' && textInput) {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return
      addLayer({
        id: newLayerId(),
        type: 'text',
        x: pos.x / zoom,
        y: pos.y / zoom,
        text: textInput,
        fontSize: textSize,
        fontFamily: 'Inter, sans-serif',
        fill: textColor,
        rotation: 0,
        visible: true,
      })
      setTextInput('')
      return
    }
    if (tool === 'shape' && shapeType) {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return
      const x = pos.x / zoom, y = pos.y / zoom
      if (shapeType === 'rect') {
        addLayer({
          id: newLayerId(), type: 'rect', x, y, width: 120, height: 80,
          fill: shapeColor, stroke: '#ffffff', strokeWidth: 1, rotation: 0, visible: true,
        })
      } else {
        addLayer({
          id: newLayerId(), type: 'circle', x, y, radius: 50,
          fill: shapeColor, stroke: '#ffffff', strokeWidth: 1, rotation: 0, visible: true,
        })
      }
      return
    }
    if (tool === 'select' || tool === 'adjust' || tool === 'filter' || tool === 'crop' || tool === 'bgremove') {
      const clickedOnLayer = e.target !== e.target.getStage()
      if (!clickedOnLayer) {
        setSelectedLayerId(null)
      }
    }
  }

  const handleMouseDown = (e: any) => {
    if (tool === 'draw') {
      isDrawingRef.current = true
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return
      currentDrawPointsRef.current = [pos.x / zoom, pos.y / zoom]
      setIsDrawing(true)
      const newLayer: DrawLayer = {
        id: newLayerId(), type: 'draw', points: [...currentDrawPointsRef.current],
        stroke: drawColor, strokeWidth: drawWidth, visible: true,
      }
      setLayers(prev => { const n = [...prev, newLayer]; return n })
      setSelectedLayerId(newLayer.id)
    }
    if (tool === 'crop' && image) {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return
      setIsCropping(true)
      setCropRect({ x: pos.x / zoom, y: pos.y / zoom, width: 0, height: 0 })
    }
  }

  const handleMouseMove = (e: any) => {
    if (tool === 'draw' && isDrawingRef.current) {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return
      const newPoints = [...currentDrawPointsRef.current, pos.x / zoom, pos.y / zoom]
      currentDrawPointsRef.current = newPoints
      setLayers(prev => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last?.type === 'draw') { last.points = newPoints }
        return copy
      })
    }
    if (tool === 'crop' && isCropping && cropRect) {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return
      setCropRect(prev => prev ? {
        ...prev,
        width: pos.x / zoom - prev.x,
        height: pos.y / zoom - prev.y,
      } : null)
    }
  }

  const handleMouseUp = () => {
    if (tool === 'draw' && isDrawingRef.current) {
      isDrawingRef.current = false
      setIsDrawing(false)
      pushHistory(layers)
    }
    if (tool === 'crop' && isCropping) {
      setIsCropping(false)
      if (cropRect && Math.abs(cropRect.width) > 10 && Math.abs(cropRect.height) > 10) {
        applyCrop()
      } else {
        setCropRect(null)
      }
    }
  }

  const applyCrop = async () => {
    if (!cropRect || !image) return
    const sx = Math.abs(cropRect.width)
    const sy = Math.abs(cropRect.height)
    if (sx < 10 || sy < 10) { setCropRect(null); return }
    const canvas = document.createElement('canvas')
    canvas.width = sx
    canvas.height = sy
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(image, Math.min(cropRect.x, cropRect.x + cropRect.width), Math.min(cropRect.y, cropRect.y + cropRect.height), sx, sy, 0, 0, sx, sy)
    const dataUrl = canvas.toDataURL('image/png')
    const img = new window.Image()
    img.onload = () => {
      setImage(img)
      setImageSize({ width: sx, height: sy })
      setCropRect(null)
    }
    img.src = dataUrl
    setImageUrl(dataUrl)
  }

  const applyBgRemove = async () => {
    if (!image) return
    setBgRemoving(true)
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const blob = await removeBackground(imageUrl)
      const url = URL.createObjectURL(blob)
      const img = new window.Image()
      img.onload = () => {
        setImage(img)
        setImageUrl(url)
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
        setBgRemoving(false)
        showToast('Background removed')
      }
      img.src = url
    } catch (err) {
      console.error('Background removal failed:', err)
      showToast('Background removal failed')
      setBgRemoving(false)
    }
  }

  const exportImage = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!image) { resolve(''); return }
      const canvas = document.createElement('canvas')
      canvas.width = imageSize.width
      canvas.height = imageSize.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(''); return }

      ctx.filter = filterToCss(filterSettings)
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
      ctx.drawImage(image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
      ctx.restore()
      ctx.filter = 'none'

      for (const layer of layers) {
        if (!layer.visible) continue
        if (layer.type === 'text') {
          ctx.font = `${layer.fontSize}px ${layer.fontFamily}`
          ctx.fillStyle = layer.fill
          ctx.save()
          ctx.translate(layer.x + canvas.width / 4, layer.y + canvas.height / 4)
          ctx.rotate((layer.rotation * Math.PI) / 180)
          ctx.fillText(layer.text, 0, 0)
          ctx.restore()
        } else if (layer.type === 'rect') {
          ctx.fillStyle = layer.fill
          ctx.save()
          ctx.translate(layer.x + canvas.width / 4, layer.y + canvas.height / 4)
          ctx.rotate((layer.rotation * Math.PI) / 180)
          ctx.fillRect(0, 0, layer.width || 0, layer.height || 0)
          ctx.restore()
        } else if (layer.type === 'circle') {
          ctx.fillStyle = layer.fill
          ctx.beginPath()
          ctx.arc(layer.x + canvas.width / 4, layer.y + canvas.height / 4, layer.radius || 0, 0, Math.PI * 2)
          ctx.fill()
        } else if (layer.type === 'draw') {
          ctx.strokeStyle = layer.stroke
          ctx.lineWidth = layer.strokeWidth
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          for (let i = 0; i < layer.points.length; i += 2) {
            if (i === 0) ctx.moveTo(layer.points[i] + canvas.width / 4, layer.points[i + 1] + canvas.height / 4)
            else ctx.lineTo(layer.points[i] + canvas.width / 4, layer.points[i + 1] + canvas.height / 4)
          }
          ctx.stroke()
        }
      }

      resolve(canvas.toDataURL('image/png'))
    })
  }

  const handleSave = async () => {
    const dataUrl = await exportImage()
    if (!dataUrl) return
    setSaving(true)
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'edited-image.png', { type: 'image/png' })

      if (assetId) {
        const formData = new FormData()
        formData.append('file', file)
        const token = await getToken()
        const res = await apiFetch(`/api/media/${assetId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!res.ok) throw new Error('Save failed')
        showToast('Saved to media library')
      } else {
        const token = await getToken()
        const presignedRes = await apiFetch('/api/media/presigned-url', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: 'edited-image.png', fileType: 'image/png', fileSize: blob.size })
        })
        if (!presignedRes.ok) throw new Error('Failed to get upload URL')
        const { uploadUrl, fileUrl } = await presignedRes.json()
        await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: blob })
        await apiFetch('/api/media/register', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: 'edited-image.png', fileUrl, fileType: 'image/png', fileSize: blob.size })
        })
        showToast('Saved to media library')
      }
    } catch (err) {
      console.error('Save error:', err)
      showToast('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    const dataUrl = await exportImage()
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = 'edited-image.png'
    link.href = dataUrl
    link.click()
    showToast('Image downloaded')
  }

  const getStageScale = () => {
    if (!containerRef.current) return zoom
    const cw = containerRef.current.clientWidth - 320
    const ch = containerRef.current.clientHeight - 80
    const scaleX = cw / imageSize.width
    const scaleY = ch / imageSize.height
    return Math.min(scaleX, scaleY, 1) * zoom
  }

  const selectedLayer = layers.find(l => l.id === selectedLayerId)

  const handleLayerTransformEnd = (e: any) => {
    const node = e.target
    const id = node.id()
    setLayers(prev => prev.map(l => {
      if (l.id !== id) return l
      if (l.type === 'text') {
        return { ...l, x: node.x(), y: node.y(), rotation: node.rotation() }
      }
      if (l.type === 'rect') {
        return { ...l, x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() }
      }
      if (l.type === 'circle') {
        return { ...l, x: node.x(), y: node.y(), radius: (node.radius() || 50) * node.scaleX(), rotation: node.rotation() }
      }
      return l
    }))
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black/40 rounded-2xl overflow-hidden border border-white/10" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      {toast && (
        <div className="fixed top-6 right-6 z-[300] bg-green-500/20 border border-green-500/30 px-4 py-2.5 rounded-xl text-sm text-green-200 shadow-2xl animate-in slide-in-from-top-2 fade-in">
          {toast}
        </div>
      )}

      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => navigate(-1)}>
            <X className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold text-white mr-2">Photo Editor</span>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={undo} disabled={historyIndex <= 0}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => setZoom(z => Math.min(5, z + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          <Button variant="outline" size="sm" className="gap-2 h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="w-3.5 h-3.5" /> Open
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-8 text-xs" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-2 h-8 text-xs" onClick={handleSave} disabled={saving || !image}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 flex flex-col items-center py-3 gap-1 border-r border-white/10 bg-black/20">
          <ToolButton icon={ImagePlus} label="Select" active={tool === 'select'} onClick={() => setTool('select')} />
          <ToolButton icon={Crop} label="Crop" active={tool === 'crop'} onClick={() => setTool('crop')} />
          <div className="w-8 h-px bg-white/10 my-1" />
          <ToolButton icon={Sliders} label="Adjust" active={tool === 'adjust'} onClick={() => setTool('adjust')} />
          <ToolButton icon={Palette} label="Filters" active={tool === 'filter'} onClick={() => setTool('filter')} />
          <div className="w-8 h-px bg-white/10 my-1" />
          <ToolButton icon={Type} label="Text" active={tool === 'text'} onClick={() => setTool('text')} />
          <ToolButton icon={Square} label="Shape" active={tool === 'shape'} onClick={() => setTool('shape')} />
          <ToolButton icon={Pencil} label="Draw" active={tool === 'draw'} onClick={() => setTool('draw')} />
          <div className="w-8 h-px bg-white/10 my-1" />
          <ToolButton icon={Wand2} label="Remove BG" active={tool === 'bgremove'} onClick={() => { setTool('bgremove'); applyBgRemove() }} loading={bgRemoving} />
          <div className="mt-auto mb-2">
            <ToolButton icon={Trash2} label="Delete" active={false} onClick={deleteSelectedLayer} disabled={!selectedLayerId} />
          </div>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#0a0a0f]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          {!image ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
                <ImagePlus className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium text-white">Drop an image here</p>
              <p className="text-xs">or click Open to browse files</p>
            </div>
          ) : (
            <Stage
              ref={stageRef}
              width={imageSize.width * getStageScale()}
              height={imageSize.height * getStageScale()}
              scaleX={getStageScale()}
              scaleY={getStageScale()}
              onClick={handleStageClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ margin: 'auto', cursor: tool === 'draw' ? 'crosshair' : tool === 'crop' ? 'crosshair' : tool === 'text' ? 'text' : 'default' }}
            >
              <Layer>
                <KonvaImage
                  image={image}
                  width={imageSize.width}
                  height={imageSize.height}
                  x={flipH ? imageSize.width / 2 : 0}
                  y={flipV ? imageSize.height / 2 : 0}
                  filters={[]}
                  opacity={1}
                  rotation={rotation}
                  scaleX={flipH ? -1 : 1}
                  scaleY={flipV ? -1 : 1}
                  offsetX={flipH ? imageSize.width / 2 : 0}
                  offsetY={flipV ? imageSize.height / 2 : 0}
                />
                {/* Apply filter via CSS on a wrapper image - use a semi-transparent overlay for filter preview */}
                <Rect
                  x={0} y={0} width={imageSize.width} height={imageSize.height}
                  fill={`rgba(0,0,0,${((filterSettings.brightness || 0) < 0 ? Math.abs(filterSettings.brightness) : 0) / 200})`}
                  listening={false}
                />
                {layers.filter(l => l.visible).map(layer => {
                  if (layer.type === 'text') {
                    return (
                      <Text
                        key={layer.id} id={layer.id}
                        x={layer.x} y={layer.y}
                        text={layer.text}
                        fontSize={layer.fontSize}
                        fontFamily={layer.fontFamily}
                        fill={layer.fill}
                        rotation={layer.rotation}
                        draggable={tool === 'select'}
                        onClick={() => setSelectedLayerId(layer.id)}
                        onDragEnd={(e) => {
                          const node = e.target
                          setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, x: node.x(), y: node.y() } as TextLayer : l))
                        }}
                      />
                    )
                  }
                  if (layer.type === 'rect') {
                    return (
                      <Rect
                        key={layer.id} id={layer.id}
                        x={layer.x} y={layer.y}
                        width={layer.width || 120}
                        height={layer.height || 80}
                        fill={layer.fill}
                        stroke={layer.stroke}
                        strokeWidth={layer.strokeWidth}
                        rotation={layer.rotation}
                        draggable={tool === 'select'}
                        onClick={() => setSelectedLayerId(layer.id)}
                        onDragEnd={(e) => {
                          const node = e.target
                          setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, x: node.x(), y: node.y() } as ShapeLayer : l))
                        }}
                      />
                    )
                  }
                  if (layer.type === 'circle') {
                    return (
                      <Circle
                        key={layer.id} id={layer.id}
                        x={layer.x} y={layer.y}
                        radius={layer.radius || 50}
                        fill={layer.fill}
                        stroke={layer.stroke}
                        strokeWidth={layer.strokeWidth}
                        rotation={layer.rotation}
                        draggable={tool === 'select'}
                        onClick={() => setSelectedLayerId(layer.id)}
                        onDragEnd={(e) => {
                          const node = e.target
                          setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, x: node.x(), y: node.y() } as ShapeLayer : l))
                        }}
                      />
                    )
                  }
                  if (layer.type === 'draw') {
                    return (
                      <Line
                        key={layer.id} id={layer.id}
                        points={layer.points}
                        stroke={layer.stroke}
                        strokeWidth={layer.strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        globalCompositeOperation="source-over"
                        listening={false}
                      />
                    )
                  }
                  return null
                })}
                {/* Crop overlay */}
                {tool === 'crop' && cropRect && (
                  <Group>
                    <Rect
                      x={cropRect.x} y={cropRect.y}
                      width={cropRect.width} height={cropRect.height}
                      stroke="#6366f1"
                      strokeWidth={2}
                      dash={[10, 5]}
                      fill="rgba(99,102,241,0.1)"
                    />
                  </Group>
                )}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 10 || newBox.height < 10) return oldBox
                    return newBox
                  }}
                  onTransformEnd={handleLayerTransformEnd}
                />
              </Layer>
            </Stage>
          )}
          {bgRemoving && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                <p className="text-sm text-white">Removing background...</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-64 border-l border-white/10 bg-black/20 overflow-y-auto p-4 space-y-4">
          {tool === 'adjust' && image && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Adjustments</h3>
              <SliderControl label="Brightness" value={filterSettings.brightness} min={-100} max={100} step={1} onChange={(v) => setFilterSettings(f => ({ ...f, brightness: v }))} />
              <SliderControl label="Contrast" value={filterSettings.contrast} min={-100} max={100} step={1} onChange={(v) => setFilterSettings(f => ({ ...f, contrast: v }))} />
              <SliderControl label="Saturation" value={filterSettings.saturate} min={-100} max={100} step={1} onChange={(v) => setFilterSettings(f => ({ ...f, saturate: v }))} />
              <SliderControl label="Blur" value={filterSettings.blur} min={0} max={10} step={0.5} onChange={(v) => setFilterSettings(f => ({ ...f, blur: v }))} />
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setFilterSettings({ brightness: 0, contrast: 0, saturate: 0, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0 })}>
                Reset
              </Button>
            </div>
          )}

          {tool === 'filter' && image && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filters</h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_FILTERS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => {
                      setActiveFilter(f.name)
                      setFilterSettings(prev => ({ ...prev, ...f.filters }))
                    }}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left",
                      activeFilter === f.name ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tool === 'text' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Add Text</h3>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your text..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none h-20"
              />
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Font Size</label>
                <input type="range" min={12} max={120} value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full accent-purple-500" />
                <span className="text-xs text-white">{textSize}px</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Color</label>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
              </div>
              <p className="text-[10px] text-muted-foreground">Click on the canvas to place text</p>
            </div>
          )}

          {tool === 'shape' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Add Shape</h3>
              <div className="flex gap-2">
                <button onClick={() => setShapeType('rect')} className={cn("flex-1 py-2 rounded-lg text-xs font-medium border transition-all", shapeType === 'rect' ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-white hover:bg-white/10")}>
                  <Square className="w-4 h-4 mx-auto mb-1" /> Rectangle
                </button>
                <button onClick={() => setShapeType('circle')} className={cn("flex-1 py-2 rounded-lg text-xs font-medium border transition-all", shapeType === 'circle' ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-white hover:bg-white/10")}>
                  <CircleIcon className="w-4 h-4 mx-auto mb-1" /> Circle
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Color</label>
                <input type="color" value={shapeColor} onChange={(e) => setShapeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
              </div>
              <p className="text-[10px] text-muted-foreground">Click on the canvas to place shape</p>
            </div>
          )}

          {tool === 'draw' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Draw</h3>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Brush Size</label>
                <input type="range" min={1} max={30} value={drawWidth} onChange={(e) => setDrawWidth(Number(e.target.value))} className="w-full accent-purple-500" />
                <span className="text-xs text-white">{drawWidth}px</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Color</label>
                <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
              </div>
              <p className="text-[10px] text-muted-foreground">Click and drag to draw on the canvas</p>
            </div>
          )}

          {tool === 'crop' && image && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Crop</h3>
              <p className="text-[10px] text-muted-foreground">Click and drag on the canvas to select crop area.</p>
              {cropRect && (
                <div className="space-y-2">
                  <div className="text-xs text-white">
                    <span className="text-muted-foreground">Selection:</span> {Math.round(Math.abs(cropRect.width))} x {Math.round(Math.abs(cropRect.height))}px
                  </div>
                  <Button size="sm" className="w-full text-xs" onClick={applyCrop}>
                    Apply Crop
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setCropRect(null)}>
                Cancel
              </Button>
            </div>
          )}

          {tool === 'select' && image && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transform</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setRotation(r => r - 90)}>
                  <RotateCcw className="w-3 h-3" /> Rotate
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setFlipH(f => !f)}>
                  <FlipHorizontal className="w-3 h-3" /> Flip H
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setFlipV(f => !f)}>
                  <FlipVertical className="w-3 h-3" /> Flip V
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => { setRotation(0); setFlipH(false); setFlipV(false) }}>
                  Reset
                </Button>
              </div>
              {selectedLayer && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-[10px] text-muted-foreground mb-2">Selected layer: {selectedLayer.type}</p>
                  <Button variant="outline" size="sm" className="w-full text-xs text-red-400 gap-1" onClick={deleteSelectedLayer}>
                    <Trash2 className="w-3 h-3" /> Delete Layer
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolButton({ icon: Icon, label, active, onClick, disabled, loading }: { icon: any; label: string; active: boolean; onClick: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group",
        active ? "bg-purple-500/20 text-purple-400" : "text-muted-foreground hover:text-white hover:bg-white/5",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-navy-900 border border-white/10 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
        {label}
      </span>
    </button>
  )
}

function SliderControl({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <label className="text-[10px] text-muted-foreground">{label}</label>
        <span className="text-[10px] text-white font-medium">{value > 0 ? '+' : ''}{value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-purple-500 h-1"
      />
    </div>
  )
}

export default PhotoEditor
