import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { Save, Loader2, Clock, Send, Trash2, MessageCircle, AtSign } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { SocialPlatform } from '@/store/useStore'
import { useAuth } from '@clerk/react'
import { format, addDays, isValid, parseISO } from 'date-fns'
import { ALL_PLATFORMS } from '@/lib/platforms'
import { getPlatformWarnings, getContentType, getDefaultContentType } from '@/lib/platformConstraints'
import { stripHtml, wrapPlainText } from '@/lib/htmlUtils'
import { toastStore } from '@/lib/toast/store'
import { cn } from '@/lib/utils'
import {
  PlatformSelector,
  ContentEditor,
  PreviewPanel,
  WarningModal,
  SchedulerPanel
} from '@/components/compose'

export const Compose = () => {
  const [searchParams] = useSearchParams()
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['instagram'])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
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
  const [mediaTypes, setMediaTypes] = useState<Record<string, string>>({})
  const [showDraftRestore, setShowDraftRestore] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [newTemplateName, setNewTemplateName] = useState('')
  const [platformCaptions, setPlatformCaptions] = useState<Record<string, string>>({})
  const [brokenOutPlatforms, setBrokenOutPlatforms] = useState<Set<string>>(new Set())
  const [activeEditorPlatform, setActiveEditorPlatform] = useState<string>('master')
  const [showHashtagModal, setShowHashtagModal] = useState(false)
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
  const [hashtagNiche, setHashtagNiche] = useState('')
  const [hashtagLoading, setHashtagLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [postTypes, setPostTypes] = useState<Record<string, string>>({})
  const [structuredContent, setStructuredContent] = useState<Record<string, Record<string, string>>>({})
  const [threadPosts, setThreadPosts] = useState<{ id: string; content: string; delayMinutes: number }[]>([])
  const [showThreadEditor, setShowThreadEditor] = useState(false)
  const [showShortlinkModal, setShowShortlinkModal] = useState(false)
  const [shortlinkProvider, setShortlinkProvider] = useState<'dub' | 'shortio' | 'kutt' | 'linkdrip'>('dub')
  const [shortlinkApiKey, setShortlinkApiKey] = useState('')
  const [shortlinkDomain, setShortlinkDomain] = useState('')
  const [shortlinkLoading, setShortlinkLoading] = useState(false)

  const [firstComments, setFirstComments] = useState<Record<string, string>>({})
  const [showFirstComment, setShowFirstComment] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const DRAFT_KEY = 'socialflow_draft'
  const TEMPLATES_KEY = 'socialflow_templates'

  const loadTemplates = () => {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    if (raw) {
      try { setTemplates(JSON.parse(raw)) } catch { setTemplates([]) }
    } else {
      setTemplates([])
    }
  }

  const saveTemplate = (name: string) => {
    const entry = { id: Date.now().toString(), name, caption, platforms: selectedPlatforms, mediaFiles, mediaTypes, platformCaptions, postTypes, structuredContent, threadPosts, createdAt: new Date().toISOString() }
    const raw = localStorage.getItem(TEMPLATES_KEY)
    const list = raw ? JSON.parse(raw) : []
    list.unshift(entry)
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list))
    setTemplates(list)
    setNewTemplateName('')
  }

  const deleteTemplate = (id: string) => {
    const list = templates.filter(t => t.id !== id)
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list))
    setTemplates(list)
  }

  const applyTemplate = (t: any) => {
    if (t.caption) reloadEditor(wrapPlainText(t.caption))
    if (t.platforms) setSelectedPlatforms(t.platforms)
    if (t.mediaFiles) setMediaFiles(t.mediaFiles)
    if (t.mediaTypes) setMediaTypes(t.mediaTypes)
    if (t.platformCaptions) setPlatformCaptions(t.platformCaptions)
    if (t.postTypes) setPostTypes(t.postTypes)
    if (t.threadPosts) setThreadPosts(t.threadPosts)
    if (t.structuredContent) setStructuredContent(t.structuredContent)
    setShowTemplateModal(false)
  }

  const { addPost, updatePost, uploadMedia, channels } = useStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const token = await getToken()
      const res = await apiFetch('/api/channels', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 1000 * 60 * 2,
  })

  const connectedAccounts: any[] = accountsData || channels || []

  const platformToAccountIds = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const acc of connectedAccounts) {
      const pid = (acc.platform || '').toLowerCase()
      if (!map[pid]) map[pid] = []
      map[pid].push(acc.id)
    }
    return map
  }, [connectedAccounts])

  const connectedPlatformIds = useMemo(() => new Set(Object.keys(platformToAccountIds)), [platformToAccountIds])

  const SORTED_PLATFORMS = useMemo(() =>
    [...ALL_PLATFORMS].sort((a, b) => ['instagram', 'facebook', 'x', 'linkedin', 'threads', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'reddit', 'wordpress', 'discord', 'telegram', 'tumblr', 'slack', 'gmb'].indexOf(a.id) - ['instagram', 'facebook', 'x', 'linkedin', 'threads', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'reddit', 'wordpress', 'discord', 'telegram', 'tumblr', 'slack', 'gmb'].indexOf(b.id)),
  [])

  const availablePlatforms = useMemo(
    () => SORTED_PLATFORMS.filter(p => connectedPlatformIds.has(p.id)),
    [connectedPlatformIds],
  )

  useEffect(() => {
    setSelectedPlatforms(prev => prev.filter(p => connectedPlatformIds.has(p)))
  }, [connectedPlatformIds])

  const { data: mediaData } = useQuery({
    queryKey: ['media', 'root'],
    queryFn: async () => {
      const token = await getToken()
      const res = await apiFetch('/api/media?folderId=root', { headers: { Authorization: `Bearer ${token}` } })
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const captionParam = params.get('caption')
    if (captionParam) {
      setCaption(wrapPlainText(captionParam))
      window.history.replaceState({}, '', '/compose')
    }
  }, [])

  useEffect(() => {
    const fetchPost = async () => {
      if (editingPostId) {
        const token = await getToken()
        const res = await apiFetch(`/api/posts/${editingPostId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const post = await res.json()
          setCaption(wrapPlainText(post.content || post.caption || ''))
          const platforms = post.platforms || ['instagram']
          setSelectedPlatforms(platforms)
          setActivePreviewPlatform(platforms[0])
          setMediaFiles(post.mediaUrls || post.media || [])
          if (post.structuredContent) setStructuredContent(post.structuredContent)
          if (post.thread || post.threadPosts) setThreadPosts(post.thread || post.threadPosts || [])
          if (post.postTypes) setPostTypes(post.postTypes)
          if (post.platformCaptions) setPlatformCaptions(post.platformCaptions)
          if (post.scheduledAt || post.scheduledTime) {
            setScheduledDate(format(new Date(post.scheduledAt || post.scheduledTime), "yyyy-MM-dd'T'HH:mm"))
            setShowScheduler(true)
          }
          if (post.socialAccountIds) setSelectedAccountIds(post.socialAccountIds)
          if (post.firstComments) setFirstComments(post.firstComments)

        }
      }
    }
    fetchPost()
  }, [editingPostId])

  useEffect(() => {
    if (editingPostId) return
    if (!caption && mediaFiles.length === 0 && threadPosts.length === 0) return
    const draft = { caption, platforms: selectedPlatforms, mediaFiles, mediaTypes, platformCaptions, postTypes, structuredContent, scheduledDate, showScheduler, threadPosts, selectedAccountIds, firstComments }
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch (e) { console.warn('Failed to save draft:', e) }
  }, [caption, selectedPlatforms, mediaFiles, mediaTypes, platformCaptions, postTypes, structuredContent, scheduledDate, showScheduler, threadPosts, editingPostId, selectedAccountIds, firstComments])

  useEffect(() => {
    if (editingPostId) return
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      try {
        const saved = JSON.parse(raw)
        if (saved.caption || saved.mediaFiles?.length > 0) {
          setShowDraftRestore(true)
        }
      } catch (e) { console.warn('Failed to check drafts:', e) }
    }
  }, [editingPostId])

  useEffect(() => {
    if (!caption && mediaFiles.length === 0) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [caption, mediaFiles])

  const restoreDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw)
      if (saved.caption) reloadEditor(wrapPlainText(saved.caption))
      if (saved.platforms) setSelectedPlatforms(saved.platforms)
      if (saved.mediaFiles) setMediaFiles(saved.mediaFiles)
      if (saved.mediaTypes) setMediaTypes(saved.mediaTypes)
      if (saved.platformCaptions) setPlatformCaptions(saved.platformCaptions)
      if (saved.postTypes) setPostTypes(saved.postTypes)
      if (saved.structuredContent) setStructuredContent(saved.structuredContent)
      if (saved.threadPosts) setThreadPosts(saved.threadPosts)
      if (saved.scheduledDate) setScheduledDate(saved.scheduledDate)
      if (saved.showScheduler) setShowScheduler(saved.showScheduler)
      if (saved.selectedAccountIds) setSelectedAccountIds(saved.selectedAccountIds)
      if (saved.firstComments) setFirstComments(saved.firstComments)

    } catch (e) { console.warn('Failed to restore draft:', e) }
    setShowDraftRestore(false)
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setShowDraftRestore(false)
  }

  const getPlatformContentType = (pid: string) => getContentType(pid, postTypes[pid])

  const getStructuredContent = (pid: string) => structuredContent[pid] || {}

  const getFieldValue = (pid: string, fieldKey: string) => getStructuredContent(pid)[fieldKey] || ''

  const setFieldValue = (pid: string, fieldKey: string, value: string) => {
    setStructuredContent(prev => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), [fieldKey]: value }
    }))
  }

  const setContentType = (pid: string, typeId: string) => {
    setPostTypes(prev => ({ ...prev, [pid]: typeId }))
  }

  const getCaptionForPlatform = (pid: string) => {
    if (platformCaptions[pid]) return platformCaptions[pid]
    const ct = getPlatformContentType(pid)
    if (ct && ct.fields.length > 0) {
      const primary = getFieldValue(pid, ct.fields[0].key)
      if (primary) return primary
    }
    return caption
  }

  const setCaptionForPlatform = (pid: string, text: string) => {
    if (pid === 'master') {
      setCaption(text)
    } else {
      const ct = getPlatformContentType(pid)
      if (ct && ct.fields.length > 0) {
        setFieldValue(pid, ct.fields[0].key, text)
      } else {
        setPlatformCaptions(prev => ({ ...prev, [pid]: text }))
      }
    }
  }

  const isCustomized = (pid: string) => brokenOutPlatforms.has(pid) || pid in platformCaptions || pid in structuredContent

  const breakoutPlatform = (pid: string) => {
    const ct = getPlatformContentType(pid)
    if (ct && ct.fields.length > 0) {
      setFieldValue(pid, ct.fields[0].key, caption)
    } else {
      setPlatformCaptions(prev => ({ ...prev, [pid]: caption }))
    }
    setBrokenOutPlatforms(prev => {
      const next = new Set(prev)
      next.add(pid)
      return next
    })
    setActiveEditorPlatform(pid)
  }

  const resetToGlobal = (pid: string) => {
    setPlatformCaptions(prev => {
      const next = { ...prev }
      delete next[pid]
      return next
    })
    setStructuredContent(prev => {
      const next = { ...prev }
      delete next[pid]
      return next
    })
    setBrokenOutPlatforms(prev => {
      const next = new Set(prev)
      next.delete(pid)
      return next
    })
    setActiveEditorPlatform('master')
  }

  const libraryMedia = mediaData?.assets || []

  const generateHashtags = async () => {
    if (!hashtagNiche.trim()) return
    setHashtagLoading(true)
    try {
      const token = await getToken()
      const res = await apiFetch('/api/ai/hashtags', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: hashtagNiche, keywords: [] }),
      })
      if (res.ok) {
        const data = await res.json()
        setHashtagSuggestions(data.hashtags || [])
      }
    } catch (err) {
      console.error('Failed to generate hashtags:', err)
    } finally {
      setHashtagLoading(false)
    }
  }

  const insertHashtag = (tag: string) => {
    const target = activeEditorPlatform === 'master' ? caption : platformCaptions[activeEditorPlatform] || caption
    const newText = target ? `${target} ${tag}` : tag
    setCaptionForPlatform(activeEditorPlatform, newText)
    setHashtagSuggestions(prev => prev.filter(h => h !== tag))
  }

  const handleShortenLinks = async () => {
    setShortlinkLoading(true)
    setShowShortlinkModal(false)
    try {
      const token = await getToken()
      if (!token) return

      const res = await apiFetch('/api/shortlinks/auto', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: caption,
          provider: shortlinkProvider,
          apiKey: shortlinkApiKey,
          domain: shortlinkDomain || undefined
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.shortenedContent) {
          reloadEditor(data.shortenedContent)
        }
      }
    } catch (err) {
      console.error('Failed to shorten links:', err)
    } finally {
      setShortlinkLoading(false)
    }
  }

  const handleMediaUpload = async (file: File): Promise<any> => {
    setIsUploadingMedia(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('No auth token')
      const asset = await uploadMedia(token, file)
      setMediaFiles(prev => [...prev, asset.fileUrl])
      setMediaTypes(prev => ({ ...prev, [asset.fileUrl]: asset.fileType || file.type }))
      queryClient.invalidateQueries({ queryKey: ['media'] })
      return asset
    } catch (error) {
      console.error('Upload failed:', error)
      toastStore.error('Media upload failed')
      return null
    }
  }

  const handleMediaUploads = async (files: File[]) => {
    setIsUploadingMedia(true)
    const results = await Promise.allSettled(files.map(file => handleMediaUpload(file)))
    const successes = results.filter(r => r.status === 'fulfilled' && r.value)
    if (successes.length > 0) setShowMediaLibrary(false)
    setIsUploadingMedia(false)
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      if (fileArray.length === 1) {
        const asset = await handleMediaUpload(fileArray[0])
        if (asset) setShowMediaLibrary(false)
      } else {
        await handleMediaUploads(fileArray)
      }
    }
    e.target.value = ''
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      if (fileArray.length === 1) {
        const asset = await handleMediaUpload(fileArray[0])
        if (asset) setShowMediaLibrary(false)
      } else {
        await handleMediaUploads(fileArray)
      }
    }
  }

  const toggleLibraryMedia = (url: string, fileType?: string) => {
    setMediaFiles(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    )
    if (fileType) {
      setMediaTypes(prev => ({ ...prev, [url]: fileType }))
    }
  }

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]
    )
  }

  useEffect(() => {
    const platformsFromAccounts = new Set<SocialPlatform>()
    for (const id of selectedAccountIds) {
      const acc = connectedAccounts.find(a => a.id === id)
      if (acc) platformsFromAccounts.add(acc.platform.toLowerCase() as SocialPlatform)
    }
    const next = [...platformsFromAccounts]
    setSelectedPlatforms(() => {
      if (next.length > 0 && !next.includes(activePreviewPlatform as SocialPlatform)) {
        setActivePreviewPlatform(next[0])
      }
      return next.length > 0 ? next : ['instagram']
    })
  }, [selectedAccountIds, connectedAccounts])

  const handleRewrite = async () => {
    const targetText = currentEditorCaption
    if (!targetText) return
    setIsRewriting(true)
    try {
      const token = await getToken()
      const res = await apiFetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: stripHtml(targetText), tone: selectedTone, platform: activeEditorPlatform }),
      })
      if (res.ok) {
        const data = await res.json()
        setCaptionForPlatform(activeEditorPlatform, data.rewritten)
      }
    } catch (error) {
      console.error('AI Rewrite failed:', error)
    } finally {
      setIsRewriting(false)
    }
  }

  const [editorReloadKey, setEditorReloadKey] = useState(0)

  const reloadEditor = useCallback((newCaption: string) => {
    setCaption(newCaption)
    setEditorReloadKey(k => k + 1)
  }, [])

  const addThreadPost = useCallback(() => {
    setThreadPosts(prev => [...prev, { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), content: '', delayMinutes: 5 }])
  }, [])

  const removeThreadPost = useCallback((id: string) => {
    setThreadPosts(prev => prev.filter(p => p.id !== id))
  }, [])

  const updateThreadPost = useCallback((id: string, updates: Partial<{ content: string; delayMinutes: number }>) => {
    setThreadPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const removeMedia = (index: number) => {
    const removed = mediaFiles[index]
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    if (removed) setMediaTypes(prev => { const n = { ...prev }; delete n[removed]; return n })
  }

  function guessMediaType(url: string, typesMap?: Record<string, string>): 'image' | 'video' {
    if (typesMap?.[url]) {
      const t = typesMap[url]
      if (t.startsWith('video/')) return 'video'
      if (t.startsWith('image/')) return 'image'
    }
    const ext = url.split('?')[0].split('/').pop()?.toLowerCase() || ''
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].some(e => ext.endsWith(e) || ext === e)) return 'video'
    return 'image'
  }

  const mediaInfo = useMemo(() => mediaFiles.map(url => ({ url, type: guessMediaType(url, mediaTypes) })), [mediaFiles, mediaTypes])

  const allWarnings = useMemo(() => {
    if (selectedPlatforms.length === 0) return {}
    const result: Record<string, string[]> = {}
    for (const pid of selectedPlatforms) {
      const content = getCaptionForPlatform(pid)
      const w = getPlatformWarnings(pid, stripHtml(content), mediaInfo)
      if (w.length > 0) result[pid] = w
    }
    return result
  }, [selectedPlatforms, caption, platformCaptions, mediaInfo])

  const hasWarnings = Object.keys(allWarnings).length > 0

  const activePlatform = activePreviewPlatform && selectedPlatforms.includes(activePreviewPlatform as SocialPlatform)
    ? activePreviewPlatform
    : selectedPlatforms[0] || 'instagram'

  const currentEditorCaption = activeEditorPlatform === 'master' ? caption : getCaptionForPlatform(activeEditorPlatform)

  const handlePost = async (status: 'published' | 'draft' | 'scheduled', force = false) => {
    if (status !== 'draft' && hasWarnings && !showWarnings && !force) {
      setShowWarnings(true)
      return
    }
    if (!stripHtml(caption).trim() && status !== 'draft') return

    setIsSubmitting(true)
    try {
      const token = await getToken()
      if (!token) return
      const time = new Date().toISOString()

      const plainCaption = stripHtml(caption)

      const accountIds: string[] = selectedAccountIds.length > 0
        ? selectedAccountIds
        : []

      const firstCommentsObj = showFirstComment ? firstComments : undefined

      if (editingPostId) {
        await updatePost(token, editingPostId, {
          platforms: selectedPlatforms,
          caption: plainCaption,
          media: mediaFiles,
          socialAccountIds: accountIds,
          scheduledTime: time,
          status,
          structuredContent,
          postTypes,
          thread: threadPosts,
          firstComments: firstCommentsObj,
        })
      } else {
        await addPost(token, {
          platforms: selectedPlatforms,
          caption: plainCaption,
          media: mediaFiles,
          socialAccountIds: accountIds,
          scheduledTime: time,
          status,
          tags: [],
          structuredContent,
          postTypes,
          thread: threadPosts,
          firstComments: firstCommentsObj,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate('/app/calendar')
      clearDraft()
    } catch (error) {
      console.error('Failed to save post:', error)
      toastStore.error('Failed to save post')
    } finally {
      setIsSubmitting(false)
      setShowWarnings(false)
    }
  }

  const clearAll = () => {
    setCaption('')
    setSelectedPlatforms(['instagram'])
    setMediaFiles([])
    setMediaTypes({})
    setPlatformCaptions({})
    setActivePreviewPlatform('instagram')
    setActiveEditorPlatform('master')
    setShowWarnings(false)
    setSelectedAccountIds([])
    setFirstComments({})
    setShowTags(false)
    clearDraft()
  }

  const setFirstCommentForPlatform = (pid: string, text: string) => {
    setFirstComments(prev => ({ ...prev, [pid]: text }))
  }

  const getTagsForPlatform = (pid: string): string => getFieldValue(pid, 'tags')

  const setTagsForPlatform = (pid: string, value: string) => {
    setFieldValue(pid, 'tags', value)
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-24">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Compose Post</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {editingPostId ? 'Editing existing post' : 'Create a new social media post'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="text-muted-foreground hover:text-white gap-1.5 h-8 text-xs" onClick={clearAll}>
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-8 text-xs"
                onClick={() => handlePost('draft')}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Draft
              </Button>
            </div>
          </div>

          {showDraftRestore && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/[0.08] border border-purple-500/15">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-200">You have an unsaved draft.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={clearDraft}>Discard</Button>
                <Button size="sm" className="text-xs" onClick={restoreDraft}>Restore</Button>
              </div>
            </div>
          )}

          <PlatformSelector
            availablePlatforms={availablePlatforms}
            selectedPlatforms={selectedPlatforms}
            navigate={navigate}
            connectedAccounts={connectedAccounts}
            selectedAccountIds={selectedAccountIds}
            toggleAccount={toggleAccount}
          />

          <ContentEditor
            caption={caption}
            setCaption={setCaption}
            selectedPlatforms={selectedPlatforms}
            activeEditorPlatform={activeEditorPlatform}
            setActiveEditorPlatform={setActiveEditorPlatform}
            selectedTone={selectedTone}
            setSelectedTone={setSelectedTone}
            isRewriting={isRewriting}
            handleRewrite={handleRewrite}
            platformCaptions={platformCaptions}
            postTypes={postTypes}
            structuredContent={structuredContent}
            brokenOutPlatforms={brokenOutPlatforms}
            setContentType={setContentType}
            setFieldValue={setFieldValue}
            getFieldValue={getFieldValue}
            getStructuredContent={getStructuredContent}
            getCaptionForPlatform={getCaptionForPlatform}
            setCaptionForPlatform={setCaptionForPlatform}
            isCustomized={isCustomized}
            breakoutPlatform={breakoutPlatform}
            resetToGlobal={resetToGlobal}
            showThreadEditor={showThreadEditor}
            setShowThreadEditor={setShowThreadEditor}
            threadPosts={threadPosts}
            addThreadPost={addThreadPost}
            removeThreadPost={removeThreadPost}
            updateThreadPost={updateThreadPost}
            mediaFiles={mediaFiles}
            mediaTypes={mediaTypes}
            removeMedia={removeMedia}
            isUploadingMedia={isUploadingMedia}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            fileInputRef={fileInputRef}
            onFileChange={onFileChange}
            onDrop={onDrop}
            showMediaLibrary={showMediaLibrary}
            setShowMediaLibrary={setShowMediaLibrary}
            libraryMedia={libraryMedia}
            toggleLibraryMedia={toggleLibraryMedia}
            showHashtagModal={showHashtagModal}
            setShowHashtagModal={setShowHashtagModal}
            hashtagSuggestions={hashtagSuggestions}
            hashtagNiche={hashtagNiche}
            setHashtagNiche={setHashtagNiche}
            hashtagLoading={hashtagLoading}
            generateHashtags={generateHashtags}
            insertHashtag={insertHashtag}
            showShortlinkModal={showShortlinkModal}
            setShowShortlinkModal={setShowShortlinkModal}
            shortlinkProvider={shortlinkProvider}
            setShortlinkProvider={setShortlinkProvider}
            shortlinkApiKey={shortlinkApiKey}
            setShortlinkApiKey={setShortlinkApiKey}
            shortlinkDomain={shortlinkDomain}
            setShortlinkDomain={setShortlinkDomain}
            shortlinkLoading={shortlinkLoading}
            handleShortenLinks={handleShortenLinks}
            showTemplateModal={showTemplateModal}
            setShowTemplateModal={setShowTemplateModal}
            templates={templates}
            loadTemplates={loadTemplates}
            saveTemplate={saveTemplate}
            deleteTemplate={deleteTemplate}
            applyTemplate={applyTemplate}
            newTemplateName={newTemplateName}
            setNewTemplateName={setNewTemplateName}
            editorReloadKey={editorReloadKey}
          />

          {/* First Comment Section */}
          {selectedPlatforms.length > 0 && (
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setShowFirstComment(!showFirstComment)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">First Comment</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{showFirstComment ? 'Hide' : 'Add'}</span>
              </button>
              {showFirstComment && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-muted-foreground">Post an automatic first comment on each platform</p>
                  {selectedPlatforms.map(pid => {
                    const pl = ALL_PLATFORMS.find(x => x.id === pid)
                    if (!pl) return null
                    const Icon = pl.icon
                    return (
                      <div key={pid} className="flex items-start gap-3">
                        <Icon className={cn("w-4 h-4 mt-2 shrink-0", pl.color)} />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white mb-1">{pl.label} comment</p>
                          <textarea
                            value={firstComments[pid] || ''}
                            onChange={e => setFirstCommentForPlatform(pid, e.target.value)}
                            placeholder={`First comment for ${pl.label}...`}
                            rows={2}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-purple-500/40 resize-none transition-colors"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tags Section */}
          {selectedPlatforms.length > 0 && (
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setShowTags(!showTags)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">Tag People</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{showTags ? 'Hide' : 'Add'}</span>
              </button>
              {showTags && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-muted-foreground">Tag accounts in your post (comma-separated usernames)</p>
                  {selectedPlatforms.map(pid => {
                    const pl = ALL_PLATFORMS.find(x => x.id === pid)
                    if (!pl) return null
                    const Icon = pl.icon
                    return (
                      <div key={pid} className="flex items-start gap-3">
                        <Icon className={cn("w-4 h-4 mt-2 shrink-0", pl.color)} />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white mb-1">{pl.label}</p>
                          <input
                            value={getTagsForPlatform(pid)}
                            onChange={e => setTagsForPlatform(pid, e.target.value)}
                            placeholder="username1, username2, username3"
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-purple-500/40 transition-colors"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}


        </div>

        {/* Right column */}
        <div className="xl:sticky xl:top-6 self-start space-y-5">
          <PreviewPanel
            selectedPlatforms={selectedPlatforms}
            activePreviewPlatform={activePreviewPlatform}
            setActivePreviewPlatform={setActivePreviewPlatform}
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
            activePlatform={activePlatform}
            getCaptionForPlatform={getCaptionForPlatform}
            mediaFiles={mediaFiles}
            mediaTypes={mediaTypes}
            mediaInfo={mediaInfo}
            getStructuredContent={getStructuredContent}
            postTypes={postTypes}
            getDefaultContentType={getDefaultContentType}
            guessMediaType={guessMediaType}
            firstComments={firstComments}
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] bg-[#0F1117]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedPlatforms.length > 0 ? (
              <span>
                Publishing to <span className="text-white font-medium">{selectedPlatforms.length}</span> platform{selectedPlatforms.length > 1 ? 's' : ''}
                {selectedAccountIds.length > 0 && (
                  <> · <span className="text-white font-medium">{selectedAccountIds.length}</span> account{selectedAccountIds.length > 1 ? 's' : ''}</>
                )}

              </span>
            ) : (
              <span>No platforms selected</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn("gap-2", showScheduler && "border-purple-500/40 text-purple-400")}
              onClick={() => setShowScheduler(!showScheduler)}
            >
              <Clock className="w-4 h-4" />
              Schedule
            </Button>
            <Button
              size="sm"
              className="gap-2 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20"
              onClick={() => handlePost('published')}
              disabled={isSubmitting || !caption || selectedPlatforms.length === 0}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post Now
            </Button>
          </div>
        </div>
      </div>

      {/* Scheduler panel - floats above bottom bar */}
      <SchedulerPanel
        showScheduler={showScheduler}
        scheduledDate={scheduledDate}
        setScheduledDate={setScheduledDate}
        isSubmitting={isSubmitting}
        caption={caption}
        handlePost={handlePost}
        setShowScheduler={setShowScheduler}
      />

      {/* Warning modal */}
      <WarningModal
        showWarnings={showWarnings}
        setShowWarnings={setShowWarnings}
        allWarnings={allWarnings}
        hasWarnings={hasWarnings}
        handlePost={handlePost}
      />
    </div>
  )
}
