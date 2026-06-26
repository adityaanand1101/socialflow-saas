import {
  MousePointer2, Type, Square, Circle, Triangle, Image,
  Undo2, Redo2, Download, Search, Upload,
} from 'lucide-react'
import { FontPicker } from './FontPicker'
import { useEditor } from './store'
import { cn } from '@/lib/utils'
import type { ToolType, DesignElement } from './types'

interface ToolbarProps {
  onExport: () => void
  onUploadClick: () => void
}

export function Toolbar({ onExport, onUploadClick }: ToolbarProps) {
  const { state, dispatch } = useEditor()

  const tools: { id: ToolType; icon: typeof Type; label: string }[] = [
    { id: 'cursor', icon: MousePointer2, label: 'Select' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'shape', icon: Square, label: 'Shape' },
    { id: 'image', icon: Image, label: 'Image' },
  ]

  const shapes: { type: DesignElement['shapeType']; icon: typeof Square; label: string }[] = [
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'triangle', icon: Triangle, label: 'Triangle' },
  ]

  const selectedEl = state.elements.find(e => e.id === state.selectedId)

  const handleFontChange = (fontFamily: string) => {
    if (selectedEl) {
      dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { fontFamily } } })
    }
  }

  const addShape = (shapeType: DesignElement['shapeType']) => {
    dispatch({ type: 'SET_TOOL', payload: 'cursor' })
    const addShapeFn = () => {
      const el = {
        id: crypto.randomUUID(),
        type: 'shape' as const,
        shapeType,
        x: 100, y: 100, width: 150, height: 150,
        rotation: 0, opacity: 1, visible: true, zIndex: state.elements.length,
        fill: '#7c3aed',
        stroke: '#5b21b6',
        strokeWidth: 2,
        cornerRadius: shapeType === 'rectangle' ? 8 : 0,
      }
      dispatch({ type: 'ADD_ELEMENT', payload: el })
    }
    addShapeFn()
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#141218] border-b border-white/10 shrink-0 overflow-x-auto">
      {/* Tool selection */}
      <div className="flex items-center gap-1 mr-2 pr-2 border-r border-white/10">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => dispatch({ type: 'SET_TOOL', payload: tool.id })}
            className={cn(
              "p-2 rounded-lg transition-colors",
              state.activeTool === tool.id
                ? "bg-purple-600/20 text-purple-300"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
            title={tool.label}
          >
            <tool.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Shape sub-tools */}
      {state.activeTool === 'shape' && (
        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-white/10">
          {shapes.map(s => (
            <button
              key={s.type}
              onClick={() => addShape(s.type)}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
              title={s.label}
            >
              <s.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}

      {/* Font selector when text is selected */}
      {selectedEl?.type === 'text' && (
        <div className="flex items-center gap-2 mr-2 pr-2 border-r border-white/10">
          <FontPicker
            value={selectedEl.fontFamily || 'Inter'}
            onChange={(font) => handleFontChange(font)}
            compact
          />
          <input
            type="number"
            value={selectedEl.fontSize || 32}
            onChange={e => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { fontSize: Number(e.target.value) } } })}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white w-16 text-center focus:outline-none focus:border-purple-500/50"
            min={8}
            max={200}
          />
          <button
            onClick={() => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { fontWeight: selectedEl.fontWeight === 'bold' || selectedEl.fontWeight === '700' ? 'normal' as const : '700' as const } } })}
            className={cn("p-2 rounded-lg transition-colors", (selectedEl.fontWeight === 'bold' || selectedEl.fontWeight === '700' || selectedEl.fontWeight === '800') ? "bg-purple-600/20 text-purple-300" : "text-muted-foreground hover:text-white hover:bg-white/5")}
            title="Bold"
          >
            <span className="font-bold text-sm">B</span>
          </button>
          <button
            onClick={() => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' as const : 'italic' as const } } })}
            className={cn("p-2 rounded-lg transition-colors", selectedEl.fontStyle === 'italic' ? "bg-purple-600/20 text-purple-300" : "text-muted-foreground hover:text-white hover:bg-white/5")}
            title="Italic"
          >
            <span className="italic text-sm">I</span>
          </button>
          <input
            type="color"
            value={selectedEl.fill || '#1a1a2e'}
            onChange={e => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { fill: e.target.value } } })}
            className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
            title="Text color"
          />
        </div>
      )}

      {/* Selected element color & delete */}
      {selectedEl && selectedEl.type === 'shape' && (
        <div className="flex items-center gap-2 mr-2 pr-2 border-r border-white/10">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Fill
            <input
              type="color"
              value={selectedEl.fill || '#7c3aed'}
              onChange={e => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { fill: e.target.value } } })}
              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
            />
          </label>
        </div>
      )}

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={state.historyIndex <= 0}
          className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={state.historyIndex >= state.history.length - 1}
          className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>

        <button
          onClick={() => dispatch({ type: 'SET_TAB', payload: 'search' })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          <Search className="w-4 h-4" />
          Photos
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
  )
}

