

export type ElementType = 'image' | 'text' | 'shape'

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line'

export interface DesignElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  zIndex: number
  src?: string
  text?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '600' | '700' | '800'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  fill?: string
  stroke?: string
  strokeWidth?: number
  shapeType?: ShapeType
  cornerRadius?: number
  name?: string
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
}

export type ToolType = 'cursor' | 'text' | 'shape' | 'image' | 'upload'

export type TabId = 'elements' | 'text' | 'upload' | 'layers' | 'search'

export interface EditorState {
  elements: DesignElement[]
  selectedId: string | null
  activeTool: ToolType
  activeTab: TabId
  canvasWidth: number
  canvasHeight: number
  canvasColor: string
  history: DesignElement[][]
  historyIndex: number
  zoom: number
  panX: number
  panY: number
}

export type EditorAction =
  | { type: 'ADD_ELEMENT'; payload: DesignElement }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; updates: Partial<DesignElement> } }
  | { type: 'DELETE_ELEMENT'; payload: string }
  | { type: 'SELECT_ELEMENT'; payload: string | null }
  | { type: 'SET_TOOL'; payload: ToolType }
  | { type: 'SET_TAB'; payload: TabId }
  | { type: 'SET_CANVAS_SIZE'; payload: { width: number; height: number } }
  | { type: 'SET_CANVAS_COLOR'; payload: string }
  | { type: 'REORDER_ELEMENT'; payload: { id: string; direction: 'up' | 'down' | 'top' | 'bottom' } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'LOAD_ELEMENTS'; payload: DesignElement[] }
  | { type: 'SET_DIMENSIONS'; payload: { width: number; height: number } }
