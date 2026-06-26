import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Comprehensive list of designer fonts (Canva-style) grouped by category
const POPULAR_FONTS = [
  // Sans-serif
  'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Open Sans', 'Lato', 'Raleway',
  'Nunito', 'Nunito Sans', 'Work Sans', 'DM Sans', 'Plus Jakarta Sans',
  'Manrope', 'Figtree', 'Lexend', 'Outfit', 'Sora', 'Urbanist',
  'Public Sans', 'Jost', 'Josefin Sans', 'Quicksand', 'Rubik', 'Barlow',
  'Mukta', 'Hind', 'Karla', 'Source Sans 3', 'Titillium Web', 'Cabin',
  'Heebo', 'Catamaran', 'Abel', 'Maven Pro', 'Rajdhani', 'Kanit',
  'Prompt', 'Noto Sans', 'Oxygen', 'Fira Sans', 'IBM Plex Sans',
  'PT Sans', 'Exo 2', 'Assistant', 'Commissioner', 'Epilogue',
  // Display / Decorative
  'Playfair Display', 'Oswald', 'Bebas Neue', 'Anton', 'Lobster',
  'Pacifico', 'Dancing Script', 'Great Vibes', 'Cormorant Garamond',
  'Abril Fatface', 'Alfa Slab One', 'Cinzel', 'Prata', 'Unbounded',
  'Bodoni Moda', 'DM Serif Display', 'Teko', 'Bangers', 'Righteous',
  'Rowdies', 'Staatliches', 'Passion One', 'Archivo Black', 'Syne',
  'Secular One', 'Patua One', 'Luckiest Guy', 'Fredoka One', 'Carter One',
  'Fugaz One', 'Concert One', 'Bowlby One SC', 'Modak', 'Monoton',
  'Rampart One', 'Zen Tokyo Zoo', 'Train One', 'Stick', 'Yomogi',
  // Serif
  'Merriweather', 'Lora', 'Libre Baskerville', 'Crimson Text', 'EB Garamond',
  'PT Serif', 'Noto Serif', 'Source Serif 4', 'Literata', 'Spectral',
  'Fraunces', 'Bitter', 'Cardo', 'Alegreya', 'Taviraj',
  'Domine', 'Frank Ruhl Libre', 'Poltawski Nowy', 'Sono', 'Recursive',
  // Handwriting / Script
  'Caveat', 'Permanent Marker', 'Kalam', 'Patrick Hand', 'Shadows Into Light',
  'Gloria Hallelujah', 'Indie Flower', 'Amatic SC', 'Neucha', 'Rock Salt',
  'Satisfy', 'Cookie', 'Alex Brush', 'Parisienne', 'Tangerine',
  'Allura', 'Sacramento', 'Mr De Haviland', 'Rouge Script', 'Italianno',
  'Pinyon Script', 'Monsieur La Doulaise', 'Waterfall', 'WindSong', 'Licorice',
  // Monospace
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Space Mono', 'DM Mono',
  'IBM Plex Mono', 'Cascadia Code', 'Inconsolata', 'Roboto Mono', 'Ubuntu Mono',
]

interface FontPickerProps {
  value: string
  onChange: (font: string) => void
  compact?: boolean
}

export function FontPicker({ value, onChange, compact }: FontPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [fonts, setFonts] = useState<string[]>(POPULAR_FONTS)
  const [loading, setLoading] = useState(true)
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(['Inter']))
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadGoogleFonts = async () => {
      try {
        const key = import.meta.env.VITE_GOOGLE_FONTS_API_KEY
        if (key) {
          const res = await fetch(
            `https://www.googleapis.com/webfonts/v1/webfonts?key=${key}&sort=popularity`
          )
          if (res.ok) {
            const data = await res.json()
            const apiFonts = (data.items || []).map((f: any) => f.family)
            setFonts(apiFonts.slice(0, 500))
            setLoading(false)
            return
          }
        }
      } catch {}
      setLoading(false)
    }
    loadGoogleFonts()
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const loadFont = useCallback((family: string) => {
    if (loadedFonts.has(family)) return
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    setLoadedFonts(prev => new Set(prev).add(family))
  }, [loadedFonts])

  const filteredFonts = search
    ? fonts.filter(f => f.toLowerCase().includes(search.toLowerCase()))
    : fonts

  const handleSelect = (font: string) => {
    loadFont(font)
    onChange(font)
    setOpen(false)
  }

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 min-w-[120px] transition-colors"
          style={{ fontFamily: value }}
        >
          <span className="flex-1 truncate text-left">{value}</span>
          <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#1c1824] border border-white/10 rounded-xl shadow-2xl z-[200] overflow-hidden">
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && filteredFonts.map(font => (
                <button
                  key={font}
                  onClick={() => handleSelect(font)}
                  onMouseEnter={() => loadFont(font)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                    value === font
                      ? "bg-purple-600/20 text-purple-300"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                  style={{ fontFamily: font }}
                >
                  <span className="flex-1 truncate">{font}</span>
                  {value === font && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
              {!loading && filteredFonts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No fonts match "{search}"</p>
              )}
            </div>
            <div className="p-2 border-t border-white/10 text-[10px] text-muted-foreground text-center">
              {fonts.length} Google Fonts available
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs text-muted-foreground block mb-1.5">Font Family</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
        style={{ fontFamily: value }}
      >
        <span className="flex-1 truncate text-left">{value}</span>
        <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-[#1c1824] border border-white/10 rounded-xl shadow-2xl z-[200] overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search 500+ fonts..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && filteredFonts.map(font => (
              <button
                key={font}
                onClick={() => handleSelect(font)}
                onMouseEnter={() => loadFont(font)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors",
                  value === font
                    ? "bg-purple-600/20 text-purple-300"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
                style={{ fontFamily: font }}
              >
                <span className="flex-1 truncate">{font}</span>
                <span className="text-[10px] opacity-50">Aa</span>
                {value === font && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
            {!loading && filteredFonts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No fonts match "{search}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
