import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@clerk/react'
import { ALL_PLATFORMS } from '@/lib/platforms'
import {
  MessageSquare, MessageCircle, Send, Loader2, ArrowLeft, RefreshCw, ChevronRight,
  Mail, MailOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type InboxTab = 'comments' | 'dms'

interface CommentItem {
  id: string
  platform: string
  type: 'comment' | 'dm'
  fromName: string
  fromUsername: string
  fromAvatar: string
  content: string
  postId?: string
  postCaption?: string
  timestamp: string
  isRead: boolean
}

interface DMThread {
  id: string
  platform: string
  withName: string
  withUsername: string
  withAvatar: string
  lastMessage: string
  lastTimestamp: string
  unread: number
  messages: { id: string; fromMe: boolean; content: string; timestamp: string }[]
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function Inbox() {
  const { getToken } = useAuth()
  const [activeTab, setActiveTab] = useState<InboxTab>('comments')
  const [comments, setComments] = useState<CommentItem[]>([])
  const [dmThreads, setDmThreads] = useState<DMThread[]>([])
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null)
  const [selectedDM, setSelectedDM] = useState<DMThread | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken()
      const [commentsRes, dmsRes] = await Promise.all([
        apiFetch('/api/inbox/comments', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/inbox/dms', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (commentsRes.ok) setComments(await commentsRes.json())
      if (dmsRes.ok) setDmThreads(await dmsRes.json())
    } catch (e) {
      console.error('Failed to fetch inbox:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getToken])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = () => { setRefreshing(true); fetchData() }

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const token = await getToken()
      const endpoint = selectedComment
        ? `/api/inbox/comments/${selectedComment.id}/reply`
        : selectedDM
          ? `/api/inbox/dms/${selectedDM.id}/reply`
          : null
      if (!endpoint) return
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      })
      if (res.ok) {
        setReplyText('')
        await fetchData()
      }
    } catch (e) {
      console.error('Failed to send reply:', e)
    } finally {
      setSendingReply(false)
    }
  }

  const markRead = async (commentId: string) => {
    try {
      const token = await getToken()
      await apiFetch(`/api/inbox/comments/${commentId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {}
  }

  const filteredComments = platformFilter === 'all'
    ? comments
    : comments.filter(c => c.platform === platformFilter)

  const filteredDMs = platformFilter === 'all'
    ? dmThreads
    : dmThreads.filter(d => d.platform === platformFilter)

  const uniquePlatforms = [...new Set([...comments.map(c => c.platform), ...dmThreads.map(d => d.platform)])]

  const totalUnread = comments.filter(c => !c.isRead).length + dmThreads.reduce((s, t) => s + t.unread, 0)

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalUnread > 0
              ? `${totalUnread} unread ${totalUnread === 1 ? 'message' : 'messages'} across ${uniquePlatforms.length} platforms`
              : 'All caught up'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-white"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {(selectedComment || selectedDM) ? (
        <div>
          <button
            onClick={() => { setSelectedComment(null); setSelectedDM(null) }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to inbox
          </button>
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {(selectedComment?.fromName || selectedDM?.withName || '?')[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{selectedComment?.fromName || selectedDM?.withName}</p>
                  <p className="text-[11px] text-muted-foreground">@{selectedComment?.fromUsername || selectedDM?.withUsername}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[400px] overflow-y-auto">
              {selectedComment ? (
                <div className="bg-white/[0.03] rounded-lg px-4 py-3 border border-white/[0.06]">
                  <p className="text-sm text-white">{selectedComment.content}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(selectedComment.timestamp)}</p>
                  {selectedComment.postCaption && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 italic">
                      On: {selectedComment.postCaption}
                    </p>
                  )}
                </div>
              ) : selectedDM?.messages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.fromMe ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2.5",
                    msg.fromMe
                      ? "bg-purple-500/20 border border-purple-500/20"
                      : "bg-white/[0.03] border border-white/[0.06]"
                  )}>
                    <p className="text-sm text-white">{msg.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">{timeAgo(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-white/[0.06] flex items-center gap-3">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() }}}
                placeholder="Write a reply..."
                className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-purple-500/40 transition-colors"
              />
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleReply}
                disabled={sendingReply || !replyText.trim()}
              >
                {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              {(['comments', 'dms'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    activeTab === tab
                      ? "bg-white/10 text-white"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  {tab === 'comments' ? <MessageSquare className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                  {tab === 'comments' ? 'Comments' : 'Messages'}
                  {tab === 'comments'
                    ? comments.filter(c => !c.isRead).length > 0 && (
                        <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {comments.filter(c => !c.isRead).length}
                        </span>
                      )
                    : dmThreads.reduce((s, t) => s + t.unread, 0) > 0 && (
                        <span className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {dmThreads.reduce((s, t) => s + t.unread, 0)}
                        </span>
                      )
                  }
                </button>
              ))}
            </div>
            {uniquePlatforms.length > 0 && (
              <div className="flex p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06] overflow-x-auto max-w-[400px] scrollbar-thin">
                <button
                  onClick={() => setPlatformFilter('all')}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap",
                    platformFilter === 'all' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                  )}
                >
                  All
                </button>
                {uniquePlatforms.map(pid => {
                  const pl = ALL_PLATFORMS.find(x => x.id === pid)
                  if (!pl) return null
                  const Icon = pl.icon
                  return (
                    <button
                      key={pid}
                      onClick={() => setPlatformFilter(pid)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap",
                        platformFilter === pid ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {pl.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : activeTab === 'comments' ? (
            <div className="space-y-2">
              {filteredComments.length === 0 ? (
                <div className="text-center py-20">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                </div>
              ) : filteredComments.map(comment => {
                const pl = ALL_PLATFORMS.find(x => x.id === comment.platform)
                const Icon = pl?.icon
                return (
                  <button
                    key={comment.id}
                    onClick={() => {
                      setSelectedComment(comment)
                      if (!comment.isRead) {
                        markRead(comment.id)
                        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, isRead: true } : c))
                      }
                    }}
                    className="w-full text-left bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {comment.fromName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-semibold", comment.isRead ? "text-white" : "text-white")}>
                            {comment.fromName}
                          </span>
                          {!comment.isRead && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />}
                          <span className="text-[11px] text-muted-foreground ml-auto">
                            {timeAgo(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">@{comment.fromUsername}</p>
                        <p className={cn(
                          "text-sm leading-relaxed",
                          comment.isRead ? "text-white/70" : "text-white"
                        )}>
                          {comment.content}
                        </p>
                        {comment.postCaption && (
                          <div className="flex items-center gap-1.5 mt-2">
                            {Icon && <Icon className={cn("w-3 h-3", pl?.color)} />}
                            <span className="text-[11px] text-muted-foreground truncate">{comment.postCaption}</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDMs.length === 0 ? (
                <div className="text-center py-20">
                  <MailOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              ) : filteredDMs.map(thread => {
                const pl = ALL_PLATFORMS.find(x => x.id === thread.platform)
                const Icon = pl?.icon
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedDM(thread)}
                    className="w-full text-left bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                          {thread.withName[0]}
                        </div>
                        {thread.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {thread.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-semibold", thread.unread > 0 ? "text-white" : "text-white/80")}>
                            {thread.withName}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-auto">
                            {timeAgo(thread.lastTimestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">@{thread.withUsername}</p>
                        <p className={cn(
                          "text-sm leading-relaxed truncate",
                          thread.unread > 0 ? "text-white font-medium" : "text-white/60"
                        )}>
                          {thread.lastMessage}
                        </p>
                        {Icon && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Icon className={cn("w-3 h-3", pl?.color)} />
                            <span className="text-[10px] text-muted-foreground">{pl?.label}</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
