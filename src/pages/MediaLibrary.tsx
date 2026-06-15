import { useRef, useState, useMemo } from 'react'
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
  Filter,
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
  Image as ImageIcon
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@clerk/react'

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
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  
  // Asset Rename Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [renameAssetId, setRenameAssetId] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState('')

  // --- React Query for Data Fetching ---
  const { data, isLoading } = useQuery({
    queryKey: ['media', currentFolderId, searchQuery],
    queryFn: async () => {
      const token = await getToken()
      const url = `/api/media?${currentFolderId ? `folderId=${currentFolderId}` : 'folderId=root'}${searchQuery ? `&search=${searchQuery}` : ''}`
      const res = await apiFetch(url, { headers: { Authorization: `Bearer ${token}` } })
      return res.json()
    },
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
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
    } catch (error) {
      console.error('Upload failed:', error)
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

  const handleCreateFolder = async () => {
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
  }

  const handleRenameAsset = async () => {
    if (!newFileName.trim() || !renameAssetId) return
    const token = await getToken()
    if (token) {
      const res = await fetch(`/api/media/${renameAssetId}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName: newFileName })
      });
      if (res.ok) queryClient.invalidateQueries({ queryKey: ['media'] })
      
      setNewFileName('')
      setRenameAssetId(null)
      setIsRenameModalOpen(false)
    }
  }

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this folder? Assets will be moved to root.')) return
    const token = await getToken()
    if (token) {
      await removeFolder(token, id)
      queryClient.invalidateQueries({ queryKey: ['media'] })
    }
  }

  const handleRenameFolder = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation()
    setEditingFolderId(folder.id)
    setNewFolderName(folder.name)
    setIsFolderModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    try {
      const token = await getToken()
      if (token) {
        await removeMedia(token, id)
        queryClient.invalidateQueries({ queryKey: ['media'] })
      }
    } catch (error) {
       console.error('Failed to delete', error)
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Public URL copied to clipboard!');
  }

  const onAssetDragStart = (e: React.DragEvent, id: string) => {
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
      }
    }
    setDraggedAssetId(null)
  }

  const navigateToFolder = (id: string | null) => {
    setCurrentFolder(id)
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
      onClick={() => setActiveMenuId(null)}
    >
      {/* Drag & Drop Overlay for External Files */}
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
        <div className="flex items-center gap-2 border-l border-white/10 pl-4 w-full md:w-auto">
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
          <Button variant="ghost" size="icon" className="text-muted-foreground"><Filter className="w-4 h-4" /></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (media.length === 0 && folders.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/5 rounded-2xl border border-dashed border-white/10">
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-white font-medium">{searchQuery ? 'No matching items found' : 'This folder is empty'}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery ? 'Try a different search term.' : 'Upload assets or create folders to organize your media.'}
          </p>
        </div>
      ) : mediaViewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {/* Render Folders First */}
          {folders.map((folder: any) => (
            <Card 
              key={folder.id} 
              className="group cursor-pointer bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all border-white/10 flex flex-col items-center justify-center aspect-square p-4 relative"
              onClick={(e) => { e.stopPropagation(); navigateToFolder(folder.id); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onFolderDrop(e, folder.id)}
            >
              <Folder className="w-16 h-16 text-purple-400 mb-2 opacity-80 group-hover:scale-110 transition-transform" fill="currentColor" fillOpacity={0.1} />
              <p className="text-xs font-bold text-white text-center truncate w-full px-2">{folder.name}</p>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                <button onClick={(e) => handleRenameFolder(e, folder)} className="p-1.5 rounded bg-black/40 hover:bg-white/10 text-white">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={(e) => handleDeleteFolder(e, folder.id)} className="p-1.5 rounded bg-black/40 hover:bg-red-500/20 text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </Card>
          ))}

          {/* Render Assets */}
          {media.map((item: any) => (
            <Card 
              key={item.id} 
              draggable 
              onDragStart={(e) => onAssetDragStart(e, item.id)}
              className="group relative overflow-hidden bg-white/5 hover:border-white/20 transition-all border-white/10 cursor-grab active:cursor-grabbing"
            >
              <div className="aspect-square relative overflow-hidden bg-navy-800 flex items-center justify-center">
                {item.fileType?.startsWith('image') ? (
                  <img src={item.fileUrl} alt={item.fileName} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
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
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                  <div className="pointer-events-auto flex gap-2 relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/20"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-white hover:bg-white/10"
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {activeMenuId === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1820] border border-white/10 rounded-lg shadow-xl py-1 z-[120]" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { setRenameAssetId(item.id); setNewFileName(item.fileName); setIsRenameModalOpen(true); setActiveMenuId(null); }}
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Rename
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { handleDownload(item.fileUrl, item.fileName); setActiveMenuId(null); }}
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { handleCopyUrl(item.fileUrl); setActiveMenuId(null); }}
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy URL
                          </button>
                          <div className="h-[1px] bg-white/10 my-1" />
                          <div className="px-4 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Move to Folder</div>
                          {folders.length === 0 && <div className="px-4 py-2 text-[10px] text-muted-foreground italic">No folders found</div>}
                          {folders.map((f: any) => (
                             <button 
                               key={f.id}
                               className="w-full text-left px-4 py-2 text-xs text-purple-400 hover:bg-purple-500/10 flex items-center gap-2"
                               onClick={async () => { 
                                 const token = await getToken(); 
                                 if (token) {
                                   await moveAsset(token, item.id, f.id); 
                                   queryClient.invalidateQueries({ queryKey: ['media'] })
                                 }
                                 setActiveMenuId(null); 
                               }}
                             >
                               <Folder className="w-3.5 h-3.5" /> {f.name}
                             </button>
                          ))}
                          {currentFolderId && (
                            <button 
                              className="w-full text-left px-4 py-2 text-xs text-purple-400 hover:bg-purple-500/10 flex items-center gap-2"
                              onClick={async () => { 
                                const token = await getToken(); 
                                if (token) {
                                  await moveAsset(token, item.id, null); 
                                  queryClient.invalidateQueries({ queryKey: ['media'] })
                                }
                                setActiveMenuId(null); 
                              }}
                            >
                              <Move className="w-3.5 h-3.5" /> Move to Root
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {item.fileType?.startsWith('video') && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-purple-500/80 text-[8px] font-bold text-white uppercase tracking-wider">
                    Video
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-white truncate" title={item.fileName}>{item.fileName}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    {item.fileSize 
                      ? item.fileSize > 1024 * 1024 
                        ? (item.fileSize / 1024 / 1024).toFixed(1) + ' MB'
                        : item.fileSize > 1024
                          ? (item.fileSize / 1024).toFixed(0) + ' KB'
                          : item.fileSize + ' B'
                      : '0 B'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Size</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {/* Folders First */}
              {folders.map((folder: any) => (
                 <tr 
                   key={folder.id} 
                   className="hover:bg-white/5 transition-colors cursor-pointer" 
                   onClick={(e) => { e.stopPropagation(); navigateToFolder(folder.id); }}
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={(e) => onFolderDrop(e, folder.id)}
                 >
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
                <tr 
                  key={item.id} 
                  draggable 
                  onDragStart={(e) => onAssetDragStart(e, item.id)}
                  className="hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-navy-800 overflow-hidden flex items-center justify-center">
                        {item.fileType?.startsWith('image') ? (
                          <img src={item.fileUrl} alt={item.fileName} className="w-full h-full object-cover" />
                        ) : <Video className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <span className="text-sm text-white font-medium truncate max-w-[200px]">{item.fileName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{item.fileType}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {item.fileSize > 1024 * 1024 ? (item.fileSize / 1024 / 1024).toFixed(1) + ' MB' : (item.fileSize / 1024).toFixed(0) + ' KB'}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white"
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {activeMenuId === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1820] border border-white/10 rounded-lg shadow-xl py-1 z-[120]" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { setRenameAssetId(item.id); setNewFileName(item.fileName); setIsRenameModalOpen(true); setActiveMenuId(null); }}
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Rename
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { handleDownload(item.fileUrl, item.fileName); setActiveMenuId(null); }}
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => { handleCopyUrl(item.fileUrl); setActiveMenuId(null); }}
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy URL
                          </button>
                          <div className="h-[1px] bg-white/10 my-1" />
                          <button 
                            className="w-full text-left px-4 py-2 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2"
                            onClick={() => { handleDelete(item.id); setActiveMenuId(null); }}
                          >
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

      {/* Storage Usage indicator */}
      <div className="mt-8 p-4 glass-card rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-white uppercase tracking-widest">Storage Usage</p>
          <p className="text-xs text-muted-foreground">
            {data?.assets?.length > 0 ? `${(data.assets.reduce((acc: number, curr: any) => acc + (curr.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} MB` : '0 MB'} / 500 MB
          </p>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-primary rounded-full shadow-glow transition-all" 
            style={{ width: `${Math.min((data?.assets?.reduce((acc: number, curr: any) => acc + (curr.fileSize || 0), 0) / 1024 / 1024 / 5), 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic text-center">
          Powered by Backblaze B2
        </p>
      </div>
    </div>
  )
}
