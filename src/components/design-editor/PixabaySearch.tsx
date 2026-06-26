import { useState, useCallback } from 'react'
import { Search, Loader2, Image as ImageIcon } from 'lucide-react'

const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || ''

interface PixabayHit {
  id: number
  webformatURL: string
  largeImageURL: string
  previewURL: string
  tags: string
  user: string
  imageWidth: number
  imageHeight: number
}

interface PixabaySearchProps {
  onSelect: (imageUrl: string) => void
}

export function PixabaySearch({ onSelect }: PixabaySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PixabayHit[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalHits, setTotalHits] = useState(0)
  const [error, setError] = useState('')

  const searchImages = useCallback(async (q: string, p = 1) => {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    try {
      const key = PIXABAY_API_KEY
      if (!key) {
        setError('Pixabay API key not configured. Set VITE_PIXABAY_API_KEY in your .env file.')
        setLoading(false)
        return
      }
      const res = await fetch(
        `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(q)}&image_type=photo&per_page=24&page=${p}&safesearch=true`
      )
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      if (p === 1) {
        setResults(data.hits || [])
      } else {
        setResults(prev => [...prev, ...(data.hits || [])])
      }
      setTotalHits(data.totalHits || 0)
      setPage(p)
    } catch (err) {
      setError('Failed to search. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchImages(query, 1)
  }

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSearch} className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search millions of free images..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 transition-colors text-sm"
        />
      </form>

      {!PIXABAY_API_KEY && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">
            Set <code className="px-1.5 py-0.5 rounded bg-white/5 text-purple-300 text-xs">VITE_PIXABAY_API_KEY</code> in your .env to enable stock photo search
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-3 gap-3">
              {results.map(hit => (
                <button
                  key={hit.id}
                  onClick={() => onSelect(hit.largeImageURL)}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all"
                >
                  <img
                    src={hit.webformatURL}
                    alt={hit.tags}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600/80 transition-opacity">
                      Add to Design
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {results.length < totalHits && (
            <div className="pt-4 text-center">
              <button
                onClick={() => searchImages(query, page + 1)}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Load More
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            Photos provided by Pixabay · Free for commercial use · No attribution required
          </p>
        </>
      )}

      {!loading && !error && results.length === 0 && query && PIXABAY_API_KEY && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No results found for "{query}"</p>
        </div>
      )}
    </div>
  )
}
