import { Image as ImageIcon, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MediaSectionProps {
  show: boolean
  onClose: () => void
  libraryMedia: any[]
  mediaFiles: string[]
  toggleLibraryMedia: (url: string, fileType?: string) => void
  isUploadingMedia: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: React.DragEvent) => void
  isDragging: boolean
  setIsDragging: (v: boolean) => void
}

export default function MediaSection({
  show,
  onClose,
  libraryMedia,
  mediaFiles,
  toggleLibraryMedia,
  onDrop,
  isDragging,
  setIsDragging,
}: MediaSectionProps) {
  if (!show) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden relative">
        {isDragging && (
          <div className="absolute inset-0 z-[120] bg-purple-500/20 backdrop-blur-md border-4 border-dashed border-purple-500 rounded-2xl flex flex-col items-center justify-center pointer-events-none">
            <Upload className="w-12 h-12 text-white animate-bounce mb-4" />
            <h3 className="text-2xl font-bold text-white">Drop to Upload & Attach</h3>
          </div>
        )}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h3 className="font-bold text-white">Media Library</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {libraryMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
              <p>Your library is empty. Drag a file here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {libraryMedia.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => toggleLibraryMedia(item.fileUrl, item.fileType)}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                    mediaFiles.includes(item.fileUrl) ? "border-purple-500 ring-2 ring-purple-500/20" : "border-transparent hover:border-white/20"
                  )}
                >
                  <img src={item.fileUrl} alt="" className="w-full h-full object-cover" />
                  {mediaFiles.includes(item.fileUrl) && (
                    <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                      <div className="bg-purple-500 rounded-full p-1">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}
