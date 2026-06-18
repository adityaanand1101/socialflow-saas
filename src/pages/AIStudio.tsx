import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, Hash, Lightbulb, ImageIcon,
  RefreshCcw, Loader2, Copy, Check, Wand2, ArrowRight, AlertCircle,
  ChevronDown, Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@clerk/react'
import { apiFetch } from '@/lib/api'
import { ALL_PLATFORMS } from '@/lib/platforms'

const PLATFORM_OPTIONS = ALL_PLATFORMS.map(p => ({ id: p.id, label: p.label }))

const tools = [
  { id: 'caption', icon: MessageSquare, title: 'Caption Generator', description: 'Create engaging captions from a prompt.', color: 'from-purple-500 to-blue-500' },
  { id: 'hashtag', icon: Hash, title: 'Hashtag Research', description: 'Find trending tags for your niche.', color: 'from-blue-500 to-cyan-500' },
  { id: 'ideas', icon: Lightbulb, title: 'Content Ideas', description: 'Get 10 days of content planned in seconds.', color: 'from-orange-500 to-yellow-500' },
  { id: 'image', icon: ImageIcon, title: 'AI Image Generator', description: 'Generate custom visuals for your posts.', color: 'from-pink-500 to-rose-500' },
]

type CaptionWizard = { brand: string; audience: string; goal: string; hook: string; cta: string; emoji: string }
type HashtagWizard = { niche: string; related: string; reach: string }
type IdeasWizard = { brand: string; audience: string; goals: string[]; formats: string[] }
type ImageWizard = { subject: string; style: string; mood: string; colors: string; lighting: string }

const GOAL_OPTIONS = ['Awareness', 'Engagement', 'Sales', 'Education', 'Entertainment']
const FORMAT_OPTIONS = ['Carousel', 'Reel', 'Poll', 'Story', 'Tutorial', 'Behind-scenes', 'Q&A', 'Trend']
const STYLE_OPTIONS = ['Photorealistic', 'Illustration', '3D Render', 'Oil Painting', 'Digital Art', 'Anime', 'Minimalist']
const MOOD_OPTIONS = ['Professional', 'Playful', 'Dark', 'Bright', 'Minimal', 'Dramatic', 'Warm', 'Cool']
const LIGHTING_OPTIONS = ['Natural', 'Studio', 'Golden Hour', 'Dramatic', 'Neon', 'Soft']

const INIT_CAPTION: CaptionWizard = { brand: '', audience: '', goal: 'Engagement', hook: '', cta: 'Comment', emoji: 'Moderate' }
const INIT_HASHTAG: HashtagWizard = { niche: '', related: '', reach: 'Mix' }
const INIT_IDEAS: IdeasWizard = { brand: '', audience: '', goals: ['Engagement'], formats: [] }
const INIT_IMAGE: ImageWizard = { subject: '', style: 'Photorealistic', mood: 'Professional', colors: '', lighting: 'Natural' }

