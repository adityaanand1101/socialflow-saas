import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChannelAvatar } from '@/components/ChannelAvatar'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Channel } from '@/store/useStore'

interface ChannelHealthProps {
  channels: Channel[]
}

export const ChannelHealth = memo(function ChannelHealth({ channels }: ChannelHealthProps) {
  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Channel Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No channels connected</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Connect accounts in the Channels page</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {channels.map((channel) => {
            const rate = Math.min(channel.engagementRate / 100, 1)
            const healthColor =
              rate >= 0.05 ? 'bg-green-500' :
              rate >= 0.02 ? 'bg-yellow-500' :
              'bg-red-500'

            return (
              <div key={channel.id} className="flex items-center gap-3">
                <ChannelAvatar
                  src={channel.avatar}
                  name={channel.name || channel.platform}
                  platform={channel.platform}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">
                      {channel.name || channel.username || channel.platform}
                    </p>
                    {channel.status === 'connected' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" aria-label="Connected" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" aria-label={channel.status === 'expired' ? 'Expired' : 'Disconnected'} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {channel.followers?.toLocaleString()} followers
                  </p>
                  <div className="mt-1.5 w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', healthColor)}
                      style={{ width: `${Math.round(rate * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})
