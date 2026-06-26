import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react'
import { Upload, Image, Search, X } from 'lucide-react'
import { StockPhotoSearch } from './StockPhotoSearch'

interface ImportScreenProps {
  onImageLoaded: (src: string) => void
}

export function ImportScreen({ onImageLoaded }: ImportScreenProps) {
  const [dragOver, setDragOver] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [recentImages, setRecentImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addImage = useCallback((url: string) => {
    setRecentImages(prev => [url, ...prev].slice(0, 8))
    onImageLoaded(url)
  }, [onImageLoaded])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      addImage(URL.createObjectURL(file))
    }
  }, [addImage])

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    addImage(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleSearchSelect = (imageUrl: string) => {
    addImage(imageUrl)
  }

  return (
    <div
      className="h-full bg-[#0f1117] relative"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {showSearch ? (
        <div className="absolute inset-0 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Search Stock Images</h2>
            <button
              onClick={() => setShowSearch(false)}
              className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <StockPhotoSearch onSelect={handleSearchSelect} />
          </div>
        </div>
      ) : recentImages.length > 0 ? (
        <div className="h-full flex items-center justify-center p-8">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Start Designing</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-colors text-sm"
                >
                  <Search className="w-4 h-4" />
                  Search Stock Images
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {recentImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => onImageLoaded(src)}
                  className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all hover:scale-[1.02] group"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[4/3] rounded-xl border-2 border-dashed border-white/15 hover:border-purple-500/50 flex items-center justify-center transition-colors group"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-muted-foreground group-hover:text-purple-400 mx-auto mb-2" />
                  <span className="text-xs text-muted-foreground group-hover:text-purple-300">Upload</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="h-full flex items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {dragOver ? (
            <div className="flex flex-col items-center gap-4 text-purple-400 scale-110 transition-transform">
              <Upload className="w-16 h-16" />
              <p className="text-xl font-semibold">Drop to import</p>
            </div>
          ) : (
            <div className="text-center max-w-lg">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 flex items-center justify-center">
                <Image className="w-12 h-12 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Create Something Beautiful</h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Drag & drop an image, click to browse, or search millions of free stock photos
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Browse Files
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSearch(true) }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search Free Photos
                </button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                <span>Free to use</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span>No attribution required</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span>High resolution</span>
              </div>
            </div>
          )}
        </div>
      )}

      {dragOver && (
        <div className="absolute inset-0 bg-purple-900/20 border-2 border-dashed border-purple-500/50 rounded-2xl pointer-events-none z-50" />
      )}
    </div>
  )
}
