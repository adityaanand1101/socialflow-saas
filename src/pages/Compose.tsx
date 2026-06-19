import { useRef, useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { 
  Image as ImageIcon, Smile, Hash, Send, Calendar,
  Save, Sparkles, Smartphone, Monitor, Loader2, X, Clock, User, Upload,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import type { SocialPlatform } from '@/store/useStore'
import { rewriteCaption } from '@/lib/gemini'
import { useAuth } from '@clerk/react'
import { format, addDays, isValid, parseISO } from 'date-fns'
import { ALL_PLATFORMS } from '@/lib/platforms'
import { getPlatformConstraint, PLATFORM_CONSTRAINTS, getPlatformWarnings } from '@/lib/platformConstraints'

const toneOptions = ['Professional', 'Casual', 'Funny', 'Inspirational', 'Urgent']

const PLATFORM_ORDER = ['instagram', 'facebook', 'x', 'linkedin', 'threads', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'reddit', 'wordpress', 'discord', 'telegram', 'tumblr', 'slack', 'gmb']

const SORTED_PLATFORMS = [...ALL_PLATFORMS].sort((a, b) => PLATFORM_ORDER.indexOf(a.id) - PLATFORM_ORDER.indexOf(b.id))

const ASPECT_CLASSES: Record<string, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '4:3': 'aspect-[4/3]',
  '2:3': 'aspect-[2/3]',
  '3:2': 'aspect-[3/2]',
  '1:3.5': 'aspect-[1/3.5]',
  '*': 'aspect-video',
}

function guessMediaType(url: string): 'image' | 'video' {
  const ext = url.split('?')[0].toLowerCase()
  if (ext.endsWith('.mp4') || ext.endsWith('.webm') || ext.endsWith('.mov') || ext.endsWith('.avi')) return 'video'
  return 'image'
}

export const Compose = () => {
  const [searchParams] = useSearchParams()
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['instagram'])
  const [caption, setCaption] = useState('')
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [showScheduler, setShowScheduler] = useState(() => !!searchParams.get('date'))
  const [scheduledDate, setScheduledDate] = useState(() => {
    const dateParam = searchParams.get('date')
    if (dateParam) {
       const parsed = parseISO(dateParam)
       if (isValid(parsed)) return format(parsed, "yyyy-MM-dd'T'HH:mm")
    }
    return format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm")
  })
  const [selectedTone, setSelectedTone] = useState('Professional')
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editingPostId] = useState<string | null>(searchParams.get('postId'))
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<string>('instagram')
  const [showWarnings, setShowWarnings] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { addPost, updatePost, uploadMedia } = useStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { getToken } = useAuth()

  // --- React Query for Media ---
  const { data: mediaData } = useQuery({
    queryKey: ['media', 'root'],
    queryFn: async () => {
      const token = await getToken()
      const res = await apiFetch('/api/media?folderId=root', { headers: { Authorization: `Bearer ${token}` } })
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  // Pre-fill caption from AI Studio
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const captionParam = params.get('caption')
    if (captionParam) {
      setCaption(captionParam)
      window.history.replaceState({}, '', '/compose')
    }
  }, [])

  // --- Fetch Post if editing ---
  useEffect(() => {
    const fetchPost = async () => {
      if (editingPostId) {
        const token = await getToken()
        const res = await apiFetch(`/api/posts/${editingPostId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const post = await res.json()
          setCaption(post.content || post.caption || '')
          const platforms = post.platforms || ['instagram']
          setSelectedPlatforms(platforms)
          setActivePreviewPlatform(platforms[0])
          setMediaFiles(post.mediaUrls || post.media || [])
          if (post.scheduledAt || post.scheduledTime) {
            setScheduledDate(format(new Date(post.scheduledAt || post.scheduledTime), "yyyy-MM-dd'T'HH:mm"))
            setShowScheduler(true)
          }
        }
      }
    }
    fetchPost()
  }, [editingPostId])

  const libraryMedia = mediaData?.assets || []

  const handleMediaUpload = async (file: File) => {
    setIsUploadingMedia(true)
    try {
      const token = await getToken()
      if (!token) return
      const asset = await uploadMedia(token, file)
      if (asset) {
        setMediaFiles(prev => [...prev, asset.fileUrl])
        queryClient.invalidateQueries({ queryKey: ['media'] })
      }
      return asset
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleMediaUpload(file)
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const asset = await handleMediaUpload(file)
      if (asset) setShowMediaLibrary(false)
    }
  }

  const toggleLibraryMedia = (url: string) => {
    setMediaFiles(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    )
  }

  const togglePlatform = (id: SocialPlatform) => {
    setSelectedPlatforms(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      if (next.length > 0 && !next.includes(activePreviewPlatform as SocialPlatform)) {
        setActivePreviewPlatform(next[0])
      }
      if (next.length === 0) return prev
      return next
    })
  }

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

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Per-platform warnings
  const mediaInfo = useMemo(() => mediaFiles.map(url => ({ url, type: guessMediaType(url) })), [mediaFiles])

  const allWarnings = useMemo(() => {
    if (selectedPlatforms.length === 0) return {}
    const result: Record<string, string[]> = {}
    for (const pid of selectedPlatforms) {
      const w = getPlatformWarnings(pid, caption, mediaInfo)
      if (w.length > 0) result[pid] = w
    }
    return result
  }, [selectedPlatforms, caption, mediaInfo])

  const hasWarnings = Object.keys(allWarnings).length > 0

  const activePlatform = activePreviewPlatform && selectedPlatforms.includes(activePreviewPlatform as SocialPlatform)
    ? activePreviewPlatform
    : selectedPlatforms[0] || 'instagram'

  const activeConstraints = getPlatformConstraint(activePlatform)

  const lowestLimit = useMemo(() => {
    let min = Infinity
    for (const pid of selectedPlatforms) {
      min = Math.min(min, getPlatformConstraint(pid).maxChars)
    }
    return min === Infinity ? 999999 : min
  }, [selectedPlatforms])

  const handlePost = async (status: 'published' | 'draft' | 'scheduled') => {
    if (status !== 'draft' && hasWarnings && !showWarnings) {
      setShowWarnings(true)
      return
    }
    if (!caption && status !== 'draft') return
    
    setIsSubmitting(true)
    try {
      const token = await getToken()
      if (!token) return
      const time = status === 'scheduled' ? new Date(scheduledDate).toISOString() : new Date().toISOString()
      
      if (editingPostId) {
        await updatePost(token, editingPostId, {
          platforms: selectedPlatforms,
          caption,
          media: mediaFiles,
          scheduledTime: time,
          status
        })
      } else {
        await addPost(token, {
          platforms: selectedPlatforms,
          caption,
          media: mediaFiles,
          scheduledTime: time,
          status,
          tags: []
        })
      }
      
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate('/app/calendar')
    } catch (error) {
      console.error('Failed to save post:', error)
    } finally {
      setIsSubmitting(false)
      setShowWarnings(false)
    }
  }

  const previewRatio = activeConstraints.imageRatios.includes('*')
    ? 'aspect-video'
    : ASPECT_CLASSES[activeConstraints.imageRatios[0]] || 'aspect-square'

  const previewIsVideo = mediaInfo.length > 0 && mediaInfo[0].type === 'video'
  const previewRatioClass = previewIsVideo && activeConstraints.videoRatios.length > 0 && activeConstraints.videoRatios[0] !== '*'
    ? ASPECT_CLASSES[activeConstraints.videoRatios[0]] || 'aspect-video'
    : previewRatio

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
      {/* Editor Panel */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white tracking-tight">Compose Post</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => { setCaption(''); setSelectedPlatforms(['instagram']); setMediaFiles([]); setActivePreviewPlatform('instagram'); setShowWarnings(false) }}>
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
            <div className="flex flex-wrap gap-2">
              {SORTED_PLATFORMS.map((p: any) => {
                const c = PLATFORM_CONSTRAINTS[p.id]
                const selected = selectedPlatforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      "group relative flex flex-col items-start px-3 py-2 rounded-lg border transition-all text-left",
                      selected
                        ? "bg-gradient-primary border-transparent text-white shadow-glow"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p.icon className={cn("w-4 h-4", !selected && p.color)} />
                      <span className="text-sm font-medium whitespace-nowrap">{p.label}</span>
                    </div>
                    {c && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn("text-[9px] uppercase font-bold tracking-wider", selected ? "text-white/70" : "text-muted-foreground/60")}>
                          {c.maxChars < 10000 ? `${c.maxChars}c` : '∞'}
                        </span>
                        <span className={cn("text-[9px]", selected ? "text-white/50" : "text-muted-foreground/40")}>·</span>
                        <span className={cn("text-[9px] uppercase font-bold tracking-wider", selected ? "text-white/70" : "text-muted-foreground/60")}>
                          {c.mediaType === 'none' ? 'No media' : c.mediaType === 'video' ? 'Video only' : c.mediaType === 'image' ? 'Image' : 'Media'}
                        </span>
                        {c.allowCarousel && (
                          <>
                            <span className={cn("text-[9px]", selected ? "text-white/50" : "text-muted-foreground/40")}>·</span>
                            <span className={cn("text-[9px] uppercase font-bold tracking-wider", selected ? "text-white/70" : "text-muted-foreground/60")}>
                              Carousel
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
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
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {caption.length} / <span className={cn(caption.length > lowestLimit && "text-red-400 font-bold")}>{lowestLimit}</span>
              </div>
            </div>

            {/* Per-platform character bars */}
            {selectedPlatforms.length > 1 && (
              <div className="space-y-1">
                {selectedPlatforms.map(pid => {
                  const c = getPlatformConstraint(pid)
                  const pct = Math.min((caption.length / c.maxChars) * 100, 100)
                  const over = caption.length > c.maxChars
                  return (
                    <div key={pid} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase w-16 truncate shrink-0">{pid}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", over ? "bg-red-500" : "bg-purple-500/60")} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={cn("text-[10px] w-12 text-right shrink-0", over ? "text-red-400 font-bold" : "text-muted-foreground")}>
                        {caption.length}/{c.maxChars < 10000 ? c.maxChars : '∞'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Media Previews */}
            {mediaFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {mediaFiles.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                    {guessMediaType(url) === 'video' ? (
                      <video src={url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button onClick={() => removeMedia(i)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute top-0.5 right-0.5 px-1 py-0.5 rounded bg-black/60 text-[8px] font-bold text-white uppercase">
                      {guessMediaType(url)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {hasWarnings && (
              <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Platform warnings
                </div>
                {Object.entries(allWarnings).map(([pid, warnings]) =>
                  warnings.map((w, i) => (
                    <p key={`${pid}-${i}`} className="text-[11px] text-amber-300/80 ml-5">{pid}: {w}</p>
                  ))
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-1">
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*,video/*" onChange={onFileChange} />
                <Button 
                  variant="ghost" size="icon" 
                  className={cn("text-muted-foreground hover:text-white", isUploadingMedia && "animate-pulse")}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingMedia}
                >
                  {isUploadingMedia ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                </Button>
                <Button 
                  variant="ghost" size="icon" 
                  className="text-muted-foreground hover:text-white"
                  onClick={() => setShowMediaLibrary(true)}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                  <Smile className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                  <Hash className="w-5 h-5" />
                </Button>
              </div>

              {/* Media Selection Modal */}
              {showMediaLibrary && (
                <div 
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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
                      <button onClick={() => setShowMediaLibrary(false)} className="text-muted-foreground hover:text-white">
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
                              onClick={() => toggleLibraryMedia(item.fileUrl)}
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
                      <Button onClick={() => setShowMediaLibrary(false)}>Done</Button>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={isSubmitting || !caption || selectedPlatforms.length === 0}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post Now
                </Button>
              </div>
            </div>

            {/* Warning Confirm Modal */}
            {showWarnings && hasWarnings && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowWarnings(false)}>
                <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Post with warnings?</h3>
                      <p className="text-sm text-muted-foreground">Some platforms may not display your content correctly.</p>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {Object.entries(allWarnings).map(([pid, warnings]) =>
                      warnings.map((w, i) => (
                        <p key={`${pid}-${i}`} className="text-xs text-amber-300/80 ml-1">{pid}: {w}</p>
                      ))
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowWarnings(false)}>Review</Button>
                    <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { setShowWarnings(false); handlePost('published') }}>
                      Post Anyway
                    </Button>
                  </div>
                </div>
              </div>
            )}

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
          <div className="flex items-center gap-2">
            {/* Per-platform preview tabs */}
            {selectedPlatforms.length > 1 && (
              <div className="flex p-0.5 bg-white/5 rounded-lg border border-white/10">
                {selectedPlatforms.slice(0, 5).map(pid => {
                  const p = ALL_PLATFORMS.find(x => x.id === pid)
                  if (!p) return null
                  const Icon = p.icon
                  return (
                    <button
                      key={pid}
                      onClick={() => setActivePreviewPlatform(pid)}
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        activePreviewPlatform === pid ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                      )}
                      title={p.label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  )
                })}
                {selectedPlatforms.length > 5 && (
                  <span className="px-1.5 flex items-center text-[10px] text-muted-foreground">+{selectedPlatforms.length - 5}</span>
                )}
              </div>
            )}
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
        </div>

        {/* Platform info bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
          {(() => {
            const p = ALL_PLATFORMS.find(x => x.id === activePlatform)
            if (!p) return null
            const Icon = p.icon
            const c = activeConstraints
            return (
              <>
                <Icon className={cn("w-4 h-4", p.color)} />
                <span className="text-sm font-bold text-white">{p.label}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{c.maxChars < 10000 ? `${c.maxChars} char limit` : 'Unlimited chars'}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {c.mediaType === 'none' ? 'No media' :
                   c.mediaType === 'video' ? 'Video only' :
                   c.mediaType === 'image' ? 'Image only' :
                   `Up to ${c.maxImages} images, ${c.maxVideos} video`}
                </span>
              </>
            )
          })()}
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
                  previewIsVideo ? (
                    <video src={mediaFiles[0]} className={`w-full ${previewRatioClass} object-cover`} muted controls />
                  ) : (
                    <img src={mediaFiles[0]} alt="" className={`w-full ${previewRatioClass} object-cover`} />
                  )
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
                previewIsVideo ? (
                  <video src={mediaFiles[0]} className={`w-full ${previewRatioClass} object-cover`} muted controls />
                ) : (
                  <img src={mediaFiles[0]} alt="" className={`w-full ${previewRatioClass} object-cover`} />
                )
              )}
              <div className="p-2 border-t flex justify-around text-[10px] font-semibold text-gray-500">
                {['👍 Like', '💬 Comment', '🔁 Repost', '📤 Send'].map(a => <span key={a}>{a}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Media compatibility table */}
        {mediaFiles.length > 0 && selectedPlatforms.length > 1 && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-2 border-b border-white/10 bg-white/5">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Media compatibility</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-2 text-left text-muted-foreground font-bold uppercase tracking-wider">Platform</th>
                    {mediaFiles.map((_, i) => (
                      <th key={i} className="p-2 text-center text-muted-foreground font-bold uppercase tracking-wider">#{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedPlatforms.map(pid => {
                    const c = getPlatformConstraint(pid)
                    return (
                      <tr key={pid} className="border-b border-white/5 last:border-none">
                        <td className="p-2 text-white font-medium">{pid}</td>
                        {mediaFiles.map((url, i) => {
                          const type = guessMediaType(url)
                          let ok = true
                          if (type === 'image' && c.maxImages <= i) ok = false
                          if (type === 'image' && c.mediaType === 'video') ok = false
                          if (type === 'video' && c.maxVideos === 0) ok = false
                          if (type === 'video' && c.mediaType === 'image') ok = false
                          return (
                            <td key={i} className="p-2 text-center">
                              <span className={cn("text-[10px] font-bold uppercase", ok ? "text-green-400" : "text-red-400")}>
                                {ok ? (type === 'image' ? `✓ ${c.imageRatios[0] === '*' ? 'Any' : c.imageRatios[0]}` : `✓ ${c.videoRatios[0] === '*' ? 'Any' : c.videoRatios[0]}`) : '✗'}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
