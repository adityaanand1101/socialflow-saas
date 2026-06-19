import { Image as ImageIcon, User, Heart, MessageCircle, Repeat2, Bookmark, Send, ThumbsUp, ThumbsDown, Share2, ArrowUp, ArrowDown, Play, Ellipsis, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreviewProps {
  caption: string
  mediaUrls: string[]
  mediaTypes: Record<string, string>
  mediaInfo: { url: string; type: 'image' | 'video' }[]
  isMobile: boolean
  getRatioClass: () => string
  structuredContent?: Record<string, string>
  contentTypeId?: string
}

function PlatformBadge({ label, color }: { label: string; color: string }) {
  return (
    <div className={cn("px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-center", color)}>
      {label} Preview
    </div>
  )
}

function MediaBlock({ mediaUrls, mediaInfo, getRatioClass }: { mediaUrls: string[]; mediaInfo: PreviewProps['mediaInfo']; getRatioClass: () => string }) {
  if (mediaUrls.length === 0) return null
  const first = mediaInfo[0]
  const isVid = first?.type === 'video'
  return (
    <div className={cn("w-full overflow-hidden bg-black/5", getRatioClass())}>
      {isVid ? (
        <video src={mediaUrls[0]} className="w-full h-full object-cover" muted controls />
      ) : (
        <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
      )}
    </div>
  )
}

function Avatar({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-6 h-6'
  return (
    <div className={cn(dim, "rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shrink-0")}>
      <User className={cn("text-white", size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5')} />
    </div>
  )
}

// ───── Instagram ─────
function InstagramPreview({ caption, mediaUrls, mediaInfo, isMobile, getRatioClass, structuredContent, contentTypeId }: PreviewProps) {
  const text = structuredContent?.caption || caption || ''
  const ct = contentTypeId || 'feed'

  // Reel — vertical full-screen 9:16 layout
  if (ct === 'reel') {
    return (
      <div className={cn("rounded-xl overflow-hidden shadow-xl", isMobile ? "bg-black" : "max-w-[280px]")}>
        <PlatformBadge label="Instagram Reel" color="bg-pink-500 text-white" />
        <div className="flex flex-col bg-black text-white" style={{ height: isMobile ? 500 : 480 }}>
          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar size="sm" />
            <span className="text-[11px] font-bold flex-1">your_account</span>
            <span className="text-[18px]">⋯</span>
          </div>
          <div className="flex-1 flex items-center justify-center bg-gray-900 relative">
            {mediaUrls[0] ? (
              mediaInfo[0]?.type === 'video' ? (
                <video src={mediaUrls[0]} className="w-full h-full object-cover" muted controls />
              ) : (
                <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Play className="w-12 h-12" />
                <span className="text-[9px]">Video placeholder</span>
              </div>
            )}
            <div className="absolute bottom-4 right-2 flex flex-col items-center gap-3 text-white">
              <Heart className="w-6 h-6" />
              <MessageCircle className="w-6 h-6" />
              <Send className="w-6 h-6" />
              <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold">G</div>
            </div>
          </div>
          <div className="p-3 space-y-1">
            <p className="text-[10px] leading-tight"><span className="font-bold mr-1">your_account</span>{text || <span className="text-gray-400">Add a caption...</span>}</p>
            <p className="text-[8px] text-gray-400">0 likes · Reel</p>
          </div>
        </div>
      </div>
    )
  }

  // Story — 9:16 full-bleed
  if (ct === 'story') {
    return (
      <div className={cn("rounded-xl overflow-hidden shadow-xl", isMobile ? "bg-black" : "max-w-[280px]")}>
        <PlatformBadge label="Instagram Story" color="bg-pink-500 text-white" />
        <div className="relative bg-black" style={{ height: isMobile ? 500 : 480 }}>
          {mediaUrls[0] ? (
            mediaInfo[0]?.type === 'video' ? (
              <video src={mediaUrls[0]} className="w-full h-full object-cover" muted controls />
            ) : (
              <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-white/60" />
            </div>
          )}
          <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
            <Avatar size="sm" />
            <span className="text-[10px] font-bold text-white">your_account</span>
            <span className="text-[8px] text-white/60 ml-auto">1m</span>
          </div>
          {text && (
            <div className="absolute bottom-8 left-0 right-0 px-4 text-center">
              <span className="text-xs text-white drop-shadow-lg">{text}</span>
            </div>
          )}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-1">
            <div className="flex-1 h-0.5 rounded-full bg-white/80" />
            <div className="flex-1 h-0.5 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    )
  }

  // Feed / Carousel — default layout
  const isCarousel = ct === 'carousel'
  return (
    <div className={cn("rounded-xl overflow-hidden shadow-xl", isMobile ? "bg-black" : "")}>
      <PlatformBadge label={isCarousel ? "Instagram Carousel" : "Instagram"} color="bg-pink-500 text-white" />
      {isMobile ? (
        <div className="flex flex-col h-[500px] bg-white text-black">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Avatar size="sm" />
            <span className="text-[11px] font-bold flex-1">your_account</span>
            <span className="text-[10px] text-blue-500 font-bold">Follow</span>
          </div>
          <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
          {!mediaUrls[0] && (
            <div className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-gray-300" />
            </div>
          )}
          <div className="p-3 space-y-1">
            <div className="flex gap-3 text-sm">❤️ 💬 📤</div>
            <p className="text-[10px] font-bold">0 likes</p>
            <p className="text-[10px] leading-tight"><span className="font-bold mr-1">your_account</span>{text || <span className="text-gray-400">Caption will appear here</span>}</p>
            {isCarousel && <p className="text-[8px] text-gray-400">← 1/{Math.max(mediaUrls.length, 3)} →</p>}
            <p className="text-[8px] text-gray-400 uppercase">Just now</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-100">
            <Avatar size="md" />
            <div><p className="text-xs font-bold text-black">your_account</p><p className="text-[9px] text-gray-400">Instagram</p></div>
          </div>
          <div className="bg-white text-black">
            <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
            {!mediaUrls[0] && <div className="h-48 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-300" /></div>}
            <div className="p-3 space-y-1">
              <div className="flex gap-3 text-base">❤️ 💬 📤</div>
              <p className="text-[11px] font-bold text-black">0 likes</p>
              <p className="text-xs leading-relaxed text-black"><span className="font-bold mr-1">your_account</span>{text || <span className="text-gray-400">Caption will appear here</span>}</p>
              {isCarousel && <p className="text-[9px] text-gray-400">← 1/{Math.max(mediaUrls.length, 3)} →</p>}
              <p className="text-[9px] text-gray-400 uppercase">JUST NOW</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ───── X / Twitter ─────
function XPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent, contentTypeId }: PreviewProps) {
  const text = structuredContent?.text || caption || ''
  const isPoll = contentTypeId === 'poll'
  const pollOptions = isPoll ? (structuredContent?.poll_options || '').split('\n').filter(Boolean).slice(0, 4) : []
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="X (Twitter)" color="bg-black text-white" />
      <div className="bg-black text-white p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar size="md" />
          <div>
            <p className="text-xs font-bold text-white">Your Name</p>
            <p className="text-[9px] text-gray-400">@yourhandle · 1m</p>
          </div>
          <div className="ml-auto"><Repeat2 className="w-4 h-4 text-gray-500" /></div>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2 text-white">{text || <span className="text-gray-500">Your post content...</span>}</p>
        {isPoll && pollOptions.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="border border-gray-700 rounded-full px-3 py-1.5 text-[11px] text-gray-300">{opt}</div>
            ))}
            <p className="text-[9px] text-gray-500">{structuredContent?.poll_duration_minutes || '1440'} min · 0 votes</p>
          </div>
        )}
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && !isPoll && null}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />0</span>
          <span className="flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" />0</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />0</span>
          <span className="flex items-center gap-1"><BarChart3Icon className="w-3.5 h-3.5" />0</span>
          <Share2 className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}

function BarChart3Icon({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M18 20V10M12 20V4M6 20v-6"/></svg> }

// ───── LinkedIn ─────
function LinkedInPreview({ caption, mediaUrls, mediaInfo, isMobile, getRatioClass, structuredContent, contentTypeId }: PreviewProps) {
  const ct = contentTypeId || 'text'
  const isArticle = ct === 'article'
  const isPoll = ct === 'poll'
  const isMultiImage = ct === 'multi_image'
  const isDocument = ct === 'document'
  const title = isArticle ? (structuredContent?.title || '') : ''
  const description = isArticle ? (structuredContent?.description || '') : ''

  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label={isPoll ? "LinkedIn Poll" : isArticle ? "LinkedIn Article" : isDocument ? "LinkedIn Document" : "LinkedIn"} color="bg-blue-600 text-white" />
      <div className="bg-white text-black">
        <div className="p-3 flex items-center gap-2">
          <Avatar size="md" />
          <div className="flex-1">
            <p className="text-xs font-bold text-black">Your Name</p>
            <p className="text-[9px] text-gray-500">Your Title · 1st</p>
            <p className="text-[8px] text-gray-400">1m ago · 🌍</p>
          </div>
          <div className="text-[18px] text-gray-300">⋯</div>
        </div>

        {isArticle ? (
          <div className="px-3 pb-2">
            <p className="text-sm font-bold text-black mb-1">{title || 'Article Title'}</p>
            <p className={cn("whitespace-pre-wrap leading-relaxed text-gray-700", isMobile ? "text-[11px]" : "text-xs")}>{description || caption || ''}</p>
          </div>
        ) : isPoll ? (
          <div className="px-3 pb-2">
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-black mb-2">{caption || 'What do you think?'}</p>
            <div className="space-y-1.5">
              {(structuredContent?.poll_options || '').split('\n').filter(Boolean).slice(0, 4).map((opt, i) => (
                <div key={i} className="border border-gray-300 rounded px-3 py-2 text-[11px] text-gray-700">{opt}</div>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 mt-1">0 votes · {(structuredContent?.poll_duration_minutes || '7')} days left</p>
          </div>
        ) : isDocument ? (
          <div className="px-3 pb-2">
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-black mb-2">{caption || 'Check out this document'}</p>
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
              <div className="w-10 h-12 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-[9px] font-bold">PDF</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-black truncate">{structuredContent?.document_url?.split('/').pop() || 'document.pdf'}</p>
                <p className="text-[9px] text-gray-400">Added a document</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={cn("px-3", isMobile ? "text-[11px]" : "text-xs")}>
            <p className="whitespace-pre-wrap leading-relaxed text-black">{caption || <span className="text-gray-400">Share your professional updates...</span>}</p>
          </div>
        )}

        {isMultiImage && mediaUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-0.5 mx-0 mb-0">
            {mediaUrls.slice(0, 4).map((url, i) => (
              <div key={i} className="aspect-square overflow-hidden bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        )}
        {!mediaUrls[0] && !isPoll && null}

        <div className={cn("flex items-center justify-between px-3 py-2 border-t border-gray-100", isMobile ? "text-[9px]" : "text-[10px]")}>
          <span className="flex items-center gap-1 text-gray-500"><ThumbsUp className={isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} /> Like</span>
          <span className="flex items-center gap-1 text-gray-500"><MessageCircle className={isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} /> Comment</span>
          <span className="flex items-center gap-1 text-gray-500"><Repeat2 className={isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} /> Repost</span>
          <span className="flex items-center gap-1 text-gray-500"><Send className={isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} /> Send</span>
        </div>
      </div>
    </div>
  )
}

// ───── Facebook ─────
function FacebookPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent, contentTypeId }: PreviewProps) {
  const message = structuredContent?.message || caption || ''
  const url = structuredContent?.url || ''
  const isLink = contentTypeId === 'link'
  const isReels = contentTypeId === 'reels'

  // Reels — vertical 9:16
  if (isReels) {
    return (
      <div className="rounded-xl overflow-hidden shadow-xl max-w-[280px]">
        <PlatformBadge label="Facebook Reels" color="bg-blue-500 text-white" />
        <div className="flex flex-col bg-black text-white" style={{ height: 420 }}>
          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar size="sm" />
            <span className="text-[11px] font-bold flex-1">Your Name</span>
            <Ellipsis className="w-4 h-4" />
          </div>
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            {mediaUrls[0] ? (
              mediaInfo[0]?.type === 'video' ? (
                <video src={mediaUrls[0]} className="w-full h-full object-cover" muted controls />
              ) : (
                <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
              )
            ) : (
              <Play className="w-12 h-12 text-gray-500" />
            )}
            <div className="absolute bottom-4 right-2 flex flex-col items-center gap-3">
              <ThumbsUp className="w-5 h-5" />
              <MessageCircle className="w-5 h-5" />
              <Share2 className="w-5 h-5" />
            </div>
          </div>
          <div className="p-2 text-[10px]">{message || 'Add a reel caption...'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label={isLink ? "Facebook Link" : "Facebook"} color="bg-blue-500 text-white" />
      <div className="bg-white text-black">
        <div className="p-3 flex items-center gap-2">
          <Avatar size="md" />
          <div className="flex-1">
            <p className="text-xs font-bold text-black">Your Name</p>
            <p className="text-[9px] text-gray-500">1m ago · 🌍</p>
          </div>
          <Ellipsis className="w-4 h-4 text-gray-400" />
        </div>
        <div className="px-3 pb-2 text-xs whitespace-pre-wrap leading-relaxed text-black">{message || <span className="text-gray-400">What's on your mind?</span>}</div>
        {isLink && url && (
          <div className="mx-3 mb-2 border border-gray-200 rounded-lg overflow-hidden">
            <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={() => 'aspect-[1.91/1]'} />
            <div className="p-2 border-t border-gray-200">
              <p className="text-[9px] text-gray-500 uppercase truncate">{url.replace(/^https?:\/\//, '').split('/')[0]}</p>
              <p className="text-xs font-bold text-black truncate">{structuredContent?.title || ''}</p>
              <p className="text-[10px] text-gray-500 line-clamp-2">{structuredContent?.description || ''}</p>
            </div>
          </div>
        )}
        {!isLink && <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />}
        {!mediaUrls[0] && !isLink && null}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> Like</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> Comment</span>
          <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> Share</span>
        </div>
      </div>
    </div>
  )
}

// ───── Threads ─────
function ThreadsPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent, contentTypeId }: PreviewProps) {
  const text = structuredContent?.text || caption || ''
  const isCarousel = contentTypeId === 'carousel'
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label={isCarousel ? "Threads Carousel" : "Threads"} color="bg-black text-white" />
      <div className="bg-black text-white p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar size="sm" />
          <span className="text-xs font-bold text-white">your_name</span>
          <span className="text-[9px] text-gray-500">1m</span>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2 text-white">{text || <span className="text-gray-500">Share your thoughts...</span>}</p>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && null}
        {isCarousel && <p className="text-[9px] text-gray-500 mt-1">← 1/{Math.max(mediaUrls.length, 3)} →</p>}
        <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><Heart className="w-4 h-4" />0</span>
          <MessageCircle className="w-4 h-4" />
          <Repeat2 className="w-4 h-4" />
          <Send className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}

// ───── YouTube ─────
function YouTubePreview({ caption, mediaUrls, mediaInfo, isMobile, structuredContent, contentTypeId }: PreviewProps) {
  const ct = contentTypeId || 'longform'
  const firstMedia = mediaInfo[0]
  const title = structuredContent?.title || caption?.split('\n')[0] || ''
  const description = structuredContent?.description || caption?.split('\n').slice(1).join('\n') || ''

  // Shorts — vertical 9:16 layout
  if (ct === 'shorts') {
    return (
      <div className={cn("rounded-xl overflow-hidden shadow-xl", isMobile ? "bg-black" : "max-w-[240px]")}>
        <PlatformBadge label="YouTube Shorts" color="bg-red-600 text-white" />
        <div className="flex flex-col bg-black text-white" style={{ height: isMobile ? 500 : 420 }}>
          <div className="flex-1 flex items-center justify-center bg-gray-900 relative">
            {mediaUrls[0] ? (
              firstMedia?.type === 'video' ? (
                <video src={mediaUrls[0]} className="w-full h-full object-cover" muted controls />
              ) : (
                <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Play className="w-12 h-12" />
                <span className="text-[9px]">Shorts placeholder</span>
              </div>
            )}
            <div className="absolute bottom-4 right-2 flex flex-col items-center gap-3 text-white">
              <ThumbsUp className="w-5 h-5" />
              <span className="text-[9px] -mt-2">0</span>
              <ThumbsDown className="w-5 h-5" />
              <MessageCircle className="w-5 h-5" />
              <span className="text-[9px] -mt-2">0</span>
              <Share2 className="w-5 h-5" />
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px]">G</div>
            </div>
          </div>
          <div className="p-2 space-y-0.5">
            <p className="text-[11px] font-bold leading-tight">{title || 'Shorts title'}</p>
            <p className="text-[9px] text-gray-400">Channel Name · 0 views</p>
          </div>
        </div>
      </div>
    )
  }

  // Community Post
  if (ct === 'community_post') {
    return (
      <div className="rounded-xl overflow-hidden shadow-xl">
        <PlatformBadge label="YouTube Community" color="bg-red-600 text-white" />
        <div className="bg-white text-black p-3">
          <div className="flex items-center gap-2 mb-2">
            <Avatar size="md" />
            <div>
              <p className="text-xs font-bold text-black">Channel Name</p>
              <p className="text-[9px] text-gray-500">1m ago · 0 views</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-black mb-2">{structuredContent?.body || caption || 'Community update...'}</p>
          {mediaUrls[0] && (
            <div className="rounded-lg overflow-hidden mb-2">
              <img src={mediaUrls[0]} alt="" className="w-full aspect-video object-cover" />
            </div>
          )}
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <ThumbsUp className="w-3.5 h-3.5" />0
            <MessageCircle className="w-3.5 h-3.5" />0
          </div>
        </div>
      </div>
    )
  }

  // Community Poll
  if (ct === 'community_poll') {
    const pollOptions = (structuredContent?.poll_options || '').split('\n').filter(Boolean).slice(0, 4)
    return (
      <div className="rounded-xl overflow-hidden shadow-xl">
        <PlatformBadge label="YouTube Community Poll" color="bg-red-600 text-white" />
        <div className="bg-white text-black p-3">
          <div className="flex items-center gap-2 mb-2">
            <Avatar size="md" />
            <div>
              <p className="text-xs font-bold text-black">Channel Name</p>
              <p className="text-[9px] text-gray-500">1m ago</p>
            </div>
          </div>
          <p className="text-xs font-bold mb-2 text-black">{structuredContent?.poll_question || 'Poll question'}</p>
          {pollOptions.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="border border-gray-300 rounded-lg px-3 py-2 text-[11px] text-gray-700">{opt}</div>
              ))}
              <p className="text-[9px] text-gray-400">0 votes</p>
            </div>
          )}
          {mediaUrls[0] && <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={() => 'aspect-video'} />}
        </div>
      </div>
    )
  }

  // Longform (default)
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="YouTube" color="bg-red-600 text-white" />
      <div className="bg-white text-black">
        {firstMedia ? (
          firstMedia.type === 'video' ? (
            <video src={mediaUrls[0]} className="w-full aspect-video object-cover bg-black" muted controls />
          ) : (
            <img src={mediaUrls[0]} alt="" className="w-full aspect-video object-cover" />
          )
        ) : (
          <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
            <Play className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="p-3">
          <p className={cn("font-bold line-clamp-2 text-black", isMobile ? "text-xs" : "text-sm")}>{title.slice(0, 80) || <span className="text-gray-400">Video title</span>}</p>
          {description && <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{description}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            <Avatar size="sm" />
            <div className="flex-1">
              <p className="text-[10px] font-medium text-gray-600">Channel Name</p>
              <p className="text-[9px] text-gray-400">0 views · 1m ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
            <ThumbsUp className="w-3.5 h-3.5" />
            <ThumbsDown className="w-3.5 h-3.5" />
            <Share2 className="w-3.5 h-3.5" />
            <Bookmark className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ───── Reddit ─────
function RedditPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent }: PreviewProps) {
  const title = structuredContent?.title || caption?.split('\n')[0] || ''
  const body = structuredContent?.body || caption?.split('\n').slice(1).join('\n') || ''
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Reddit" color="bg-orange-500 text-white" />
      <div className="bg-white">
        <div className="flex">
          <div className="flex flex-col items-center gap-1 p-2 bg-gray-50 text-[10px] text-gray-500 font-bold">
            <ArrowUp className="w-4 h-4" />
            <span>0</span>
            <ArrowDown className="w-4 h-4" />
          </div>
          <div className="flex-1 p-3">
            <div className="flex items-center gap-1 text-[9px] text-gray-500 mb-1">
              <span className="font-bold text-blue-500">r/YourSubreddit</span>
              <span>· Posted by u/yourname 1m ago</span>
            </div>
            <p className="text-sm font-bold text-black mb-1">{title || <span className="text-gray-400 font-normal">Post title</span>}</p>
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-black">{body || ''}</p>
            <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
            {!mediaUrls[0] && null}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />0 Comments</span>
              <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" />Share</span>
              <Bookmark className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ───── Pinterest ─────
function PinterestPreview({ caption, mediaUrls, mediaInfo, structuredContent, contentTypeId }: PreviewProps) {
  const title = structuredContent?.title || caption?.slice(0, 60) || ''
  const link = structuredContent?.link || ''
  const isVideo = contentTypeId === 'video_pin'
  const isCarousel = contentTypeId === 'carousel_pin'
  return (
    <div className="rounded-xl overflow-hidden shadow-xl mx-auto" style={{ maxWidth: 236 }}>
      <PlatformBadge label={isVideo ? "Pinterest Video Pin" : isCarousel ? "Pinterest Carousel" : "Pinterest"} color="bg-red-600 text-white" />
      <div className="bg-white">
        {isCarousel && mediaUrls.length > 0 ? (
          <div className="relative">
            <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
              {mediaUrls.slice(0, 5).map((url, i) => (
                <div key={i} className="min-w-[80px] aspect-[2/3] flex-shrink-0 bg-gray-100">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded">
              {mediaUrls.length > 5 ? `1/5+` : `1/${mediaUrls.length}`}
            </div>
          </div>
        ) : isVideo && mediaUrls[0] ? (
          <div className="aspect-[2/3] bg-black flex items-center justify-center relative">
            {mediaInfo[0]?.type === 'video' ? (
              <video src={mediaUrls[0]} className="w-full h-full object-cover" muted controls />
            ) : (
              <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
        ) : (
          <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={() => 'aspect-[2/3]'} />
        )}
        {!mediaUrls[0] && <div className="aspect-[2/3] bg-gray-100 flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-300" /></div>}
        <div className="p-2">
          <p className="text-[11px] font-bold line-clamp-2 text-black">{title || <span className="text-gray-400 font-normal">Pin title</span>}</p>
          {link && <p className="text-[9px] text-gray-400 mt-0.5 truncate">{link}</p>}
          <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500">
            <Avatar size="sm" />
            <span>username</span>
          </div>
          <div className="mt-2 w-full py-1.5 rounded-full bg-red-500 text-white text-[9px] font-bold text-center">Save</div>
        </div>
      </div>
    </div>
  )
}

// ───── WordPress ─────
function WordPressPreview({ caption, mediaUrls, mediaInfo, structuredContent }: PreviewProps) {
  const title = structuredContent?.title || caption?.split('\n')[0] || ''
  const body = structuredContent?.body || caption?.split('\n').slice(1).join('\n') || ''
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="WordPress" color="bg-blue-500 text-white" />
      <div className="bg-white text-black">
        {mediaUrls[0] && <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={() => 'aspect-[2/1]'} />}
        <div className="p-4">
          <p className="text-base font-bold text-black mb-1">{title || <span className="text-gray-400 font-normal">Post Title</span>}</p>
          <p className="text-[11px] text-gray-500 mb-2">January 1, 2025 · Category</p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-black">{body || <span className="text-gray-400">Start writing your blog post...</span>}</p>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500">
            <MessageCircle className="w-3.5 h-3.5" />0 Comments
          </div>
        </div>
      </div>
    </div>
  )
}

// ───── Discord ─────
function DiscordPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent, contentTypeId }: PreviewProps) {
  const content = structuredContent?.content || caption || ''
  const isEmbed = contentTypeId === 'embed'
  const embedTitle = structuredContent?.embed_title || ''
  const embedDesc = structuredContent?.embed_description || ''
  const embedUrl = structuredContent?.embed_url || ''
  const embedColor = structuredContent?.embed_color || '#5865F2'
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Discord" color="bg-indigo-500 text-white" />
      <div className="bg-[#313338] p-3">
        <div className="flex gap-2">
          <Avatar size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400">YourName</span>
              <span className="text-[9px] text-gray-400">Today at 12:00 PM</span>
            </div>
            <p className="text-xs leading-relaxed mt-0.5 whitespace-pre-wrap text-white">{content || <span className="text-gray-500">Type your message...</span>}</p>
            {isEmbed && (embedTitle || embedDesc) && (
              <div className="mt-2 border-l-4 rounded overflow-hidden" style={{ borderColor: embedColor, backgroundColor: '#2b2d31' }}>
                <div className="p-2.5">
                  {embedTitle && <p className="text-sm font-bold text-[#00a8fc]">{embedTitle}</p>}
                  {embedDesc && <p className="text-[11px] text-gray-300 mt-1">{embedDesc}</p>}
                  {embedUrl && <p className="text-[9px] text-[#00a8fc] mt-1 truncate">{embedUrl}</p>}
                </div>
              </div>
            )}
            <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ───── Telegram ─────
function TelegramPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent, contentTypeId }: PreviewProps) {
  const text = structuredContent?.text || structuredContent?.caption || caption || ''
  const isPoll = contentTypeId === 'poll'
  const pollOptions = (structuredContent?.poll_options || '').split('\n').filter(Boolean)
  const pollQuestion = structuredContent?.question || ''
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label={isPoll ? "Telegram Poll" : "Telegram"} color="bg-blue-500 text-white" />
      <div className="bg-[#17212b] p-3">
        <div className="flex items-center gap-2 mb-1">
          <Avatar size="sm" />
          <span className="text-xs font-bold text-[#2b9ce5]">Your Name</span>
          <span className="text-[9px] text-gray-500 ml-auto">12:00</span>
        </div>
        {isPoll ? (
          <div>
            <p className="text-xs font-bold text-white mb-2">{pollQuestion || 'Poll Question'}</p>
            <div className="space-y-1">
              {pollOptions.map((opt, i) => (
                <div key={i} className="border border-[#2b5278] rounded px-2 py-1.5 text-[11px] text-gray-300">{opt}</div>
              ))}
            </div>
            <p className="text-[9px] text-gray-500 mt-1">Anonymous poll · {pollOptions.length} options</p>
          </div>
        ) : (
          <>
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-white">{text || <span className="text-gray-500">Write a message...</span>}</p>
            <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
            {!mediaUrls[0] && null}
          </>
        )}
      </div>
    </div>
  )
}

// ───── Slack ─────
function SlackPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent }: PreviewProps) {
  const text = structuredContent?.text || caption || ''
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Slack" color="bg-green-600 text-white" />
      <div className="bg-white p-3 flex gap-2">
        <Avatar size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-black">Your Name</span>
            <span className="text-[9px] text-gray-400">12:00 PM</span>
            <span className="text-[9px] text-gray-400 ml-auto">#channel</span>
          </div>
          <p className="text-xs leading-relaxed mt-0.5 whitespace-pre-wrap text-black">{text || <span className="text-gray-400">Write a message...</span>}</p>
          <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
          {!mediaUrls[0] && null}
          <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400">
            <span className="flex items-center gap-0.5">😀 +2</span>
            <span className="flex items-center gap-0.5">👍 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ───── Bluesky ─────
function BlueskyPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent }: PreviewProps) {
  const text = structuredContent?.text || caption || ''
  const altText = structuredContent?.alt_text || ''
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Bluesky" color="bg-blue-500 text-white" />
      <div className="bg-white text-black p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Avatar size="md" />
          <div>
            <p className="text-xs font-bold text-black">Your Name</p>
            <p className="text-[9px] text-gray-500">@yourhandle.bsky.social</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2 text-black">{text || <span className="text-gray-400">What's up?</span>}</p>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && null}
        {altText && <p className="text-[9px] text-gray-400 italic mt-1">ALT: {altText}</p>}
        <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />0</span>
          <span className="flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" />0</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />0</span>
        </div>
      </div>
    </div>
  )
}

// ───── Mastodon ─────
function MastodonPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent, contentTypeId }: PreviewProps) {
  const status = structuredContent?.text || caption || ''
  const spoilerText = structuredContent?.content_warning || ''
  const isPoll = contentTypeId === 'poll'
  const pollOptions = (structuredContent?.poll_options || '').split('\n').filter(Boolean).slice(0, 4)
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label={isPoll ? "Mastodon Poll" : "Mastodon"} color="bg-purple-600 text-white" />
      <div className="bg-[#191b22] p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Avatar size="md" />
          <div>
            <p className="text-xs font-bold text-white">Your Name</p>
            <p className="text-[9px] text-gray-500">@yourname@mastodon.social</p>
          </div>
        </div>
        {spoilerText && (
          <div className="mb-2 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-[11px] text-yellow-200 font-medium">
            CW: {spoilerText}
          </div>
        )}
        <p className={cn("text-xs leading-relaxed whitespace-pre-wrap mb-2 text-white", spoilerText ? "blur-sm" : "")}>{status || <span className="text-gray-500">Write a post...</span>}</p>
        {isPoll && pollOptions.length > 0 ? (
          <div className="space-y-1 mb-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="border border-gray-600 rounded px-2 py-1.5 text-[11px] text-gray-300">{opt}</div>
            ))}
            <p className="text-[9px] text-gray-500 mt-0.5">{pollOptions.length} options</p>
          </div>
        ) : (
          <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        )}
        {!mediaUrls[0] && !isPoll && null}
        <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />0</span>
          <span className="flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" />0</span>
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />0</span>
        </div>
      </div>
    </div>
  )
}
function Star({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" /></svg> }

// ───── Tumblr ─────
function TumblrPreview({ caption, structuredContent }: PreviewProps) {
  const title = structuredContent?.title || caption?.split('\n')[0] || 'Post Title'
  const body = structuredContent?.body || caption?.split('\n').slice(1).join('\n') || ''
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Tumblr" color="bg-blue-900 text-white" />
      <div className="bg-[#001935] p-4">
        <p className="text-lg font-bold text-white mb-1">{title}</p>
        <div className="flex items-center gap-2 text-[9px] text-gray-400 mb-3">
          <span>yourblog</span>
          <span>·</span>
          <span>1m ago</span>
          <span>·</span>
          <span>42 notes</span>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-white">{body || <span className="text-gray-500">Write your post...</span>}</p>
        <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400">
          <Heart className="w-3.5 h-3.5" />
          <Repeat2 className="w-3.5 h-3.5" />
          <MessageCircle className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}

// ───── Google My Business ─────
function GMBPreview({ caption, mediaUrls, mediaInfo, getRatioClass, structuredContent, contentTypeId }: PreviewProps) {
  const ct = contentTypeId || 'update'
  const isOffer = ct === 'offer'
  const isEvent = ct === 'event'
  const isAlert = ct === 'alert'
  const summary = structuredContent?.summary || caption || ''
  const cta = structuredContent?.call_to_action || ''
  const endDate = structuredContent?.end_date || ''
  return (
    <div className="rounded-xl overflow-hidden shadow-xl mx-auto" style={{ maxWidth: 380 }}>
      <PlatformBadge label={isOffer ? 'GMB Offer' : isEvent ? 'GMB Event' : isAlert ? 'GMB Alert' : 'Google My Business'} color="bg-blue-600 text-white" />
      <div className="bg-white text-black">
        <div className="p-3 flex items-center gap-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">B</div>
          <div>
            <p className="text-xs font-bold text-black">Your Business</p>
            <p className="text-[9px] text-gray-500">Local Business · Open now</p>
          </div>
        </div>
        {isAlert ? (
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-bold text-amber-800 uppercase">{structuredContent?.alert_type || 'ALERT'}</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900">{summary}</p>
            {cta && <div className="mt-2 py-1.5 px-3 rounded-full bg-amber-600 text-white text-[9px] font-bold inline-block">{cta}</div>}
          </div>
        ) : isEvent ? (
          <div className="p-3">
            <p className="text-sm font-bold text-black mb-1">{structuredContent?.event_title || 'Event Title'}</p>
            <p className="text-[10px] text-gray-500 mb-2">{structuredContent?.event_start_date || ''}{structuredContent?.event_end_date ? ` → ${structuredContent.event_end_date}` : ''}</p>
            <p className="text-xs leading-relaxed text-black">{summary}</p>
          </div>
        ) : (
          <>
            <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
            {!mediaUrls[0] && <div className="h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center"><ImageIcon className="w-10 h-10 text-blue-300" /></div>}
            <div className="p-3">
              {isOffer ? (
                <div className="border border-dashed border-blue-300 rounded-lg p-3 bg-blue-50">
                  <p className="text-xs font-bold text-blue-800 mb-1">Special Offer</p>
                  <p className="text-xs leading-relaxed text-black">{summary || 'Limited time offer!'}</p>
                  {endDate && <p className="text-[9px] text-gray-500 mt-1">Valid until {endDate}</p>}
                  <div className="mt-2 py-1.5 px-3 rounded-full bg-blue-500 text-white text-[9px] font-bold inline-block">{cta || 'Learn More'}</div>
                </div>
              ) : (
                <>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-black">{summary || <span className="text-gray-400">Share an update with your customers...</span>}</p>
                  {cta && <div className="mt-2 py-1.5 px-3 rounded-full bg-blue-500 text-white text-[9px] font-bold inline-block">{cta}</div>}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ───── Platform preview map ─────
type PreviewComponent = (props: PreviewProps) => React.ReactNode

export const platformPreviews: Record<string, PreviewComponent> = {
  instagram: InstagramPreview,
  x: XPreview,
  twitter: XPreview,
  linkedin: LinkedInPreview,
  facebook: FacebookPreview,
  threads: ThreadsPreview,
  youtube: YouTubePreview,
  reddit: RedditPreview,
  pinterest: PinterestPreview,
  wordpress: WordPressPreview,
  discord: DiscordPreview,
  telegram: TelegramPreview,
  slack: SlackPreview,
  bluesky: BlueskyPreview,
  mastodon: MastodonPreview,
  tumblr: TumblrPreview,
  gmb: GMBPreview,
}

export function getPlatformPreview(platform: string): PreviewComponent {
  return platformPreviews[platform.toLowerCase()] || InstagramPreview
}
