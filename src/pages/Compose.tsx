import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Image as ImageIcon, Video, Smile, Hash, Send, Calendar,
  Save, Sparkles, Smartphone, Monitor, Loader2, X, Clock, User
} from 'lucide-react'
import { 
  Instagram, Linkedin, Twitter, Youtube, Facebook, Threads, Bluesky, 
  Slack, Pinterest, Mastodon, Reddit, Medium, Discord, Telegram, GMB, Tumblr 
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import type { SocialPlatform } from '@/store/useStore'
import { rewriteCaption } from '@/lib/gemini'
import { useAuth } from '@clerk/react'
import { format, addDays } from 'date-fns'

const platforms = [
  { id: 'instagram' as SocialPlatform, icon: Instagram, color: 'text-pink-400', label: 'Instagram', limit: 2200 },
  { id: 'facebook' as SocialPlatform, icon: Facebook, color: 'text-blue-500', label: 'Facebook', limit: 63206 },
  { id: 'threads' as SocialPlatform, icon: Threads, color: 'text-white', label: 'Threads', limit: 500 },
  { id: 'x' as SocialPlatform, icon: Twitter, color: 'text-white', label: 'X', limit: 280 },
  { id: 'linkedin' as SocialPlatform, icon: Linkedin, color: 'text-blue-400', label: 'LinkedIn', limit: 3000 },
  { id: 'youtube' as SocialPlatform, icon: Youtube, color: 'text-red-500', label: 'YouTube', limit: 5000 },
  { id: 'gmb' as SocialPlatform, icon: GMB, color: 'text-blue-600', label: 'GMB', limit: 1500 },
  { id: 'pinterest' as SocialPlatform, icon: Pinterest, color: 'text-red-600', label: 'Pinterest', limit: 500 },
  { id: 'bluesky' as SocialPlatform, icon: Bluesky, color: 'text-blue-400', label: 'Bluesky', limit: 300 },
  { id: 'mastodon' as SocialPlatform, icon: Mastodon, color: 'text-purple-500', label: 'Mastodon', limit: 500 },
  { id: 'reddit' as SocialPlatform, icon: Reddit, color: 'text-orange-500', label: 'Reddit', limit: 10000 },
  { id: 'medium' as SocialPlatform, icon: Medium, color: 'text-white', label: 'Medium', limit: 100000 },
  { id: 'tumblr' as SocialPlatform, icon: Tumblr, color: 'text-blue-900', label: 'Tumblr', limit: 10000 },
  { id: 'discord' as SocialPlatform, icon: Discord, color: 'text-indigo-400', label: 'Discord', limit: 2000 },
  { id: 'telegram' as SocialPlatform, icon: Telegram, color: 'text-blue-400', label: 'Telegram', limit: 4096 },
  { id: 'slack' as SocialPlatform, icon: Slack, color: 'text-green-500', label: 'Slack', limit: 12000 },
]

const toneOptions = ['Professional', 'Casual', 'Funny', 'Inspirational', 'Urgent']

export const Compose = () => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['instagram'])
  const [caption, setCaption] = useState('')
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduledDate, setScheduledDate] = useState(() => format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"))
  const [selectedTone, setSelectedTone] = useState('Professional')
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const addPost = useStore((state) => state.addPost)
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const togglePlatform = (id: SocialPlatform) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const activeLimit = platforms.find(p => p.id === selectedPlatforms[0])?.limit || 2200

  const handleRewrite = async () => {
    if (!caption) return
    setIsRewriting(true)
    try {
      const newCaption = await rewriteCaption(caption, selectedTone)
      setCaption(newCaption)
    } catch (error) {
      console.error('AI Rewrite failed:', error)
    } finally {
      setIsRewriting(false)
    }
  }

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setMediaFiles(prev => [...prev, url])
  }

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handlePost = async (status: 'published' | 'draft' | 'scheduled') => {
    if (!caption && status !== 'draft') return
    
    setIsSubmitting(true)
    try {
      const token = await getToken()
      if (!token) return
      const time = status === 'scheduled' ? new Date(scheduledDate).toISOString() : new Date().toISOString()
      await addPost(token, {
        platforms: selectedPlatforms,
        caption,
        media: mediaFiles,
        scheduledTime: time,
        status,
        tags: []
      })
      navigate('/')
    } catch (error) {
      console.error('Failed to save post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
      {/* Editor Panel */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white tracking-tight">Compose Post</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => { setCaption(''); setSelectedPlatforms(['instagram']); setMediaFiles([]) }}>
              Clear
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handlePost('draft')} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </Button>
          </div>
        </div>

        {/* Platform Selector */}
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

        {/* Content Editor */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Content Editor</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-purple-500/50"
              >
                {toneOptions.map(t => <option key={t} value={t} className="bg-[#0F1117]">{t}</option>)}
              </select>
              <Button 
                variant="ghost" size="sm" 
                className="text-purple-400 gap-2 hover:bg-purple-500/10"
                onClick={handleRewrite}
                disabled={isRewriting || !caption}
              >
                {isRewriting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Rewrite
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <div className="relative flex-1">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind? Type your post here..."
                className="w-full h-full min-h-[180px] bg-transparent border-none focus:ring-0 outline-none text-white placeholder:text-white/20 resize-none text-base leading-relaxed"
              />
              <div className={cn("absolute bottom-2 right-2 text-xs", caption.length > activeLimit ? "text-red-400" : "text-muted-foreground")}>
                {caption.length} / {activeLimit}
              </div>
            </div>

            {/* Media Previews */}
            {mediaFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {mediaFiles.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeMedia(i)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-1">
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*,video/*" onChange={handleMediaUpload} />
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white" onClick={() => fileInputRef.current?.click()}>
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
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowScheduler(!showScheduler)}
                >
                  <Clock className="w-4 h-4" />
                  Schedule
                </Button>
                <Button 
                  className="gap-2 px-6"
                  onClick={() => handlePost('published')}
                  disabled={isSubmitting || !caption}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post Now
                </Button>
              </div>
            </div>

            {/* Scheduler Panel */}
            {showScheduler && (
              <div className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-2 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">Schedule for Later</span>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                  />
                  <Button 
                    className="gap-2"
                    onClick={() => { handlePost('scheduled'); setShowScheduler(false) }}
                    disabled={isSubmitting || !caption}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                    Confirm
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Will publish on {format(new Date(scheduledDate), 'MMMM d, yyyy at h:mm a')}
                </p>
              </div>
            )}
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
              className={cn("p-1.5 rounded-md transition-all", previewDevice === 'mobile' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={cn("p-1.5 rounded-md transition-all", previewDevice === 'desktop' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-center items-start pt-8 bg-navy-800/50 rounded-2xl border border-white/5 min-h-[580px] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500 blur-[120px] rounded-full" />
          </div>

          {previewDevice === 'mobile' ? (
            <div className="w-[300px] h-[560px] border-[8px] border-navy-900 rounded-[40px] bg-black shadow-2xl relative overflow-hidden flex flex-col z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-navy-900 rounded-b-2xl z-20" />
              <div className="flex-1 bg-white text-black pt-6 overflow-y-auto">
                <div className="px-3 py-2 border-b flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-[11px] font-bold">your_account</span>
                  <span className="ml-auto text-[10px] text-blue-500 font-bold">Follow</span>
                </div>
                {mediaFiles[0] ? (
                  <img src={mediaFiles[0]} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <div className="p-3 space-y-1.5">
                  <div className="flex gap-3 text-sm">❤️ 💬 📤</div>
                  <div className="text-[10px] font-bold">0 likes</div>
                  <div className="text-[10px] leading-tight">
                    <span className="font-bold mr-1">your_account</span>
                    {caption || <span className="text-gray-400">Your caption will appear here...</span>}
                  </div>
                  <div className="text-[8px] text-gray-400 uppercase">Just now</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-[85%] bg-white text-black overflow-hidden border-none shadow-2xl rounded-xl z-10">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Your Organization</p>
                    <p className="text-[10px] text-gray-500">0 followers • Just now</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 text-xs">+ Follow</Button>
              </div>
              <div className="p-3 text-xs whitespace-pre-wrap leading-relaxed">
                {caption || <span className="text-gray-400">Your post content preview...</span>}
              </div>
              {mediaFiles[0] && (
                <img src={mediaFiles[0]} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-2 border-t flex justify-around text-[10px] font-semibold text-gray-500">
                {['👍 Like', '💬 Comment', '🔁 Repost', '📤 Send'].map(a => <span key={a}>{a}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
