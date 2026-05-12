import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  MessageSquare, 
  Hash, 
  Lightbulb, 
  ImageIcon, 
  RefreshCcw,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tools = [
  { id: 'caption', icon: MessageSquare, title: 'Caption Generator', description: 'Create engaging captions from a prompt.' },
  { id: 'hashtag', icon: Hash, title: 'Hashtag Research', description: 'Find trending tags for your niche.' },
  { id: 'ideas', icon: Lightbulb, title: 'Content Ideas', description: 'Get 30 days of content planned in seconds.' },
  { id: 'image', icon: ImageIcon, title: 'AI Image Generator', description: 'Generate custom visuals for your posts.' },
]

export const AIStudio = () => {
  const [activeTool, setActiveTool] = useState('caption')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 2000)
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Studio</h1>
          <p className="text-muted-foreground mt-1">Unlock your creativity with advanced AI tools.</p>
        </div>
        <div className="px-4 py-2 glass-card rounded-lg flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">24 / 100 Credits left</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tool Selector Sidebar */}
        <div className="space-y-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all group",
                activeTool === tool.id 
                  ? "bg-gradient-primary border-transparent shadow-glow" 
                  : "bg-white/5 border-white/10 hover:border-white/20"
              )}
            >
              <tool.icon className={cn(
                "w-5 h-5 mb-2",
                activeTool === tool.id ? "text-white" : "text-muted-foreground group-hover:text-white"
              )} />
              <p className={cn(
                "font-semibold text-sm",
                activeTool === tool.id ? "text-white" : "text-muted-foreground group-hover:text-white"
              )}>{tool.title}</p>
              <p className={cn(
                "text-[10px] mt-1 leading-tight",
                activeTool === tool.id ? "text-white/80" : "text-muted-foreground"
              )}>{tool.description}</p>
            </button>
          ))}
        </div>

        {/* Main Work Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="min-h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle>{tools.find(t => t.id === activeTool)?.title}</CardTitle>
              <CardDescription>Enter a prompt below to generate content.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
              <div className="relative flex-1 bg-white/5 rounded-xl border border-white/10 p-6">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Consulting the muse...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Write a funny caption for a new luxury watch launch on Instagram. Mention the durability and style."
                      className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-muted-foreground resize-none text-lg h-[150px]"
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Professional', 'Casual', 'Funny', 'Urgent'].map(tone => (
                        <Button key={tone} variant="outline" size="sm" className="bg-white/5 border-white/10 text-xs">{tone}</Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                      <RefreshCcw className="w-4 h-4" />
                      Reset
                    </Button>
                 </div>
                 <Button onClick={handleGenerate} disabled={!prompt || isGenerating} className="gap-2 px-8">
                   {isGenerating ? "Generating..." : "Generate Magic"}
                   <Sparkles className="w-4 h-4" />
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Result Preview (Mock) */}
          {!isGenerating && prompt && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {[1, 2].map(i => (
                <Card key={i} className="hover:border-purple-500/50 transition-colors cursor-pointer group">
                  <CardContent className="p-6">
                    <p className="text-sm text-white leading-relaxed italic">
                      "Time isn't just about hours—it's about the moments that define you. ⌚✨ Our new Chronos Elite isn't just a watch; it's a legacy on your wrist. Durable enough for the summit, stylish enough for the gala. #ChronosElite #LuxuryStyle"
                    </p>
                    <div className="flex items-center justify-between mt-6">
                       <span className="text-[10px] text-muted-foreground uppercase font-bold">Variant {i}</span>
                       <Button size="sm" className="h-8 gap-2 bg-white/10 hover:bg-white/20 text-white border-none">
                         Use this
                         <ArrowRight className="w-3 h-3" />
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
