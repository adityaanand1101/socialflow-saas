import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Circle, Text, Image as KonvaImage, Transformer, Line, Group } from 'react-konva'
import type Konva from 'konva'
import { useEditor } from './store'
import type { DesignElement } from './types'

interface EditorCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function EditorCanvas({ containerRef }: EditorCanvasProps) {
  const { state, dispatch } = useEditor()
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({})
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef])

  useEffect(() => {
    const newImages: Record<string, HTMLImageElement> = {}
    state.elements.filter(e => e.type === 'image' && e.src && !images[e.src]).forEach(el => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = el.src!
      img.onload = () => setImages(prev => ({ ...prev, [el.src!]: img }))
    })
  }, [state.elements])

  useEffect(() => {
    const tr = transformerRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const selectedNode = state.selectedId
      ? stage.findOne('#' + state.selectedId)
      : null
    if (selectedNode) {
      tr.nodes([selectedNode])
      tr.getLayer()?.batchDraw()
    } else {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }
  }, [state.selectedId, state.elements])

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id, updates: { x: e.target.x(), y: e.target.y() } } })
  }, [dispatch])

  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>, id: string) => {
    const node = e.target
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: {
        id,
        updates: {
          x: node.x(),
          y: node.y(),
          width: node.width() * node.scaleX(),
          height: node.height() * node.scaleY(),
          rotation: node.rotation(),
        },
      },
    })
  }, [dispatch])

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      dispatch({ type: 'SELECT_ELEMENT', payload: null })
    }
  }, [dispatch])

  const handleDoubleClick = useCallback((el: DesignElement) => {
    if (el.type === 'text') {
    }
  }, [])

  const canvasW = state.canvasWidth
  const canvasH = state.canvasHeight
  const scale = Math.min(
    (containerSize.width - 80) / canvasW,
    (containerSize.height - 80) / canvasH,
    1.5
  )
  const offsetX = (containerSize.width - canvasW * scale) / 2
  const offsetY = (containerSize.height - canvasH * scale) / 2

  const sortedElements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <Stage
      ref={stageRef}
      width={containerSize.width}
      height={containerSize.height}
      onMouseDown={handleStageClick}
      style={{ background: '#1a1a21' }}
    >
      <Layer>
        <Rect
          x={offsetX}
          y={offsetY}
          width={canvasW * scale}
          height={canvasH * scale}
          fill={state.canvasColor}
          shadowColor="rgba(0,0,0,0.3)"
          shadowBlur={30}
          shadowOffsetX={0}
          shadowOffsetY={8}
        />
      </Layer>
      <Layer>
        <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          {sortedElements.map(el => (
            <CanvasElement
              key={el.id}
              element={el}
              imgElement={images[el.src || '']}
              isSelected={state.selectedId === el.id}
              onSelect={() => dispatch({ type: 'SELECT_ELEMENT', payload: el.id })}
              onDragEnd={(e) => handleDragEnd(e, el.id)}
              onTransformEnd={(e) => handleTransformEnd(e, el.id)}
              onDoubleClick={() => handleDoubleClick(el)}
            />
          ))}
        </Group>
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox
            return newBox
          }}
          borderStroke="#7c3aed"
          borderStrokeWidth={1.5}
          anchorStroke="#7c3aed"
          anchorFill="#1a1a21"
          anchorSize={8}
          rotateEnabled={true}
          keepRatio={false}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
        />
      </Layer>
    </Stage>
  )
}

interface CanvasElementProps {
  element: DesignElement
  imgElement?: HTMLImageElement
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void
  onDoubleClick: () => void
}

function CanvasElement({ element: el, imgElement, isSelected, onSelect, onDragEnd, onTransformEnd, onDoubleClick }: CanvasElementProps) {
  const sharedProps = {
    id: el.id,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    opacity: el.opacity,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd,
    onTransformEnd,
    onDblClick: onDoubleClick,
    shadowColor: el.shadowColor,
    shadowBlur: el.shadowBlur,
    shadowOffsetX: el.shadowOffsetX,
    shadowOffsetY: el.shadowOffsetY,
  }

  if (el.type === 'image' && imgElement) {
    return (
      <KonvaImage
        {...sharedProps}
        image={imgElement}
      />
    )
  }

  if (el.type === 'text') {
    return (
      <Text
        {...sharedProps}
        text={el.text}
        fontSize={el.fontSize}
        fontFamily={el.fontFamily || 'Inter'}
        fill={el.fill || '#1a1a2e'}
        fontStyle={(el.fontWeight === 'bold' || el.fontWeight === '700' || el.fontWeight === '800' ? 'bold ' : '') + (el.fontStyle === 'italic' ? 'italic' : '')}
        align={el.textAlign || 'left'}
        width={el.width}
        height={el.height}
      />
    )
  }

  if (el.type === 'shape') {
    switch (el.shapeType) {
      case 'circle':
        return (
          <Circle
            {...sharedProps}
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            radius={Math.min(el.width, el.height) / 2}
            x={el.x + el.width / 2}
            y={el.y + el.height / 2}
            width={el.width}
            height={el.height}
            onDragEnd={(e) => {
              el.x = e.target.x() - el.width / 2
              el.y = e.target.y() - el.height / 2
              onDragEnd(e)
            }}
          />
        )
      case 'triangle':
        return (
          <Line
            {...sharedProps}
            points={[el.width / 2, 0, el.width, el.height, 0, el.height]}
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            closed
          />
        )
      default:
        return (
          <Rect
            {...sharedProps}
            fill={el.fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            cornerRadius={el.cornerRadius || 0}
          />
        )
    }
  }

  return null
}
