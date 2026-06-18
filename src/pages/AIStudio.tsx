import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, MessageSquare, Hash, Lightbulb, ImageIcon,
  RefreshCcw, Loader2, Copy, Check, Wand2, ArrowRight, AlertCircle,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@clerk/react'
import { apiFetch } from '@/lib/api'
import { ALL_PLATFORMS } from '@/lib/platforms'

const PLATFORM_OPTIONS = ALL_PLATFORMS.map(p => ({ id: p.id, label: p.label }))

const tools = [
  { id: 'caption', icon: MessageSquare, title: 'Caption Generator', description: 'Create engaging captions from a prompt.', color: 'from-purple-500 to-blue-500' },
  { id: 'hashtag', icon: Hash, title: 'Hashtag Research', description: 'Find trending tags for your niche.', color: 'from-blue-500 to-cyan-500' },
  { id: 'ideas', icon: Lightbulb, title: 'Content Ideas', description: 'Get 30 days of content planned in seconds.', color: 'from-orange-500 to-yellow-500' },
  { id: 'image', icon: ImageIcon, title: 'AI Image Generator', description: 'Generate custom visuals for your posts.', color: 'from-pink-500 to-rose-500' },
]

export const AIStudio = () => {
  const [activeTool, setActiveTool] = useState('caption')
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('Professional')
  const [platform, setPlatform] = useState('instagram')
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { getToken } = useAuth()

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
              body: JSON.stringify({ imagePrompt: prompt, aspectRatio: '1:1' })
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
            <img src={results.url} alt="Generated" className="w-full h-auto rounded-xl" />
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

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Studio</h1>
          <p className="text-muted-foreground mt-1">Powered by Google Gemini — create content in seconds.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary/10 border border-purple-500/20">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Gemini AI Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tool Selector */}
        <div className="space-y-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResults(null); setError(null) }}
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
            <CardHeader>
                <CardTitle>{tools.find(t => t.id === activeTool)?.title}</CardTitle>
              <CardDescription>Enter a prompt to generate content with AI.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
              <div className="flex-1 bg-black/20 rounded-xl border border-white/10 p-4">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleGenerate() }}
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
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={() => { setPrompt(''); setResults(null) }}>
                  <RefreshCcw className="w-4 h-4" />
                  Reset
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">⌘ + Enter</span>
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
