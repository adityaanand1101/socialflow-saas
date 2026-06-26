import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FilerobotImageEditor, { TABS, TOOLS, type FilerobotImageEditorConfig } from 'react-filerobot-image-editor'
import { useAuth } from '@clerk/react'
import { apiFetch } from '@/lib/api'
import { Loader2 } from 'lucide-react'

const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export const PhotoEditor = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const imageUrl = searchParams.get('imageUrl') || ''
  const assetId = searchParams.get('assetId') || ''
  const { getToken } = useAuth()
  const [saving, setSaving] = useState(false)
  const [source, setSource] = useState(imageUrl || TRANSPARENT_PIXEL)
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

  return (
    <div className="h-[calc(100vh-4rem)] relative bg-black/40 rounded-2xl overflow-hidden border border-white/10">
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
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
        defaultToolId={TOOLS.BRIGHTNESS}
        useAiTab
        savingPixelRatio={1}
        previewPixelRatio={1}
        resetOnSourceChange
        previewBgColor="#0f1117"
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
            'accent-primary-disabled': '#2a2830',
            'accent-secondary-disabled': '#1d1b20',
            'accent-stateless': '#7c3aed',
            'accent-stateless_0_4_opacity': 'rgba(124,58,237,0.4)',
            'accent_0_5_opacity': 'rgba(124,58,237,0.05)',
            'accent_0_5_5_opacity': 'rgba(124,58,237,0.55)',
            'accent_0_7_opacity': 'rgba(124,58,237,0.7)',
            'accent_1_2_opacity': 'rgba(124,58,237,0.12)',
            'accent_1_8_opacity': 'rgba(124,58,237,0.18)',
            'accent_2_8_opacity': 'rgba(124,58,237,0.28)',
            'accent_4_0_opacity': 'rgba(124,58,237,0.4)',
            'bg-grey': '#1a1a21',
            'bg-stateless': '#141218',
            'bg-active': '#1a1a21',
            'bg-base-light': '#0f1117',
            'bg-base-medium': '#141218',
            'bg-primary': '#0f1117',
            'bg-primary-light': '#141218',
            'bg-primary-hover': '#1a1a21',
            'bg-primary-active': '#1d1b20',
            'bg-primary-0-5-opacity': 'rgba(15,17,23,0.5)',
            'bg-primary-stateless': '#1a1a21',
            'bg-secondary': '#141218',
            'bg-hover': '#1a1a21',
            'bg-tooltip': '#1d1b20',
            'icon-primary': '#b3b3c2',
            'icons-primary-opacity-0-6': 'rgba(179,179,194,0.6)',
            'icons-secondary': '#6b6b7a',
            'icons-placeholder': '#4a495a',
            'icons-invert': '#ffffff',
            'icons-muted': '#6b6b7a',
            'icons-primary-hover': '#ffffff',
            'icons-secondary-hover': '#b3b3c2',
            'btn-primary-text': '#ffffff',
            'btn-primary-text-0-6': 'rgba(255,255,255,0.6)',
            'btn-primary-text-0-4': 'rgba(255,255,255,0.4)',
            'btn-disabled-text': '#4a495a',
            'btn-secondary-text': '#b3b3c2',
            'link-primary': '#a78bfa',
            'link-stateless': '#c4b5fd',
            'link-hover': '#c4b5fd',
            'link-active': '#ddd6fe',
            'link-pressed': '#e9d5ff',
            'link-muted': '#6b6b7a',
            'borders-primary': 'rgba(255,255,255,0.06)',
            'borders-primary-hover': 'rgba(255,255,255,0.10)',
            'borders-secondary': 'rgba(255,255,255,0.04)',
            'borders-strong': 'rgba(255,255,255,0.12)',
            'borders-invert': '#1a1a21',
            'border-hover-bottom': 'rgba(124,58,237,0.18)',
            'border-active-bottom': '#7c3aed',
            'border-primary-stateless': 'rgba(255,255,255,0.06)',
            'borders-button': 'rgba(255,255,255,0.08)',
            'borders-item': 'rgba(255,255,255,0.04)',
            'borders-base-light': 'rgba(124,58,237,0.2)',
            'borders-base-medium': 'rgba(124,58,237,0.3)',
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
            'active-secondary': '#8b5cf6',
            'active-secondary-hover': 'rgba(139,92,246,0.08)',
            'tag': '#4a495a',
            'states-error-disabled-text': 'rgba(239,68,68,0.3)',
            'light-shadow': 'rgba(0,0,0,0.3)',
            'medium-shadow': 'rgba(0,0,0,0.4)',
            'large-shadow': 'rgba(0,0,0,0.5)',
            'x-large-shadow': 'rgba(0,0,0,0.6)',
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
