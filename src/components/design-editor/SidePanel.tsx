import {
  Square, Type, Image, Layers, Search, Trash2,
  ArrowUpToLine, ArrowDownToLine, GripVertical,
} from 'lucide-react'
import { useEditor } from './store'
import { StockPhotoSearch } from './StockPhotoSearch'
import { FontPicker } from './FontPicker'
import { cn } from '@/lib/utils'
import type { TabId } from './types'

export function SidePanel(_props: unknown) {
  const { state, dispatch, addText } = useEditor()

  const tabs: { id: TabId; icon: typeof Square; label: string }[] = [
    { id: 'elements', icon: Square, label: 'Elements' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'search', icon: Search, label: 'Photos' },
    { id: 'layers', icon: Layers, label: 'Layers' },
  ]

  const selectedEl = state.elements.find(e => e.id === state.selectedId)

  return (
    <div className="w-72 bg-[#141218] border-l border-white/10 flex flex-col shrink-0 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors",
              state.activeTab === tab.id
                ? "text-purple-300 border-b-2 border-purple-500"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {state.activeTab === 'elements' && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Basic Shapes</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => addText()}
                className="aspect-square rounded-xl border border-white/10 hover:border-purple-500/50 hover:bg-white/5 flex flex-col items-center justify-center gap-1.5 transition-all"
              >
                <Type className="w-5 h-5 text-purple-300" />
                <span className="text-[10px] text-muted-foreground">Text</span>
              </button>
              {(['rectangle', 'circle', 'triangle'] as const).map(shape => (
                <button
                  key={shape}
                  onClick={() => {
                    const el = {
                      id: crypto.randomUUID(),
                      type: 'shape' as const,
                      shapeType: shape,
                      x: 100, y: 100, width: 120, height: 120,
                      rotation: 0, opacity: 1, visible: true, zIndex: state.elements.length,
                      fill: '#7c3aed',
                      stroke: '#5b21b6',
                      strokeWidth: 2,
                      cornerRadius: shape === 'rectangle' ? 8 : 0,
                    }
                    dispatch({ type: 'ADD_ELEMENT', payload: el })
                  }}
                  className="aspect-square rounded-xl border border-white/10 hover:border-purple-500/50 hover:bg-white/5 flex flex-col items-center justify-center gap-1.5 transition-all"
                >
                  <div className={cn(
                    "w-8 h-8 rounded border-2 border-purple-400",
                    shape === 'circle' && "rounded-full",
                    shape === 'triangle' && "w-0 h-0 border-8 border-x-transparent border-b-purple-400 bg-transparent"
                  )} />
                  <span className="text-[10px] text-muted-foreground capitalize">{shape}</span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Canvas Background</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={state.canvasColor}
                  onChange={e => dispatch({ type: 'SET_CANVAS_COLOR', payload: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-white/10"
                />
                <span className="text-sm text-muted-foreground">{state.canvasColor}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Canvas Size</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={state.canvasWidth}
                  onChange={e => dispatch({ type: 'SET_DIMENSIONS', payload: { width: Number(e.target.value), height: state.canvasHeight } })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center"
                  min={100}
                  max={4000}
                />
                <span className="text-muted-foreground">×</span>
                <input
                  type="number"
                  value={state.canvasHeight}
                  onChange={e => dispatch({ type: 'SET_DIMENSIONS', payload: { width: state.canvasWidth, height: Number(e.target.value) } })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center"
                  min={100}
                  max={4000}
                />
              </div>
            </div>
          </div>
        )}

        {state.activeTab === 'text' && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Add Text</p>
            <button
              onClick={() => addText()}
              className="w-full px-4 py-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-colors text-sm font-medium"
            >
              + Add Text Box
            </button>

            {selectedEl?.type === 'text' && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Text Settings</p>
                <FontPicker
                  value={selectedEl.fontFamily || 'Inter'}
                  onChange={(font) => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { fontFamily: font } } })}
                />
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Content</label>
                  <textarea
                    value={selectedEl.text}
                    onChange={e => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { text: e.target.value } } })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none h-24 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Color</label>
                  <input
                    type="color"
                    value={selectedEl.fill || '#1a1a2e'}
                    onChange={e => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { fill: e.target.value } } })}
                    className="w-full h-10 rounded-xl cursor-pointer bg-transparent border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Alignment</label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedEl.id, updates: { textAlign: align } } })}
                        className={cn(
                          "flex-1 px-3 py-1.5 rounded-lg text-xs capitalize transition-colors",
                          selectedEl.textAlign === align
                            ? "bg-purple-600/20 text-purple-300"
                            : "bg-white/5 text-muted-foreground hover:text-white"
                        )}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {state.activeTab === 'search' && (
          <StockPhotoSearch onSelect={(url) => {
            const img = new window.Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
              dispatch({
                type: 'ADD_ELEMENT',
                payload: {
                  id: crypto.randomUUID(),
                  type: 'image',
                  src: url,
                  x: 50, y: 50,
                  width: img.width > 800 ? 400 : img.width,
                  height: img.height > 600 ? 300 : img.height,
                  rotation: 0, opacity: 1, visible: true, zIndex: state.elements.length,
                },
              })
            }
            img.src = url
          }} />
        )}

        {state.activeTab === 'layers' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Layers</p>
            {state.elements.length === 0 && (
              <p className="text-sm text-muted-foreground">No elements yet</p>
            )}
            {[...state.elements].reverse().map((el, i) => (
              <div
                key={el.id}
                onClick={() => dispatch({ type: 'SELECT_ELEMENT', payload: el.id })}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                  state.selectedId === el.id
                    ? "bg-purple-600/20 text-purple-300"
                    : "text-muted-foreground hover:bg-white/5"
                )}
              >
                <GripVertical className="w-3 h-3 shrink-0 opacity-40" />
                {el.type === 'text' && <Type className="w-3.5 h-3.5 shrink-0" />}
                {el.type === 'image' && <Image className="w-3.5 h-3.5 shrink-0" />}
                {el.type === 'shape' && <Square className="w-3.5 h-3.5 shrink-0" />}
                <span className="flex-1 truncate">{el.name || `${el.type} ${state.elements.length - i}`}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REORDER_ELEMENT', payload: { id: el.id, direction: 'top' } }) }}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Bring to front"
                  >
                    <ArrowUpToLine className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REORDER_ELEMENT', payload: { id: el.id, direction: 'bottom' } }) }}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Send to back"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_ELEMENT', payload: el.id }) }}
                    className="p-1 hover:bg-red-500/20 hover:text-red-300 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
