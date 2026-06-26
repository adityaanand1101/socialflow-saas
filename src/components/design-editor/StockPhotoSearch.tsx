import { useState, useCallback, useRef } from 'react'
import { Search, Loader2, Image as ImageIcon, Camera, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

type ImageProvider = 'pixabay' | 'unsplash' | 'pexels'

interface ImageHit {
  id: string
  url: string
  thumb: string
  alt: string
  provider: ImageProvider
  author: string
}

const PROVIDER_CONFIG: Record<ImageProvider, { label: string; icon: typeof Camera; color: string; key: string }> = {
  pixabay: {
    label: 'Pixabay',
    icon: Camera,
    color: '#2ec66b',
    key: 'VITE_PIXABAY_API_KEY',
  },
  unsplash: {
    label: 'Unsplash',
    icon: Camera,
    color: '#000000',
    key: 'VITE_UNSPLASH_ACCESS_KEY',
  },
  pexels: {
    label: 'Pexels',
    icon: Camera,
    color: '#05a081',
    key: 'VITE_PEXELS_API_KEY',
  },
}

interface StockPhotoSearchProps {
  onSelect: (imageUrl: string) => void
}

export function StockPhotoSearch({ onSelect }: StockPhotoSearchProps) {
  const [provider, setProvider] = useState<ImageProvider>('pixabay')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ImageHit[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalHits, setTotalHits] = useState(0)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const searchPixabay = useCallback(async (q: string, p: number): Promise<{ hits: ImageHit[]; total: number }> => {
    const key = import.meta.env.VITE_PIXABAY_API_KEY || ''
    if (!key) throw new Error('Pixabay API key not configured')
    const res = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(q)}&image_type=photo&per_page=24&page=${p}&safesearch=true`
    )
    if (!res.ok) throw new Error('Pixabay search failed')
    const data = await res.json()
    return {
      hits: (data.hits || []).map((h: any) => ({
        id: `pixabay-${h.id}`,
        url: h.largeImageURL,
        thumb: h.webformatURL,
        alt: h.tags,
        provider: 'pixabay' as ImageProvider,
        author: h.user,
      })),
      total: data.totalHits || 0,
    }
  }, [])

  const searchUnsplash = useCallback(async (q: string, p: number): Promise<{ hits: ImageHit[]; total: number }> => {
    const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || ''
    if (!key) throw new Error('Unsplash API key not configured')
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=24&page=${p}`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )
    if (!res.ok) throw new Error('Unsplash search failed')
    const data = await res.json()
    return {
      hits: (data.results || []).map((h: any) => ({
        id: `unsplash-${h.id}`,
        url: h.urls.regular,
        thumb: h.urls.thumb,
        alt: h.alt_description || '',
        provider: 'unsplash' as ImageProvider,
        author: h.user.name,
      })),
      total: data.total || 0,
    }
  }, [])

  const searchPexels = useCallback(async (q: string, p: number): Promise<{ hits: ImageHit[]; total: number }> => {
    const key = import.meta.env.VITE_PEXELS_API_KEY || ''
    if (!key) throw new Error('Pexels API key not configured')
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=24&page=${p}`,
      { headers: { Authorization: key } }
    )
    if (!res.ok) throw new Error('Pexels search failed')
    const data = await res.json()
    return {
      hits: (data.photos || []).map((h: any) => ({
        id: `pexels-${h.id}`,
        url: h.src.original,
        thumb: h.src.medium,
        alt: h.alt || '',
        provider: 'pexels' as ImageProvider,
        author: h.photographer,
      })),
      total: data.total_results || 0,
    }
  }, [])

  const searchAll = useCallback(async (q: string, p: number) => {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    setHasSearched(true)
    try {
      const sources: Record<ImageProvider, (q: string, p: number) => Promise<{ hits: ImageHit[]; total: number }>> = {
        pixabay: searchPixabay,
        unsplash: searchUnsplash,
        pexels: searchPexels,
      }
      const searchFn = sources[provider]
      const { hits, total } = await searchFn(q, p)
      if (p === 1) setResults(hits)
      else setResults(prev => [...prev, ...hits])
      setTotalHits(total)
      setPage(p)
    } catch (err: any) {
      setError(err.message || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [provider, searchPixabay, searchUnsplash, searchPexels])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchAll(query, 1)
  }

  const availableProviders = Object.entries(PROVIDER_CONFIG).filter(([key]) => {
    const envKey = `VITE_${key.toUpperCase()}_API_KEY`
    if (key === 'pixabay') return true
    if (key === 'unsplash') return true
    if (key === 'pexels') return true
    return false
  })

  return (
    <div className="flex flex-col h-full">
      {/* Provider tabs */}
      <div className="flex gap-1 mb-3">
        {(Object.entries(PROVIDER_CONFIG) as [ImageProvider, typeof PROVIDER_CONFIG[ImageProvider]][]).map(([key, cfg]) => {
          const envVal = import.meta.env[cfg.key as keyof ImportMeta]
          const isAvailable = !!envVal
          return (
            <button
              key={key}
              onClick={() => { setProvider(key); setResults([]); setHasSearched(false) }}
              disabled={!isAvailable}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors",
                provider === key && isAvailable
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  : isAvailable
                    ? "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 border border-transparent"
                    : "bg-white/5 text-muted-foreground/40 border border-dashed border-white/5 cursor-not-allowed"
              )}
              title={!isAvailable ? `Set ${cfg.key} in .env` : cfg.label}
            >
              <cfg.icon className="w-3 h-3" />
              {cfg.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSearch} className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search ${PROVIDER_CONFIG[provider].label}...`}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 transition-colors text-sm"
        />
      </form>

      {!hasSearched && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Search className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            Search millions of free stock photos from multiple providers
          </p>
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            {Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => {
              const val = import.meta.env[cfg.key as keyof ImportMeta]
              return (
                <div key={key} className="flex items-center gap-1.5" title={!val ? `${cfg.key} not set` : ''}>
                  <div className={cn("w-2 h-2 rounded-full", val ? 'bg-green-500' : 'bg-yellow-500')} />
                  {cfg.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-3">
          {error}
          <p className="text-xs text-red-300/60 mt-1">
            Check your API keys in .env file
          </p>
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
            <div className="grid grid-cols-2 gap-2">
              {results.map(hit => (
                <button
                  key={hit.id}
                  onClick={() => onSelect(hit.url)}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all"
                >
                  <img
                    src={hit.thumb}
                    alt={hit.alt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
                      <span className="text-[10px] text-white/80 truncate">{hit.author}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white">{hit.provider}</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-white font-medium px-3 py-1.5 rounded-lg bg-purple-600/90 opacity-0 group-hover:opacity-100 transition-opacity">
                        Add to Design
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {results.length < totalHits && (
            <div className="pt-3 text-center">
              <button
                onClick={() => searchAll(query, page + 1)}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Load More
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Images provided by {PROVIDER_CONFIG[provider].label}
          </p>
        </>
      )}

      {!loading && !error && hasSearched && results.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No results found</p>
        </div>
      )}
    </div>
  )
}
