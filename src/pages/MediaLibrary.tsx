import { useRef, useState, useMemo } from 'react'
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
  Image as ImageIcon
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@clerk/react'

export const MediaLibrary = () => {
  const { media, uploadMedia, removeMedia, loading } = useStore()
  const { getToken } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const token = await getToken()
      if (!token) return

      // Upload files sequentially or in parallel? Parallel for now.
      await Promise.all(Array.from(files).map(file => uploadMedia(token, file)))
      
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
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

  const filteredMedia = useMemo(() => {
    if (!searchQuery) return media
    const query = searchQuery.toLowerCase()
    return media.filter(item => 
      (item.fileName || '').toLowerCase().includes(query) || 
      (item.name || '').toLowerCase().includes(query)
    )
  }, [media, searchQuery])

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">Manage all your visual assets in one place.</p>
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
          <Button variant="outline" className="gap-2" onClick={() => alert('Folder organization coming soon!')}>
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

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search files..." 
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

      {loading && media.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/5 rounded-2xl border border-dashed border-white/10">
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-white font-medium">{searchQuery ? 'No matching files found' : 'Your library is empty'}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery ? 'Try a different search term.' : 'Upload your first image or video to get started.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden bg-white/5 hover:border-white/20 transition-all border-white/10">
              <div className="aspect-square relative overflow-hidden bg-navy-800 flex items-center justify-center">
                {item.fileType?.startsWith('image') ? (
                  <img src={item.fileUrl} alt={item.fileName} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : item.fileType?.startsWith('video') ? (
                  <div className="flex flex-col items-center gap-2">
                    <Video className="w-8 h-8 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Video</span>
                  </div>
                ) : (
                  <FileText className="w-8 h-8 text-muted-foreground" />
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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

                {item.fileType?.startsWith('video') && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                    Video
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-white truncate" title={item.fileName}>{item.fileName}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    {item.fileSize ? (item.fileSize / 1024 / 1024).toFixed(1) + ' MB' : '0 MB'}
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
                  <td className="p-4 text-sm text-muted-foreground">{(item.fileSize / 1024 / 1024).toFixed(1)} MB</td>
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


