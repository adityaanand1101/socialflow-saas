import { useRef, useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Image as ImageIcon
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@clerk/react'

export const MediaLibrary = () => {
  const { media, folders, currentFolderId, uploadMedia, removeMedia, createFolder, fetchData, loading } = useStore()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (isLoaded && isSignedIn) {
        const token = await getToken()
        if (token) fetchData(token, currentFolderId)
      }
    }
    init()
  }, [isLoaded, isSignedIn, currentFolderId])

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const token = await getToken()
      if (!token) return

      await Promise.all(Array.from(files).map(file => uploadMedia(token, file, currentFolderId)))
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
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    const token = await getToken()
    if (token) {
      await createFolder(token, newFolderName, currentFolderId)
      setNewFolderName('')
      setIsFolderModalOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    try {
      const token = await getToken()
      if (token) await removeMedia(token, id)
    } catch (error) {
       console.error('Failed to delete', error)
    }
  }

  const navigateToFolder = (id: string | null) => {
    useStore.getState().setCurrentFolder(id)
  }

  const currentFolderName = useMemo(() => {
    if (!currentFolderId) return 'Root'
    return folders.find(f => f.id === currentFolderId)?.name || 'Folder'
  }, [currentFolderId, folders])

  const filteredMedia = useMemo(() => {
    if (!searchQuery) return media
    const query = searchQuery.toLowerCase()
    return media.filter(item => 
      (item.fileName || '').toLowerCase().includes(query) || 
      (item.name || '').toLowerCase().includes(query)
    )
  }, [media, searchQuery])

  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders
    const query = searchQuery.toLowerCase()
    return folders.filter(f => f.name.toLowerCase().includes(query))
  }, [folders, searchQuery])

  return (
    <div 
      className="space-y-6 pb-10 relative min-h-[80vh]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
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
          <Button variant="outline" className="gap-2" onClick={() => setIsFolderModalOpen(true)}>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Create New Folder</h3>
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
              <Button variant="ghost" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create Folder</Button>
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
            className={viewMode === 'grid' ? "text-white bg-white/10" : "text-muted-foreground"}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={viewMode === 'list' ? "text-white bg-white/10" : "text-muted-foreground"}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground"><Filter className="w-4 h-4" /></Button>
        </div>
      </div>

      {loading && media.length === 0 && folders.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (filteredMedia.length === 0 && filteredFolders.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/5 rounded-2xl border border-dashed border-white/10">
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-white font-medium">{searchQuery ? 'No matching items found' : 'This folder is empty'}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery ? 'Try a different search term.' : 'Upload assets or create folders to organize your media.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {/* Render Folders First */}
          {filteredFolders.map((folder) => (
            <Card 
              key={folder.id} 
              className="group cursor-pointer bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all border-white/10 flex flex-col items-center justify-center aspect-square p-4"
              onClick={() => navigateToFolder(folder.id)}
            >
              <Folder className="w-16 h-16 text-purple-400 mb-2 opacity-80 group-hover:scale-110 transition-transform" fill="currentColor" fillOpacity={0.1} />
              <p className="text-xs font-bold text-white text-center truncate w-full">{folder.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Folder</p>
            </Card>
          ))}

          {/* Render Assets */}
          {filteredMedia.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden bg-white/5 hover:border-white/20 transition-all border-white/10">
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
                  <div className="pointer-events-auto flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/20"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white"><MoreVertical className="w-4 h-4" /></Button>
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
              {filteredFolders.map((folder) => (
                 <tr key={folder.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigateToFolder(folder.id)}>
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
                     <Button variant="ghost" size="icon" className="text-muted-foreground"><MoreVertical className="w-4 h-4" /></Button>
                   </td>
                 </tr>
              ))}

              {filteredMedia.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
            {media.length > 0 ? `${(media.reduce((acc, curr) => acc + (curr.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} MB` : '0 MB'} / 500 MB
          </p>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-primary rounded-full shadow-glow transition-all" 
            style={{ width: `${Math.min((media.reduce((acc, curr) => acc + (curr.fileSize || 0), 0) / 1024 / 1024 / 5), 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic text-center">
          Powered by Backblaze B2
        </p>
      </div>
    </div>
  )
}


