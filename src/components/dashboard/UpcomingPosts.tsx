import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Post } from '@/store/useStore'
import { ChannelAvatar } from '@/components/ChannelAvatar'

interface UpcomingPostsProps {
  posts: Post[]
}

function sanitize(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

export const UpcomingPosts = memo(function UpcomingPosts({ posts }: UpcomingPostsProps) {
  const sorted = [...posts]
    .filter((p) => p.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
    .slice(0, 5)

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming posts</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Schedule a post to see it here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((post) => {
            const date = new Date(post.scheduledTime)
            const isSoon = date.getTime() - Date.now() < 86_400_000

            return (
              <div
                key={post.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                  {post.media?.[0] ? (
                    <img src={post.media[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">📝</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/90 truncate" dangerouslySetInnerHTML={{ __html: sanitize(post.caption) }} />
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {isSoon && (
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                        Soon
                      </span>
                    )}
                  </div>
                  {post.platforms && post.platforms.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {post.platforms.map((p) => (
                        <ChannelAvatar
                          key={p}
                          name={p}
                          platform={p}
                          className="w-5 h-5"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" aria-label="More options">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})
