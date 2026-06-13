import { useRef, useState } from 'react'
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
  Trash2
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@clerk/react'

export const MediaLibrary = () => {
  const { media, uploadMedia, removeMedia, loading } = useStore()
  const { getToken } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const token = await getToken()
      if (token) await uploadMedia(token, file)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken()
      if (token) await removeMedia(token, id)
    } catch (error) {
       console.error('Failed to delete', error)
    }
  }

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
          />
          <Button variant="outline" className="gap-2">
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>
          <Button 
            className="gap-2" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Asset
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-10 bg-transparent border-none" />
        </div>
        <div className="flex items-center gap-2 border-l border-white/10 pl-4 w-full md:w-auto">
          <Button variant="ghost" size="icon" className="text-white bg-white/10"><Grid className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground"><List className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground"><Filter className="w-4 h-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {media.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden bg-white/5 hover:border-white/20 transition-all">
              <div className="aspect-square relative overflow-hidden bg-navy-800 flex items-center justify-center">
                {item.fileType?.startsWith('image') || item.type === 'image' ? (
                  <img src={item.fileUrl || item.url} alt={item.fileName || item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : item.fileType?.startsWith('video') || item.type === 'video' ? (
                  <Video className="w-8 h-8 text-muted-foreground" />
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

                {(item.fileType?.startsWith('video') || item.type === 'video') && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                    0:45
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-white truncate">{item.fileName || item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.fileSize || item.size}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt || item.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Storage Usage indicator */}
      <div className="mt-8 p-4 glass-card rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-white uppercase tracking-widest">Storage Usage</p>
          <p className="text-xs text-muted-foreground">
            {media.length > 0 ? `${(media.length * 1.5).toFixed(1)} MB` : '0 MB'} / 500 MB
          </p>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-primary rounded-full shadow-glow transition-all" 
            style={{ width: `${Math.min((media.length * 0.3), 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic text-center">
          Powered by Cloud Storage
        </p>
      </div>
    </div>
  )
}

