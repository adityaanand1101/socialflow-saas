import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import type { DesignElement, EditorAction, EditorState, ToolType, TabId } from './types'

const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 600

const initialState: EditorState = {
  elements: [],
  selectedId: null,
  activeTool: 'cursor',
  activeTab: 'elements',
  canvasWidth: DEFAULT_WIDTH,
  canvasHeight: DEFAULT_HEIGHT,
  canvasColor: '#ffffff',
  history: [[]],
  historyIndex: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
}

function saveHistory(state: EditorState): Partial<EditorState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(JSON.parse(JSON.stringify(state.elements)))
  if (newHistory.length > 50) newHistory.shift()
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'ADD_ELEMENT': {
      const el = { ...action.payload, zIndex: state.elements.length }
      return { ...state, ...saveHistory(state), elements: [...state.elements, el], selectedId: el.id }
    }
    case 'UPDATE_ELEMENT':
      return {
        ...state,
        ...saveHistory(state),
        elements: state.elements.map(e => e.id === action.payload.id ? { ...e, ...action.payload.updates } : e),
      }
    case 'DELETE_ELEMENT':
      return {
        ...state,
        ...saveHistory(state),
        elements: state.elements.filter(e => e.id !== action.payload),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
      }
    case 'SELECT_ELEMENT':
      return { ...state, selectedId: action.payload }
    case 'SET_TOOL':
      return { ...state, activeTool: action.payload }
    case 'SET_TAB':
      return { ...state, activeTab: action.payload }
    case 'SET_CANVAS_SIZE':
      return { ...state, canvasWidth: action.payload.width, canvasHeight: action.payload.height }
    case 'SET_CANVAS_COLOR':
      return { ...state, canvasColor: action.payload }
    case 'SET_DIMENSIONS':
      return { ...state, canvasWidth: action.payload.width, canvasHeight: action.payload.height }
    case 'REORDER_ELEMENT': {
      const els = [...state.elements]
      const idx = els.findIndex(e => e.id === action.payload.id)
      if (idx === -1) return state
      const [el] = els.splice(idx, 1)
      const maxZ = els.length
      switch (action.payload.direction) {
        case 'top': el.zIndex = maxZ; break
        case 'bottom': el.zIndex = 0; break
        case 'up': el.zIndex = Math.min(el.zIndex + 1, maxZ); break
        case 'down': el.zIndex = Math.max(el.zIndex - 1, 0); break
      }
      els.splice(el.zIndex, 0, el)
      const reindexed = els.map((e, i) => ({ ...e, zIndex: i }))
      return { ...state, ...saveHistory(state), elements: reindexed }
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      const newIdx = state.historyIndex - 1
      return { ...state, elements: JSON.parse(JSON.stringify(state.history[newIdx])), historyIndex: newIdx }
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIdx = state.historyIndex + 1
      return { ...state, elements: JSON.parse(JSON.stringify(state.history[newIdx])), historyIndex: newIdx }
    }
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.payload)) }
    case 'SET_PAN':
      return { ...state, panX: action.payload.x, panY: action.payload.y }
    case 'LOAD_ELEMENTS':
      return { ...state, elements: action.payload, history: [action.payload], historyIndex: 0 }
    default:
      return state
  }
}

interface EditorContextType {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
  addImage: (src: string, x?: number, y?: number, width?: number, height?: number) => void
  addText: (text?: string) => void
  addShape: (shapeType: DesignElement['shapeType']) => void
  exportAsBlob: () => Promise<Blob | null>
}

const EditorContext = createContext<EditorContextType | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const addImage = (src: string, x = 50, y = 50, width = 300, height = 200) => {
    dispatch({
      type: 'ADD_ELEMENT',
      payload: {
        id: uuid(),
        type: 'image',
        src,
        x, y, width, height,
        rotation: 0, opacity: 1, visible: true, zIndex: state.elements.length,
        shadowColor: 'rgba(0,0,0,0.1)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 4,
      },
    })
  }

  const addText = (text = 'Double-click to edit') => {
    dispatch({
      type: 'ADD_ELEMENT',
      payload: {
        id: uuid(),
        type: 'text',
        text,
        x: 50, y: 50, width: 300, height: 60,
        rotation: 0, opacity: 1, visible: true, zIndex: state.elements.length,
        fontFamily: 'Inter',
        fontSize: 32,
        fontWeight: '700',
        fill: '#1a1a2e',
        textAlign: 'left',
      },
    })
  }

  const addShape = (shapeType: DesignElement['shapeType'] = 'rectangle') => {
    dispatch({
      type: 'ADD_ELEMENT',
      payload: {
        id: uuid(),
        type: 'shape',
        shapeType,
        x: 100, y: 100, width: 150, height: 150,
        rotation: 0, opacity: 1, visible: true, zIndex: state.elements.length,
        fill: '#7c3aed',
        stroke: '#5b21b6',
        strokeWidth: 2,
        cornerRadius: shapeType === 'rectangle' ? 8 : 0,
        shadowColor: 'rgba(0,0,0,0.1)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 4,
      },
    })
  }

  const exportAsBlob = async (): Promise<Blob | null> => {
    return null
  }

  return (
    <EditorContext.Provider value={{ state, dispatch, addImage, addText, addShape, exportAsBlob }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}