export const AIStudio = () => {
  const [activeTool, setActiveTool] = useState('caption')
  const [prompt, setPrompt] = useState('')
  const [isManuallyEdited, setIsManuallyEdited] = useState(false)
  const [tone, setTone] = useState('Professional')
  const [platform, setPlatform] = useState('instagram')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showWizard, setShowWizard] = useState(true)

  const [cw, setCw] = useState<CaptionWizard>(INIT_CAPTION)
  const [hw, setHw] = useState<HashtagWizard>(INIT_HASHTAG)
  const [iw, setIw] = useState<IdeasWizard>(INIT_IDEAS)
  const [imw, setImw] = useState<ImageWizard>(INIT_IMAGE)

  const navigate = useNavigate()
  const { getToken } = useAuth()

  const buildPrompt = useCallback(() => {
    switch (activeTool) {
      case 'caption': {
        const parts: string[] = []
        if (cw.brand) parts.push(`Brand: ${cw.brand}`)
        if (cw.audience) parts.push(`Target audience: ${cw.audience}`)
        if (cw.goal) parts.push(`Goal: ${cw.goal}`)
        if (cw.hook) parts.push(`Hook: ${cw.hook}`)
        if (cw.cta && cw.cta !== 'Comment') parts.push(`CTA: ${cw.cta}`)
        if (cw.emoji !== 'Moderate') parts.push(`Emoji: ${cw.emoji}`)
        if (cw.brand || cw.audience || cw.hook) return parts.join('. ') + '.'
        return ''
      }
      case 'hashtag': {
        if (!hw.niche) return ''
        return hw.niche + (hw.related ? ` related to ${hw.related}` : '') + (hw.reach !== 'Mix' ? `, target: ${hw.reach}` : '')
      }
      case 'ideas': {
        const parts: string[] = []
        if (iw.brand) parts.push(`Brand: ${iw.brand}`)
        if (iw.audience) parts.push(`Audience: ${iw.audience}`)
        if (iw.goals.length) parts.push(`Goals: ${iw.goals.join(', ')}`)
        if (iw.formats.length) parts.push(`Formats: ${iw.formats.join(', ')}`)
        if (iw.brand || iw.audience) return parts.join('. ') + '.'
        return ''
      }
      case 'image': {
        if (!imw.subject) return ''
        const parts: string[] = []
        if (imw.style) parts.push(`Style: ${imw.style}`)
        if (imw.mood) parts.push(`Mood: ${imw.mood}`)
        if (imw.lighting) parts.push(`Lighting: ${imw.lighting}`)
        if (imw.colors) parts.push(`Colors: ${imw.colors}`)
        const suffix = parts.length ? `, ${parts.join(', ')}` : ''
        return `${imw.subject}${suffix}`
      }
    }
  }, [activeTool, cw, hw, iw, imw])

  useEffect(() => {
    if (!isManuallyEdited) {
      const built = buildPrompt()
      if (built) setPrompt(built)
    }
  }, [buildPrompt, isManuallyEdited])

  const handleWizardChange = () => {
    setIsManuallyEdited(false)
  }

  const copyText = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setResults(null)
    setError(null)

    let token = '';
    try {
      token = await getToken() || '';
    } catch (err) {
      console.warn('Failed to get auth token', err);
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      switch (activeTool) {
        case 'caption': {
          try {
            const res = await apiFetch('/api/ai/caption', {
              method: 'POST',
              headers,
              body: JSON.stringify({ prompt, tone, platform })
            });
            const data = await res.json();
            if (res.ok) {
              setResults({ variations: data.variations });
              break;
            } else {
              throw new Error(data.error || 'Server error');
            }
          } catch (e: any) {
            console.error('Backend caption generation failed:', e);
            setError(e.message);
          }
          break
        }
        case 'hashtag': {
          try {
            const res = await apiFetch('/api/ai/hashtags', {
              method: 'POST',
              headers,
              body: JSON.stringify({ niche: prompt, keywords: prompt })
            });
            const data = await res.json();
            if (res.ok) {
              setResults({ hashtags: data.hashtags });
              break;
            } else {
              throw new Error(data.error || 'Server error');
            }
          } catch (e: any) {
            console.error('Backend hashtag generation failed:', e);
            setError(e.message);
          }
          break
        }
        case 'ideas': {
          try {
            const res = await apiFetch('/api/ai/ideas', {
              method: 'POST',
              headers,
              body: JSON.stringify({ topic: prompt, industry: prompt })
            });
            const data = await res.json();
            if (res.ok) {
              setResults({ ideas: data.ideas });
              break;
            } else {
              throw new Error(data.error || 'Server error');
            }
          } catch (e: any) {
            console.error('Backend ideas generation failed:', e);
            setError(e.message);
          }
          break
        }
        case 'image': {
          try {
            const res = await apiFetch('/api/ai/image', {
              method: 'POST',
              headers,
              body: JSON.stringify({ imagePrompt: prompt, aspectRatio })
            });
            const data = await res.json();
            if (res.ok) {
              setResults({ url: data.url });
              break;
            } else {
              throw new Error(data.error || 'Server error');
            }
          } catch (e: any) {
            console.error('Backend image generation failed:', e);
            setError(e.message);
          }
          break
        }
      }
    } catch (error) {
      console.error('Generation error:', error)
      setError('Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const renderResults = () => {
    if (!results) return null

    if (activeTool === 'caption' && results.variations) {
      return (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {results.variations.map((v: string, i: number) => (
            <Card key={i} className="hover:border-purple-500/50 transition-colors group border-white/10 bg-white/5">
              <CardContent className="p-5">
                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{v}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Variant {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-purple-400 hover:text-purple-300 text-xs"
                      onClick={() => navigate(`/compose?caption=${encodeURIComponent(v)}`)}
                    >
                      <Wand2 className="w-3 h-3" />
                      Compose
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 gap-2 text-white/60 hover:text-white text-xs"
                      onClick={() => copyText(v, i)}
                    >
                      {copiedIndex === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      {copiedIndex === i ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (activeTool === 'hashtag' && results.hashtags) {
      return (
        <Card className="animate-in fade-in border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm">Generated Hashtags</CardTitle>
            <CardDescription>{results.hashtags.length} hashtags for your niche</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {results.hashtags.map((h: string, i: number) => (
                <button
                  key={i}
                  onClick={() => copyText(h, i)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-full text-sm text-blue-400 transition-all flex items-center gap-1.5 group"
                >
                  {h}
                  {copiedIndex === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                </button>
              ))}
            </div>
            <Button className="mt-4 gap-2 w-full" variant="outline" onClick={() => copyText(results.hashtags.join(' '), 999)}>
              {copiedIndex === 999 ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              Copy All Hashtags
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (activeTool === 'ideas' && results.ideas) {
      return (
        <div className="space-y-3 animate-in fade-in max-h-[600px] overflow-auto custom-scrollbar pr-1">
          {results.ideas.map((idea: any, i: number) => (
            <Card key={i} className="border-white/10 bg-white/5 hover:border-white/20 transition-colors">
              <CardContent className="p-4 flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-primary flex items-center justify-center font-bold text-white text-sm shadow-glow">
                  {idea.day || i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm">{idea.topic}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{idea.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 h-8 text-xs gap-1 text-purple-400 hover:bg-purple-500/10"
                  onClick={() => navigate('/compose')}
                >
                  Create <ArrowRight className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (activeTool === 'image' && results.url) {
      return (
        <Card className="animate-in fade-in overflow-hidden border-white/10 bg-white/5">
          <CardContent className="p-0 relative group">
            <div className="relative w-full max-h-[600px] overflow-hidden flex items-center justify-center bg-black/40">
              <img
                src={results.url}
                alt="Generated"
                className="w-full h-full object-contain max-h-[600px]"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-xl">
              <Button onClick={() => window.open(results.url, '_blank')} variant="outline">View Full</Button>
              <Button onClick={() => navigate('/media')}>Save to Library</Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  const selectClass = "appearance-none bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 pr-8 text-xs text-white font-medium cursor-pointer hover:bg-white/20 transition-colors outline-none"
  const labelClass = "text-[10px] text-muted-foreground uppercase font-bold tracking-wider shrink-0"
  const fieldClass = "flex items-center gap-2"
  const chipClass = (active: boolean) => cn(
    "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
    active ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-white"
  )

  const renderCaptionWizard = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className={fieldClass}>
          <span className={labelClass}>Brand</span>
          <input value={cw.brand} onChange={e => { setCw({...cw, brand: e.target.value}); handleWizardChange() }} placeholder="e.g. BrewLab" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/50" />
        </div>
        <div className={fieldClass}>
          <span className={labelClass}>Audience</span>
          <input value={cw.audience} onChange={e => { setCw({...cw, audience: e.target.value}); handleWizardChange() }} placeholder="e.g. Gen Z coffee lovers" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/50" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={fieldClass}>
          <span className={labelClass}>Goal</span>
          <select value={cw.goal} onChange={e => { setCw({...cw, goal: e.target.value}); handleWizardChange() }} className={selectClass}>
            {GOAL_OPTIONS.map(g => <option key={g} value={g} className="bg-gray-900">{g}</option>)}
          </select>
        </div>
        <div className={fieldClass}>
          <span className={labelClass}>CTA</span>
          <select value={cw.cta} onChange={e => { setCw({...cw, cta: e.target.value}); handleWizardChange() }} className={selectClass}>
            {['Link', 'Comment', 'Share', 'Follow', 'Shop', 'DM'].map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
          </select>
        </div>
      </div>
      <div className={fieldClass}>
        <span className={labelClass}>Hook</span>
        <input value={cw.hook} onChange={e => { setCw({...cw, hook: e.target.value}); handleWizardChange() }} placeholder="e.g. 'The coffee hack that changed my mornings'" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/50" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={labelClass}>Emoji</span>
        {['None', 'Minimal', 'Moderate', 'Heavy'].map(e => (
          <button key={e} onClick={() => { setCw({...cw, emoji: e}); handleWizardChange() }} className={chipClass(cw.emoji === e)}>{e}</button>
        ))}
      </div>
    </div>
  )

  const renderHashtagWizard = () => (
    <div className="space-y-3">
      <div className={fieldClass}>
        <span className={labelClass}>Niche</span>
        <input value={hw.niche} onChange={e => { setHw({...hw, niche: e.target.value}); handleWizardChange() }} placeholder="e.g. sustainable fashion" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/50" />
      </div>
      <div className={fieldClass}>
        <span className={labelClass}>Related</span>
        <input value={hw.related} onChange={e => { setHw({...hw, related: e.target.value}); handleWizardChange() }} placeholder="e.g. eco-friendly, thrifting" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/50" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={labelClass}>Reach</span>
        {['Broad', 'Mix', 'Niche'].map(r => (
          <button key={r} onClick={() => { setHw({...hw, reach: r}); handleWizardChange() }} className={chipClass(hw.reach === r)}>{r}</button>
        ))}
      </div>
    </div>
  )

  const renderIdeasWizard = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className={fieldClass}>
          <span className={labelClass}>Brand</span>
          <input value={iw.brand} onChange={e => { setIw({...iw, brand: e.target.value}); handleWizardChange() }} placeholder="e.g. FitHer" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/50" />
        </div>
        <div className={fieldClass}>
          <span className={labelClass}>Audience</span>
          <input value={iw.audience} onChange={e => { setIw({...iw, audience: e.target.value}); handleWizardChange() }} placeholder="e.g. women 25–40" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/50" />
        </div>
      </div>
      <div>
        <span className={labelClass}>Goals</span>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {GOAL_OPTIONS.map(g => (
            <button key={g} onClick={() => { setIw({...iw, goals: iw.goals.includes(g) ? iw.goals.filter(x => x !== g) : [...iw.goals, g]}); handleWizardChange() }} className={chipClass(iw.goals.includes(g))}>{g}</button>
          ))}
        </div>
      </div>
      <div>
        <span className={labelClass}>Formats</span>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {FORMAT_OPTIONS.map(f => (
            <button key={f} onClick={() => { setIw({...iw, formats: iw.formats.includes(f) ? iw.formats.filter(x => x !== f) : [...iw.formats, f]}); handleWizardChange() }} className={chipClass(iw.formats.includes(f))}>{f}</button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderImageWizard = () => (
    <div className="space-y-3">
      <div className={fieldClass}>
        <span className={labelClass}>Subject</span>
        <input value={imw.subject} onChange={e => { setImw({...imw, subject: e.target.value}); handleWizardChange() }} placeholder="e.g. a minimalist coffee shop interior" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/50" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={fieldClass}>
          <span className={labelClass}>Style</span>
          <select value={imw.style} onChange={e => { setImw({...imw, style: e.target.value}); handleWizardChange() }} className={selectClass}>
            {STYLE_OPTIONS.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
          </select>
        </div>
        <div className={fieldClass}>
          <span className={labelClass}>Mood</span>
          <select value={imw.mood} onChange={e => { setImw({...imw, mood: e.target.value}); handleWizardChange() }} className={selectClass}>
            {MOOD_OPTIONS.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={fieldClass}>
          <span className={labelClass}>Lighting</span>
          <select value={imw.lighting} onChange={e => { setImw({...imw, lighting: e.target.value}); handleWizardChange() }} className={selectClass}>
            {LIGHTING_OPTIONS.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
          </select>
        </div>
        <div className={fieldClass}>
          <span className={labelClass}>Colors</span>
          <input value={imw.colors} onChange={e => { setImw({...imw, colors: e.target.value}); handleWizardChange() }} placeholder="e.g. warm earth tones" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/50" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Studio</h1>
          <p className="text-muted-foreground mt-1">AI-powered social media toolkit — create content in seconds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tool Selector */}
        <div className="space-y-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResults(null); setError(null); setIsManuallyEdited(false) }}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
                activeTool === tool.id 
                  ? "bg-gradient-primary border-transparent shadow-glow" 
                  : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8"
              )}
            >
              <tool.icon className={cn("w-5 h-5 mb-2", activeTool === tool.id ? "text-white" : "text-muted-foreground group-hover:text-white")} />
              <p className={cn("font-semibold text-sm", activeTool === tool.id ? "text-white" : "text-muted-foreground group-hover:text-white")}>{tool.title}</p>
              <p className={cn("text-[10px] mt-1 leading-tight", activeTool === tool.id ? "text-white/80" : "text-muted-foreground")}>{tool.description}</p>
            </button>
          ))}
        </div>

        {/* Main Work Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="min-h-[280px] flex flex-col border-white/10 bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{tools.find(t => t.id === activeTool)?.title}</CardTitle>
                <CardDescription>Fine-tune below then generate.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={() => setShowWizard(!showWizard)}>
                <Settings2 className="w-3.5 h-3.5" />
                {showWizard ? 'Hide wizard' : 'Prompt wizard'}
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-5">
              {/* Wizard Panel */}
              {showWizard && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-purple-400 uppercase font-bold tracking-wider">Prompt Builder</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[10px] text-muted-foreground h-6 gap-1"
                      onClick={() => {
                        if (activeTool === 'caption') setCw(INIT_CAPTION)
                        else if (activeTool === 'hashtag') setHw(INIT_HASHTAG)
                        else if (activeTool === 'ideas') setIw(INIT_IDEAS)
                        else if (activeTool === 'image') setImw(INIT_IMAGE)
                        setIsManuallyEdited(false)
                        setPrompt('')
                      }}
                    >
                      <RefreshCcw className="w-3 h-3" />
                      Reset
                    </Button>
                  </div>
                  {activeTool === 'caption' && renderCaptionWizard()}
                  {activeTool === 'hashtag' && renderHashtagWizard()}
                  {activeTool === 'ideas' && renderIdeasWizard()}
                  {activeTool === 'image' && renderImageWizard()}
                </div>
              )}

              {/* Prompt Area */}
              <div className="bg-black/20 rounded-xl border border-white/10 p-4">
                <textarea 
                  value={prompt}
                  onChange={(e) => { setPrompt(e.target.value); setIsManuallyEdited(true) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() } }}
                  placeholder={
                    activeTool === 'caption' ? "Describe your post (e.g. 'launching a new coffee brand for Gen Z')..." :
                    activeTool === 'hashtag' ? "Enter your niche or topic (e.g. 'sustainable fashion')..." :
                    activeTool === 'ideas' ? "Enter your brand topic (e.g. 'fitness coaching for women')..." :
                    "Describe the image you want to generate..."
                  }
                  className="w-full bg-transparent border-none focus:ring-0 outline-none text-white placeholder:text-white/30 resize-none text-sm h-[100px] leading-relaxed"
                />
                
                {activeTool === 'caption' && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 w-full mb-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Target Platform</span>
                      <div className="relative">
                        <select
                          value={platform}
                          onChange={(e) => setPlatform(e.target.value)}
                          className="appearance-none bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 pr-8 text-xs text-white font-medium cursor-pointer hover:bg-white/20 transition-colors outline-none"
                        >
                          {PLATFORM_OPTIONS.map(p => (
                            <option key={p.id} value={p.id} className="bg-gray-900">{p.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Professional', 'Casual', 'Funny', 'Inspirational', 'Urgent', 'Educational'].map(t => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                            tone === t ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-white"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {activeTool === 'image' && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Aspect Ratio</span>
                      <div className="relative">
                        <select
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value)}
                          className="appearance-none bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 pr-8 text-xs text-white font-medium cursor-pointer hover:bg-white/20 transition-colors outline-none"
                        >
                          <option value="1:1" className="bg-gray-900">Square (1:1)</option>
                          <option value="16:9" className="bg-gray-900">Landscape (16:9)</option>
                          <option value="4:3" className="bg-gray-900">Standard (4:3)</option>
                          <option value="3:4" className="bg-gray-900">Portrait (3:4)</option>
                          <option value="9:16" className="bg-gray-900">Story (9:16)</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={() => { setPrompt(''); setResults(null); setIsManuallyEdited(false) }}>
                  <RefreshCcw className="w-4 h-4" />
                  Reset
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Enter ↵</span>
                  <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="gap-2 px-8 bg-gradient-primary shadow-glow">
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Loading Skeleton */}
          {isGenerating && !results && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <Card key={i} className="border-white/10 bg-white/5">
                  <CardContent className="p-5">
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-white/10 rounded w-full mb-2" />
                    <div className="h-3 bg-white/10 rounded w-5/6 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                      <div className="h-3 bg-white/10 rounded w-16" />
                      <div className="h-3 bg-white/10 rounded w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results */}
          {!isGenerating && renderResults()}
        </div>
      </div>
    </div>
  )
}
