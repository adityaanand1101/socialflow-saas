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
          colors: {
            primaryBg: '#7c3aed',
            primaryBgHover: '#6d28d9',
            secondaryBg: '#1e1b2e',
            secondaryBgHover: '#2d2a3e',
            text: '#ffffff',
            textHover: '#e0d4ff',
            textMute: '#a0a0b0',
            textWarn: '#f87171',
            border: '#2d2a3e',
            borderLight: '#3d3a4e',
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
