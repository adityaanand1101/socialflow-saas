import { Image as ImageIcon, User, Heart, MessageCircle, Repeat2, Bookmark, Send, ThumbsUp, ThumbsDown, Share2, ArrowUp, ArrowDown, Play, Ellipsis } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreviewProps {
  caption: string
  mediaUrls: string[]
  mediaTypes: Record<string, string>
  mediaInfo: { url: string; type: 'image' | 'video' }[]
  isMobile: boolean
  getRatioClass: () => string
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
function InstagramPreview({ caption, mediaUrls, mediaInfo, isMobile, getRatioClass }: PreviewProps) {
  return (
    <div className={cn("rounded-xl overflow-hidden shadow-xl", isMobile ? "bg-black" : "")}>
      <PlatformBadge label="Instagram" color="bg-pink-500 text-white" />
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
            <p className="text-[10px] leading-tight"><span className="font-bold mr-1">your_account</span>{caption || <span className="text-gray-400">Caption will appear here</span>}</p>
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
              <p className="text-xs leading-relaxed text-black"><span className="font-bold mr-1">your_account</span>{caption || <span className="text-gray-400">Caption will appear here</span>}</p>
              <p className="text-[9px] text-gray-400 uppercase">JUST NOW</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ───── X / Twitter ─────
function XPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
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
        <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2 text-white">{caption || <span className="text-gray-500">Your post content...</span>}</p>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && null}
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
function LinkedInPreview({ caption, mediaUrls, mediaInfo, isMobile, getRatioClass }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="LinkedIn" color="bg-blue-600 text-white" />
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
        <div className={cn("px-3", isMobile ? "text-[11px]" : "text-xs")}>
          <p className="whitespace-pre-wrap leading-relaxed text-black">{caption || <span className="text-gray-400">Share your professional updates...</span>}</p>
        </div>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && null}
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
function FacebookPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Facebook" color="bg-blue-500 text-white" />
      <div className="bg-white text-black">
        <div className="p-3 flex items-center gap-2">
          <Avatar size="md" />
          <div className="flex-1">
            <p className="text-xs font-bold text-black">Your Name</p>
            <p className="text-[9px] text-gray-500">1m ago · 🌍</p>
          </div>
          <Ellipsis className="w-4 h-4 text-gray-400" />
        </div>
        <div className="px-3 pb-2 text-xs whitespace-pre-wrap leading-relaxed text-black">{caption || <span className="text-gray-400">What's on your mind?</span>}</div>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && null}
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
function ThreadsPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Threads" color="bg-black text-white" />
      <div className="bg-black text-white p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar size="sm" />
          <span className="text-xs font-bold text-white">your_name</span>
          <span className="text-[9px] text-gray-500">1m</span>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2 text-white">{caption || <span className="text-gray-500">Share your thoughts...</span>}</p>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && null}
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
function YouTubePreview({ caption, mediaUrls, mediaInfo, isMobile }: PreviewProps) {
  const firstMedia = mediaInfo[0]
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
          <p className={cn("font-bold line-clamp-2 text-black", isMobile ? "text-xs" : "text-sm")}>{caption?.slice(0, 80) || <span className="text-gray-400">Video title</span>}</p>
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
function RedditPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
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
            <p className="text-sm font-bold text-black mb-1">{caption?.split('\n')[0] || <span className="text-gray-400 font-normal">Post title</span>}</p>
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-black">{caption?.split('\n').slice(1).join('\n') || ''}</p>
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
function PinterestPreview({ caption, mediaUrls, mediaInfo }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl mx-auto" style={{ maxWidth: 236 }}>
      <PlatformBadge label="Pinterest" color="bg-red-600 text-white" />
      <div className="bg-white">
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={() => 'aspect-[2/3]'} />
        {!mediaUrls[0] && <div className="aspect-[2/3] bg-gray-100 flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-300" /></div>}
        <div className="p-2">
          <p className="text-[11px] font-bold line-clamp-2 text-black">{caption?.slice(0, 60) || <span className="text-gray-400 font-normal">Pin title</span>}</p>
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
function WordPressPreview({ caption, mediaUrls, mediaInfo }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="WordPress" color="bg-blue-500 text-white" />
      <div className="bg-white text-black">
        {mediaUrls[0] && <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={() => 'aspect-[2/1]'} />}
        <div className="p-4">
          <p className="text-base font-bold text-black mb-1">{caption?.split('\n')[0] || <span className="text-gray-400 font-normal">Post Title</span>}</p>
          <p className="text-[11px] text-gray-500 mb-2">January 1, 2025 · Category</p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-black">{caption?.split('\n').slice(1).join('\n') || <span className="text-gray-400">Start writing your blog post...</span>}</p>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500">
            <MessageCircle className="w-3.5 h-3.5" />0 Comments
          </div>
        </div>
      </div>
    </div>
  )
}

// ───── Discord ─────
function DiscordPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Discord" color="bg-indigo-500 text-white" />
      <div className="bg-[#313338] p-3 flex gap-2">
        <Avatar size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-400">YourName</span>
            <span className="text-[9px] text-gray-400">Today at 12:00 PM</span>
          </div>
          <p className="text-xs leading-relaxed mt-0.5 whitespace-pre-wrap text-white">{caption || <span className="text-gray-500">Type your message...</span>}</p>
          <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
          {!mediaUrls[0] && null}
        </div>
      </div>
    </div>
  )
}

// ───── Telegram ─────
function TelegramPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Telegram" color="bg-blue-500 text-white" />
      <div className="bg-[#17212b] p-3">
        <div className="flex items-center gap-2 mb-1">
          <Avatar size="sm" />
          <span className="text-xs font-bold text-[#2b9ce5]">Your Name</span>
          <span className="text-[9px] text-gray-500 ml-auto">12:00</span>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-white">{caption || <span className="text-gray-500">Write a message...</span>}</p>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && null}
      </div>
    </div>
  )
}

// ───── Slack ─────
function SlackPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
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
          <p className="text-xs leading-relaxed mt-0.5 whitespace-pre-wrap text-black">{caption || <span className="text-gray-400">Write a message...</span>}</p>
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
function BlueskyPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
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
        <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2 text-black">{caption || <span className="text-gray-400">What's up?</span>}</p>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && null}
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
function MastodonPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Mastodon" color="bg-purple-600 text-white" />
      <div className="bg-[#191b22] p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Avatar size="md" />
          <div>
            <p className="text-xs font-bold text-white">Your Name</p>
            <p className="text-[9px] text-gray-500">@yourname@mastodon.social</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2 text-white">{caption || <span className="text-gray-500">Write a post...</span>}</p>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && null}
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
function TumblrPreview({ caption }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <PlatformBadge label="Tumblr" color="bg-blue-900 text-white" />
      <div className="bg-[#001935] p-4">
        <p className="text-lg font-bold text-white mb-1">{caption?.split('\n')[0] || 'Post Title'}</p>
        <div className="flex items-center gap-2 text-[9px] text-gray-400 mb-3">
          <span>yourblog</span>
          <span>·</span>
          <span>1m ago</span>
          <span>·</span>
          <span>42 notes</span>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-white">{caption?.split('\n').slice(1).join('\n') || <span className="text-gray-500">Write your post...</span>}</p>
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
function GMBPreview({ caption, mediaUrls, mediaInfo, getRatioClass }: PreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl mx-auto" style={{ maxWidth: 380 }}>
      <PlatformBadge label="Google My Business" color="bg-blue-600 text-white" />
      <div className="bg-white text-black">
        <div className="p-3 flex items-center gap-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">B</div>
          <div>
            <p className="text-xs font-bold text-black">Your Business</p>
            <p className="text-[9px] text-gray-500">Local Business · Open now</p>
          </div>
        </div>
        <MediaBlock mediaUrls={mediaUrls} mediaInfo={mediaInfo} getRatioClass={getRatioClass} />
        {!mediaUrls[0] && <div className="h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center"><ImageIcon className="w-10 h-10 text-blue-300" /></div>}
        <div className="p-3">
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-black">{caption || <span className="text-gray-400">Share an update with your customers...</span>}</p>
          {caption && <div className="mt-2 py-1.5 px-3 rounded-full bg-blue-500 text-white text-[9px] font-bold inline-block">Learn More</div>}
        </div>
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
