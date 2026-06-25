import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FilerobotImageEditor, { TABS, TOOLS, type FilerobotImageEditorConfig } from 'react-filerobot-image-editor'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/react'
import { apiFetch } from '@/lib/api'
import { Loader2, ArrowLeft, ImagePlus } from 'lucide-react'

type Stage = 'idle' | 'editing' | 'saving'

export const PhotoEditor = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const imageUrl = searchParams.get('imageUrl') || ''
  const assetId = searchParams.get('assetId') || ''
  const { getToken } = useAuth()
  const [stage, setStage] = useState<Stage>(imageUrl ? 'editing' : 'idle')
  const [saving, setSaving] = useState(false)
  const [source, setSource] = useState(imageUrl)
  const [toast, setToast] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setSource(url)
    setStage('editing')
    e.target.value = ''
  }

  const handleSave = useCallback<NonNullable<FilerobotImageEditorConfig['onSave']>>(async (savedImageData) => {
    const canvas = savedImageData.imageCanvas as HTMLCanvasElement
    if (!canvas) return

    setSaving(true)
    try {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Canvas to blob failed')

      const fileName = savedImageData.fullName || `${assetId ? 'edited-' + assetId : 'edited-image'}.png`
      const token = await getToken()
      if (!token) throw new Error('No auth token')

      const presignedRes = await apiFetch('/api/media/presigned-url', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileType: 'image/png', fileSize: blob.size })
      })
      if (!presignedRes.ok) throw new Error('Failed to get upload URL')

      const { uploadUrl, fileUrl } = await presignedRes.json()
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/png' },
        body: blob
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      const registerRes = await apiFetch('/api/media/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileUrl,
          fileType: 'image/png',
          fileSize: blob.size,
          tags: assetId ? ['edited', `source:${assetId}`] : ['edited']
        })
      })
      if (!registerRes.ok) throw new Error('Failed to register media asset')

      showToast('Saved to media library')
    } catch (err) {
      console.error('Save error:', err)
      showToast('Failed to save')
    } finally {
      setSaving(false)
    }
  }, [assetId, getToken])

  if (stage === 'idle') {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-black/40 rounded-2xl border border-white/10 gap-4 p-6 text-center">
        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
          <ImagePlus className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-white">Open an image to edit</p>
        <p className="text-xs text-muted-foreground">Choose an image from your device or launch the editor from Media Library.</p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
          <Button size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
            Open Image
          </Button>
        </div>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] relative bg-black/40 rounded-2xl overflow-hidden border border-white/10">
      {toast && (
        <div className="fixed top-6 right-6 z-[300] bg-green-500/20 border border-green-500/30 px-4 py-2.5 rounded-xl text-sm text-green-200 shadow-2xl">
          {toast}
        </div>
      )}
      {saving && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-sm text-white">Saving...</p>
          </div>
        </div>
      )}
      <FilerobotImageEditor
        source={source}
        onSave={handleSave}
        onClose={() => navigate(-1)}
        closeAfterSave={false}
        avoidChangesNotSavedAlertOnLeave
        defaultSavedImageName="edited-image"
        defaultSavedImageType="png"
        tabsIds={[
          TABS.ADJUST,
          TABS.AI,
          TABS.FILTERS,
          TABS.FINETUNE,
          TABS.ANNOTATE,
          TABS.WATERMARK,
          TABS.RESIZE,
        ]}
        defaultTabId={TABS.ADJUST}
        defaultToolId={TOOLS.CROP}
        useAiTab
        savingPixelRatio={1}
        previewPixelRatio={1}
        resetOnSourceChange
        useZoomPresetsMenu
        theme={{
          palette: {
            'txt-primary': '#ffffff',
            'txt-secondary': '#b3b3c2',
            'txt-secondary-invert': '#0f1117',
            'txt-placeholder': '#6b6b7a',
            'txt-warning': '#fca5a5',
            'txt-error': '#fca5a5',
            'txt-info': '#93c5fd',
            'accent-primary': '#7c3aed',
            'accent-primary-hover': '#8b5cf6',
            'accent-primary-active': '#6d28d9',
            'accent-primary-disabled': '#4a495a',
            'accent-stateless': '#4a495a',
            'bg-grey': '#1d1b20',
            'bg-stateless': '#141218',
            'bg-active': '#1d1b20',
            'bg-base-light': '#0f1117',
            'bg-base-medium': '#141218',
            'bg-primary': '#7c3aed',
            'bg-primary-light': '#8b5cf6',
            'bg-primary-hover': '#8b5cf6',
            'bg-primary-active': '#6d28d9',
            'bg-primary-stateless': '#4a495a',
            'bg-secondary': '#1d1b20',
            'bg-hover': '#2a2830',
            'bg-tooltip': '#141218',
            'icon-primary': '#ffffff',
            'icons-primary-opacity-0-6': 'rgba(255,255,255,0.6)',
            'icons-secondary': '#b3b3c2',
            'icons-placeholder': '#6b6b7a',
            'icons-invert': '#0f1117',
            'icons-muted': '#6b6b7a',
            'icons-primary-hover': '#ffffff',
            'icons-secondary-hover': '#b3b3c2',
            'btn-primary-text': '#ffffff',
            'btn-primary-text-0-6': 'rgba(255,255,255,0.6)',
            'btn-primary-text-0-4': 'rgba(255,255,255,0.4)',
            'btn-disabled-text': '#6b6b7a',
            'btn-secondary-text': '#b3b3c2',
            'link-primary': '#a78bfa',
            'link-stateless': '#c4b5fd',
            'link-hover': '#c4b5fd',
            'link-active': '#ddd6fe',
            'link-pressed': '#e9d5ff',
            'link-muted': '#6b6b7a',
            'borders-primary': 'rgba(255,255,255,0.1)',
            'borders-primary-hover': 'rgba(255,255,255,0.15)',
            'borders-secondary': 'rgba(255,255,255,0.05)',
            'borders-strong': 'rgba(255,255,255,0.2)',
            'borders-base-light': 'rgba(255,255,255,0.1)',
            'borders-base-medium': 'rgba(255,255,255,0.05)',
            'error': '#ef4444',
            'error-0-28-opacity': 'rgba(239,68,68,0.28)',
            'error-0-12-opacity': 'rgba(239,68,68,0.12)',
            'error-hover': '#f87171',
            'error-active': '#dc2626',
            'success': '#22c55e',
            'success-hover': '#16a34a',
            'success-Active': '#15803d',
            'warning': '#facc15',
            'warning-hover': '#eab308',
            'warning-active': '#ca8a04',
            'info': '#3b82f6',
            'modified': '#a78bfa',
          },
        }}
        translations={{
          profile: 'Edit Image',
          save: 'Save to Media Library',
          cancel: 'Cancel',
        }}
      />
    </div>
  )
}

export default PhotoEditor
