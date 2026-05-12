import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Music,
  Image as ImageIcon,
  Video,
  Smile,
  Hash,
  Send,
  Calendar,
  Save,
  Sparkles,
  Smartphone,
  Monitor
} from 'lucide-react'
import { Instagram, Linkedin, Twitter, Youtube } from '@/components/icons'
import { cn } from '@/lib/utils'

const platforms = [
  { id: 'instagram', icon: Instagram, color: 'text-pink-400', label: 'Instagram' },
  { id: 'linkedin', icon: Linkedin, color: 'text-blue-400', label: 'LinkedIn' },
  { id: 'x', icon: Twitter, color: 'text-white', label: 'X' },
  { id: 'tiktok', icon: Music, color: 'text-cyan-400', label: 'TikTok' },
  { id: 'youtube', icon: Youtube, color: 'text-red-500', label: 'YouTube' },
]

export const Compose = () => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram'])
  const [caption, setCaption] = useState('')
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
      {/* Editor Panel */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white tracking-tight">Compose Post</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-muted-foreground hover:text-white">Clear</Button>
            <Button variant="outline" className="gap-2">
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Platforms</CardTitle>
            <CardDescription>Choose where you want to publish this post.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                    selectedPlatforms.includes(p.id)
                      ? "bg-gradient-primary border-transparent text-white shadow-glow"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                  )}
                >
                  <p.icon className={cn("w-4 h-4", !selectedPlatforms.includes(p.id) && p.color)} />
                  <span className="text-sm font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[400px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Content Editor</CardTitle>
            <Button variant="ghost" size="sm" className="text-purple-400 gap-2 hover:bg-purple-500/10">
              <Sparkles className="w-4 h-4" />
              AI Rewriter
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <div className="relative flex-1">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind? Type / for AI commands..."
                className="w-full h-full min-h-[200px] bg-transparent border-none focus:ring-0 text-white placeholder:text-muted-foreground resize-none text-lg p-0"
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {caption.length} / 2200
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                  <Smile className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                  <Hash className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule
                </Button>
                <Button className="gap-2 px-6">
                  <Send className="w-4 h-4" />
                  Post Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Live Preview</h2>
          <div className="flex p-1 bg-white/5 rounded-lg border border-white/10">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                previewDevice === 'mobile' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
              )}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                previewDevice === 'desktop' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
              )}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-center items-start pt-10 bg-navy-800/50 rounded-2xl border border-white/5 min-h-[600px] overflow-hidden relative">
          {/* Abstract background for preview */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500 blur-[120px] rounded-full" />
          </div>

          {previewDevice === 'mobile' ? (
            <div className="w-[320px] h-[580px] border-[8px] border-navy-900 rounded-[40px] bg-black shadow-2xl relative overflow-hidden flex flex-col">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-navy-900 rounded-b-2xl z-20" />
              
              {/* Instagram Mock UI */}
              <div className="flex-1 bg-white text-black pt-8">
                <div className="px-4 py-2 border-b flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
                    <div className="w-full h-full rounded-full bg-white border-2 border-white overflow-hidden">
                      <img src="https://github.com/shadcn.png" alt="" />
                    </div>
                  </div>
                  <span className="text-xs font-bold">socialflow_hq</span>
                </div>
                
                <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                  <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/20 rounded-full" />
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex gap-4">
                    <div className="w-5 h-5 border-2 border-black rounded-sm" />
                    <div className="w-5 h-5 border-2 border-black rounded-full" />
                    <div className="w-5 h-5 border-2 border-black rotate-45" />
                  </div>
                  <div className="text-[10px] font-bold">1,234 likes</div>
                  <div className="text-[10px] leading-tight">
                    <span className="font-bold mr-2">socialflow_hq</span>
                    {caption || "Your caption will appear here..."}
                  </div>
                  <div className="text-[8px] text-gray-400 uppercase">2 minutes ago</div>
                </div>
              </div>
            </div>
          ) : (
            <Card className="w-[80%] max-w-2xl bg-white text-black overflow-hidden border-none shadow-2xl">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">SF</div>
                  <div>
                    <p className="text-sm font-bold">SocialFlow Inc.</p>
                    <p className="text-[10px] text-gray-500">5,200 followers • 2h</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600">+ Follow</Button>
              </div>
              <div className="p-4 text-sm whitespace-pre-wrap">
                {caption || "LinkedIn post content preview..."}
              </div>
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                 <ImageIcon className="w-16 h-16 text-gray-300" />
              </div>
              <div className="p-2 border-t flex justify-around">
                {['Like', 'Comment', 'Repost', 'Send'].map(action => (
                  <span key={action} className="text-xs font-semibold text-gray-500 py-2">{action}</span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
