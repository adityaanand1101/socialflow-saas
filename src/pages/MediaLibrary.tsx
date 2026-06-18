import { useRef, useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import {
  Search,
  Upload,
  FolderPlus,
  Grid,
  List,
  MoreVertical,
  Video,
  FileText,
  Loader2,
  Trash2,
  ChevronLeft,
  Folder,
  Edit2,
  Download,
  Copy,
  Move,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@clerk/react'
import { cn } from '@/lib/utils'

const sortOptions = [
  { value: 'date', label: 'Date' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
]

const typeFilters = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
]

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  if (bytes > 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

export const MediaLibrary = () => {
  const {
    currentFolderId, uploadMedia, removeMedia,
    createFolder, updateFolder, removeFolder,
    moveAsset, setCurrentFolder, mediaViewMode, setMediaViewMode
  } = useStore()

  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<any | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Bulk selection
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingTargets, setDeletingTargets] = useState<{ type: 'asset' | 'assets'; ids: string[] } | null>(null)

  // Asset Rename Modal
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [renameAssetId, setRenameAssetId] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState('')

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['media', currentFolderId, searchQuery, sortBy, typeFilter],
    queryFn: async () => {
      const token = await getToken()
      const params = new URLSearchParams()
      if (currentFolderId) params.set('folderId', currentFolderId)
      else params.set('folderId', 'root')
      if (searchQuery) params.set('search', searchQuery)
      if (sortBy !== 'date') params.set('sort', sortBy)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const url = `/api/media?${params.toString()}`
      const res = await apiFetch(url, { headers: { Authorization: `Bearer ${token}` } })
      return res.json()
    },
    staleTime: 1000 * 30,
  })

  const media = data?.assets || []
  const folders = data?.folders || []

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const token = await getToken()
      if (!token) return
      await Promise.all(Array.from(files).map(file => uploadMedia(token, file, currentFolderId)))
      queryClient.invalidateQueries({ queryKey: ['media'] })
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast('success', `${files.length} file${files.length > 1 ? 's' : ''} uploaded`)
    } catch (error) {
      showToast('error', 'Upload failed')
    } finally {
      setUploading(false)
      setIsDragging(false)
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedAssetId) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return
    const token = await getToken()
    if (token) {
      if (editingFolderId) {
        await updateFolder(token, editingFolderId, newFolderName)
      } else {
        await createFolder(token, newFolderName, currentFolderId)
      }
      queryClient.invalidateQueries({ queryKey: ['media'] })
      setNewFolderName('')
      setEditingFolderId(null)
      setIsFolderModalOpen(false)
    }
  }, [newFolderName, editingFolderId, currentFolderId, getToken, updateFolder, createFolder, queryClient])

  const handleRenameAsset = async () => {
    if (!newFileName.trim() || !renameAssetId) return
    const token = await getToken()
    if (token) {
      const res = await apiFetch(`/api/media/${renameAssetId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: newFileName })
      })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['media'] })
        showToast('success', 'Asset renamed')
      } else {
        showToast('error', 'Failed to rename asset')
      }
      setNewFileName('')
      setRenameAssetId(null)
      setIsRenameModalOpen(false)
    }
  }

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingTargets({ type: 'asset', ids: [id] })
    setShowDeleteConfirm(true)
  }

  const confirmDeleteFolder = async () => {
    if (!deletingTargets) return
    const token = await getToken()
    if (token) {
      await removeFolder(token, deletingTargets.ids[0])
      queryClient.invalidateQueries({ queryKey: ['media'] })
      showToast('success', 'Folder deleted')
    }
    setShowDeleteConfirm(false)
    setDeletingTargets(null)
  }

  const handleRenameFolder = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation()
    setEditingFolderId(folder.id)
    setNewFolderName(folder.name)
    setIsFolderModalOpen(true)
  }

  const handleDeleteAsset = async (id: string) => {
    setDeletingTargets({ type: 'asset', ids: [id] })
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAsset = async () => {
    if (!deletingTargets) return
    const token = await getToken()
    if (token) {
      for (const id of deletingTargets.ids) {
        await removeMedia(token, id)
      }
      queryClient.invalidateQueries({ queryKey: ['media'] })
      setSelectedIds(new Set())
      setSelectMode(false)
      showToast('success', `${deletingTargets.ids.length} asset${deletingTargets.ids.length > 1 ? 's' : ''} deleted`)
    }
    setShowDeleteConfirm(false)
    setDeletingTargets(null)
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    showToast('success', 'URL copied to clipboard')
  }

  const onAssetDragStart = (e: React.DragEvent, id: string) => {
    if (selectMode) return
    setDraggedAssetId(id)
    e.dataTransfer.setData('assetId', id)
  }

  const onFolderDrop = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const assetId = e.dataTransfer.getData('assetId') || draggedAssetId
    if (assetId && assetId !== folderId) {
      const token = await getToken()
      if (token) {
        await moveAsset(token, assetId, folderId)
        queryClient.invalidateQueries({ queryKey: ['media'] })
        showToast('success', 'Asset moved')
      }
    }
    setDraggedAssetId(null)
  }

  const navigateToFolder = (id: string | null) => {
    setCurrentFolder(id)
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const allIds = [...folders.map((f: any) => f.id), ...media.map((m: any) => m.id)]
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allIds))
    }
  }

  const currentFolderName = useMemo(() => {
    if (!currentFolderId) return 'Root'
    return folders.find((f: any) => f.id === currentFolderId)?.name || 'Folder'
  }, [currentFolderId, folders])

  return (
    <div
      className="space-y-6 pb-10 relative min-h-[80vh]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => { setActiveMenuId(null); if (!selectMode) setPreviewAsset(null) }}
    >
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-right",
          toast.type === 'success' ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
        )}>
          {toast.type === 'success' ? <Check className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <p className="text-sm text-white">{toast.message}</p>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {deletingTargets?.type === 'assets' ? `Delete ${deletingTargets.ids.length} items?` : 'Delete item?'}
                </h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white gap-2" onClick={deletingTargets?.type === 'assets' ? confirmDeleteAsset : confirmDeleteFolder}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setPreviewAsset(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewAsset(null)} className="absolute -top-10 right-0 text-muted-foreground hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            {previewAsset.fileType?.startsWith('image') ? (
              <img src={previewAsset.fileUrl} alt={previewAsset.fileName} className="w-full max-h-[80vh] object-contain rounded-xl" />
            ) : previewAsset.fileType?.startsWith('video') ? (
              <video src={previewAsset.fileUrl} controls className="w-full max-h-[80vh] rounded-xl" />
            ) : null}
            <div className="flex items-center justify-between mt-4 px-2">
              <div>
                <p className="text-white font-medium">{previewAsset.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {previewAsset.fileType} &middot; {formatSize(previewAsset.fileSize || 0)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleDownload(previewAsset.fileUrl, previewAsset.fileName)}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(previewAsset.fileUrl)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Overlay */}
      {isDragging && !draggedAssetId && (
        <div className="absolute inset-0 z-50 bg-purple-500/10 backdrop-blur-sm border-2 border-dashed border-purple-500 rounded-2xl flex flex-col items-center justify-center pointer-events-none transition-all">
          <div className="bg-navy-900 p-6 rounded-full shadow-2xl mb-4">
            <Upload className="w-12 h-12 text-purple-400 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Drop files to upload</h2>
          <p className="text-purple-200 mt-2 font-medium">Files will be saved to {currentFolderId ? currentFolderName : 'the root library'}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {currentFolderId && (
              <button onClick={() => navigateToFolder(null)} className="text-muted-foreground hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {currentFolderId ? currentFolderName : 'Media Library'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {currentFolderId ? `Viewing contents of ${currentFolderName}` : 'Manage all your visual assets in one place.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*,video/*"
            multiple
          />
          <Button variant="outline" className="gap-2" onClick={(e) => { e.stopPropagation(); setEditingFolderId(null); setNewFolderName(''); setIsFolderModalOpen(true); }}>
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>
          <Button
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload Assets'}
          </Button>
        </div>
      </div>

      {/* Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">{editingFolderId ? 'Rename Folder' : 'Create New Folder'}</h3>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">Folder Name</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Summer Campaign"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => { setIsFolderModalOpen(false); setEditingFolderId(null); }}>Cancel</Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>{editingFolderId ? 'Rename' : 'Create Folder'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Rename Modal */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Rename Asset</h3>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">New Name</label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.png"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRenameAsset()}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => { setIsRenameModalOpen(false); setRenameAssetId(null); }}>Cancel</Button>
              <Button onClick={handleRenameAsset} disabled={!newFileName.trim()}>Rename</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            className="pl-10 bg-transparent border-none focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
        >
          {sortOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Type filter */}
        <div className="flex items-center gap-1 border-l border-white/10 pl-4">
          {typeFilters.map(f => (
            <Button
              key={f.value}
              variant="ghost"
              size="sm"
              className={cn("text-xs h-8", typeFilter === f.value ? "text-white bg-white/10" : "text-muted-foreground")}
              onClick={() => setTypeFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <Button
            variant="ghost"
            size="icon"
            className={mediaViewMode === 'grid' ? "text-white bg-white/10" : "text-muted-foreground"}
            onClick={() => setMediaViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={mediaViewMode === 'list' ? "text-white bg-white/10" : "text-muted-foreground"}
            onClick={() => setMediaViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Selection Toolbar */}
      {selectMode && (
        <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs">
              {selectedIds.size === (folders.length + media.length) ? 'Deselect all' : 'Select all'}
            </Button>
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }} className="text-xs">
              Cancel
            </Button>
            {selectedIds.size > 0 && (
              <Button size="sm" className="text-xs gap-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => {
                const assetIds = Array.from(selectedIds).filter(id => !folders.find((f: any) => f.id === id))
                if (assetIds.length > 0) {
                  setDeletingTargets({ type: 'assets', ids: assetIds })
                  setShowDeleteConfirm(true)
                }
              }}>
                <Trash2 className="w-3 h-3" /> Delete selected
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (media.length === 0 && folders.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/5 rounded-2xl border border-dashed border-white/10">
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-white font-medium">{searchQuery ? 'No matching items found' : 'This folder is empty'}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery ? 'Try a different search term or filter.' : 'Upload assets or create folders to organize your media.'}
          </p>
        </div>
      ) : mediaViewMode === 'grid' ? (
        <div className={cn(
          "grid gap-4",
          selectMode ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        )}>
          {/* Folders */}
          {folders.map((folder: any) => (
            <Card
              key={folder.id}
              className={cn(
                "group cursor-pointer bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all border-white/10 flex flex-col items-center justify-center aspect-square p-4 relative",
                selectMode && selectedIds.has(folder.id) && "ring-2 ring-purple-500"
              )}
              onClick={(e) => {
                e.stopPropagation()
                if (selectMode) { toggleSelect(folder.id); return }
                navigateToFolder(folder.id)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onFolderDrop(e, folder.id)}
            >
              {selectMode && (
                <div className={cn(
                  "absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  selectedIds.has(folder.id) ? "bg-purple-500 border-purple-500" : "border-white/30"
                )}>
                  {selectedIds.has(folder.id) && <Check className="w-3 h-3 text-white" />}
                </div>
              )}
              <Folder className="w-16 h-16 text-purple-400 mb-2 opacity-80 group-hover:scale-110 transition-transform" fill="currentColor" fillOpacity={0.1} />
              <p className="text-xs font-bold text-white text-center truncate w-full px-2">{folder.name}</p>
              {!selectMode && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                  <button onClick={(e) => handleRenameFolder(e, folder)} className="p-1.5 rounded bg-black/40 hover:bg-white/10 text-white">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => handleDeleteFolder(e, folder.id)} className="p-1.5 rounded bg-black/40 hover:bg-red-500/20 text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </Card>
          ))}

          {/* Assets */}
          {media.map((item: any) => (
            <Card
              key={item.id}
              draggable={!selectMode}
              onDragStart={(e) => onAssetDragStart(e, item.id)}
              onClick={(e) => {
                e.stopPropagation()
                if (selectMode) { toggleSelect(item.id); return }
                setPreviewAsset(item)
              }}
              className={cn(
                "group relative overflow-hidden bg-white/5 hover:border-white/20 transition-all border-white/10",
                !selectMode && "cursor-pointer",
                selectMode && selectedIds.has(item.id) && "ring-2 ring-purple-500"
              )}
            >
              {selectMode && (
                <div className={cn(
                  "absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  selectedIds.has(item.id) ? "bg-purple-500 border-purple-500" : "border-white/30"
                )}>
                  {selectedIds.has(item.id) && <Check className="w-3 h-3 text-white" />}
                </div>
              )}
              <div className="aspect-square relative overflow-hidden bg-navy-800 flex items-center justify-center">
                {item.fileType?.startsWith('image') ? (
                  <img src={item.fileUrl} alt={item.fileName} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                ) : item.fileType?.startsWith('video') ? (
                  <video
                    src={item.fileUrl}
                    className="w-full h-full object-cover"
                    muted
                    onMouseOver={(e) => e.currentTarget.play()}
                    onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  />
                ) : (
                  <FileText className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-white truncate" title={item.fileName}>{item.fileName}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    {formatSize(item.fileSize || 0)}
                  </span>
                  {!selectMode && (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-white"
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                      {activeMenuId === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1820] border border-white/10 rounded-lg shadow-xl py-1 z-[120]" onClick={(e) => e.stopPropagation()}>
                          <button className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { setRenameAssetId(item.id); setNewFileName(item.fileName); setIsRenameModalOpen(true); setActiveMenuId(null); }}>
                            <Edit2 className="w-3.5 h-3.5" /> Rename
                          </button>
                          <button className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { handleDownload(item.fileUrl, item.fileName); setActiveMenuId(null); }}>
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                          <button className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { handleCopyUrl(item.fileUrl); setActiveMenuId(null); }}>
                            <Copy className="w-3.5 h-3.5" /> Copy URL
                          </button>
                          <div className="h-[1px] bg-white/10 my-1" />
                          <div className="px-4 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Move to Folder</div>
                          {folders.length === 0 && <div className="px-4 py-2 text-[10px] text-muted-foreground italic">No folders</div>}
                          {folders.map((f: any) => (
                            <button key={f.id} className="w-full text-left px-4 py-2 text-xs text-purple-400 hover:bg-purple-500/10 flex items-center gap-2"
                              onClick={async () => {
                                const token = await getToken()
                                if (token) { await moveAsset(token, item.id, f.id); queryClient.invalidateQueries({ queryKey: ['media'] }) }
                                setActiveMenuId(null)
                              }}>
                              <Folder className="w-3.5 h-3.5" /> {f.name}
                            </button>
                          ))}
                          {currentFolderId && (
                            <button className="w-full text-left px-4 py-2 text-xs text-purple-400 hover:bg-purple-500/10 flex items-center gap-2"
                              onClick={async () => {
                                const token = await getToken()
                                if (token) { await moveAsset(token, item.id, null); queryClient.invalidateQueries({ queryKey: ['media'] }) }
                                setActiveMenuId(null)
                              }}>
                              <Move className="w-3.5 h-3.5" /> Move to Root
                            </button>
                          )}
                          <div className="h-[1px] bg-white/10 my-1" />
                          <button className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            onClick={() => { handleDeleteAsset(item.id); setActiveMenuId(null); }}>
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {item.fileType?.startsWith('video') && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500/80 text-[8px] font-bold text-white uppercase tracking-wider">
                  Video
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {selectMode && (
                  <th className="p-4 w-10">
                    <button onClick={toggleSelectAll} className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center",
                      selectedIds.size === (folders.length + media.length) ? "bg-purple-500 border-purple-500" : "border-white/30"
                    )}>
                      {selectedIds.size === (folders.length + media.length) && <Check className="w-3 h-3 text-white" />}
                    </button>
                  </th>
                )}
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Size</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {folders.map((folder: any) => (
                <tr key={folder.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => { if (selectMode) toggleSelect(folder.id); else navigateToFolder(folder.id) }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onFolderDrop(e, folder.id)}
                >
                  {selectMode && (
                    <td className="p-4" onClick={(e) => { e.stopPropagation(); toggleSelect(folder.id) }}>
                      <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center", selectedIds.has(folder.id) ? "bg-purple-500 border-purple-500" : "border-white/30")}>
                        {selectedIds.has(folder.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-navy-800 flex items-center justify-center">
                        <Folder className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-sm text-white font-medium">{folder.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">Folder</td>
                  <td className="p-4 text-sm text-muted-foreground">--</td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(folder.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => handleRenameFolder(e, folder)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => handleDeleteFolder(e, folder.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {media.map((item: any) => (
                <tr key={item.id}
                  draggable={!selectMode}
                  onDragStart={(e) => onAssetDragStart(e, item.id)}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => { if (selectMode) toggleSelect(item.id); else setPreviewAsset(item) }}
                >
                  {selectMode && (
                    <td className="p-4" onClick={(e) => { e.stopPropagation(); toggleSelect(item.id) }}>
                      <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center", selectedIds.has(item.id) ? "bg-purple-500 border-purple-500" : "border-white/30")}>
                        {selectedIds.has(item.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-navy-800 overflow-hidden flex items-center justify-center">
                        {item.fileType?.startsWith('image') ? (
                          <img src={item.fileUrl} alt={item.fileName} className="w-full h-full object-cover" loading="lazy" />
                        ) : <Video className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <span className="text-sm text-white font-medium truncate max-w-[200px]">{item.fileName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{item.fileType}</td>
                  <td className="p-4 text-sm text-muted-foreground">{formatSize(item.fileSize || 0)}</td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 relative">
                      <Button variant="ghost" size="icon" className="text-white"
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {activeMenuId === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1820] border border-white/10 rounded-lg shadow-xl py-1 z-[120]" onClick={(e) => e.stopPropagation()}>
                          <button className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { setRenameAssetId(item.id); setNewFileName(item.fileName); setIsRenameModalOpen(true); setActiveMenuId(null); }}>
                            <Edit2 className="w-3.5 h-3.5" /> Rename
                          </button>
                          <button className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { handleDownload(item.fileUrl, item.fileName); setActiveMenuId(null); }}>
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                          <button className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { handleCopyUrl(item.fileUrl); setActiveMenuId(null); }}>
                            <Copy className="w-3.5 h-3.5" /> Copy URL
                          </button>
                          <div className="h-[1px] bg-white/10 my-1" />
                          <button className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            onClick={() => { handleDeleteAsset(item.id); setActiveMenuId(null); }}>
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Select Mode Toggle */}
      {!selectMode && (media.length > 0 || folders.length > 0) && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setSelectMode(true)}>
            Select items
          </Button>
        </div>
      )}

      {/* Storage Usage */}
      {!currentFolderId && (
        <div className="mt-8 p-4 glass-card rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-white uppercase tracking-widest">Storage Usage</p>
            <p className="text-xs text-muted-foreground">
              {media.length > 0
                ? `${(media.reduce((acc: number, curr: any) => acc + (curr.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} MB`
                : '0 MB'} / 500 MB
            </p>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full shadow-glow transition-all"
              style={{ width: `${Math.min((media.reduce((acc: number, curr: any) => acc + (curr.fileSize || 0), 0) / 1024 / 1024 / 5), 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic text-center">
            Powered by Backblaze B2
          </p>
        </div>
      )}
    </div>
  )
}
