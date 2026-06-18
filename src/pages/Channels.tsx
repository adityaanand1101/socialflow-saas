import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MoreVertical, RefreshCw, Unplug, TrendingUp, Users, Eye, Info, X, Loader2, Check, FileText
} from 'lucide-react'
import { 
  Instagram, Linkedin, Twitter, Youtube, Facebook, Threads, Bluesky, 
  Slack, Pinterest, Mastodon, Reddit, Discord, Telegram, GMB, Tumblr 
} from '@/components/icons'
import { useAuth } from '@clerk/react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

const ALL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400', bgHover: 'hover:border-pink-500/50 hover:bg-pink-500/5', description: 'Reels, Stories & Feed', authNote: 'Requires Instagram Business account' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500', bgHover: 'hover:border-blue-600/50 hover:bg-blue-600/5', description: 'Pages & Groups', authNote: 'Requires Facebook Page admin access' },
  { id: 'threads', label: 'Threads', icon: Threads, color: 'text-white', bgHover: 'hover:border-white/30 hover:bg-white/5', description: 'Text-based sharing', authNote: 'Requires Threads account' },
  { id: 'x', label: 'X (Twitter)', icon: Twitter, color: 'text-white', bgHover: 'hover:border-gray-400/50 hover:bg-gray-400/5', description: 'Tweets & Threads', authNote: 'Requires X developer access' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400', bgHover: 'hover:border-blue-500/50 hover:bg-blue-500/5', description: 'Posts, Articles & Pages', authNote: 'Requires LinkedIn Page admin access' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500', bgHover: 'hover:border-red-500/50 hover:bg-red-500/5', description: 'Videos & Shorts', authNote: 'Requires Google account' },
  { id: 'gmb', label: 'Google My Business', icon: GMB, color: 'text-blue-600', bgHover: 'hover:border-blue-700/50 hover:bg-blue-700/5', description: 'Local SEO & Reviews', authNote: 'Requires Google Business Profile' },
  { id: 'pinterest', label: 'Pinterest', icon: Pinterest, color: 'text-red-600', bgHover: 'hover:border-red-700/50 hover:bg-red-700/5', description: 'Pins & Boards', authNote: 'Requires Pinterest Business account' },
  { id: 'bluesky', label: 'Bluesky', icon: Bluesky, color: 'text-blue-400', bgHover: 'hover:border-blue-500/30 hover:bg-blue-500/5', description: 'Decentralized Social', authNote: 'Requires Bluesky handle & app password' },
  { id: 'mastodon', label: 'Mastodon', icon: Mastodon, color: 'text-purple-500', bgHover: 'hover:border-purple-600/50 hover:bg-purple-600/5', description: 'Federated microblogging', authNote: 'Requires Mastodon instance URL' },
  { id: 'reddit', label: 'Reddit', icon: Reddit, color: 'text-orange-500', bgHover: 'hover:border-orange-600/50 hover:bg-orange-600/5', description: 'Subreddit communities', authNote: 'Requires Reddit app credentials' },
  { id: 'wordpress', label: 'WordPress', icon: FileText, color: 'text-blue-500', bgHover: 'hover:border-blue-500/50 hover:bg-blue-500/5', description: 'Blogs & Articles', authNote: 'Requires WordPress.com REST API OAuth' },
  { id: 'discord', label: 'Discord', icon: Discord, color: 'text-indigo-400', bgHover: 'hover:border-indigo-500/50 hover:bg-indigo-500/5', description: 'Server Webhooks & Bots', authNote: 'Requires Discord Bot permissions' },
  { id: 'telegram', label: 'Telegram', icon: Telegram, color: 'text-blue-400', bgHover: 'hover:border-blue-500/50 hover:bg-blue-500/5', description: 'Channels & Groups', authNote: 'Requires Telegram Bot API Token' },
  { id: 'tumblr', label: 'Tumblr', icon: Tumblr, color: 'text-blue-900', bgHover: 'hover:border-blue-900/50 hover:bg-blue-900/5', description: 'Microblogging & Social', authNote: 'Requires Tumblr Consumer Key' },
  { id: 'slack', label: 'Slack', icon: Slack, color: 'text-green-500', bgHover: 'hover:border-green-600/50 hover:bg-green-600/5', description: 'Workplace messaging', authNote: 'Requires Slack App/Webhook URL' },
]

export const Channels = () => {
  const { getToken } = useAuth()
  const { channels, fetchChannels } = useStore()
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [showInfoModal, setShowInfoModal] = useState<string | null>(null)
  const [showCustomModal, setShowCustomModal] = useState<string | null>(null)
  const [customCreds, setCustomCreds] = useState({ identifier: '', password: '' })
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [connectSuccess] = useState<string | null>(null)
  
  // Force a fetch when the page loads, especially to catch new OAuth redirects
  useEffect(() => {
    const initFetch = async () => {
      const token = await getToken()
      if (token) await fetchChannels(token)
    }
    initFetch()
  }, [getToken, fetchChannels])

  const handleConnect = async (platform: string) => {
    if (platform === 'bluesky' || platform === 'telegram') {
      setShowCustomModal(platform)
      return
    }

    setConnecting(platform)
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/oauth/${platform}/connect`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const data = await res.json()
      if (res.ok && data.authUrl) {
        // Open the OAuth screen in a new tab
        window.open(data.authUrl, '_blank', 'noopener,noreferrer')
        
        // Show the user a message that they need to finish in the new tab
        alert(`A new tab has opened to connect ${platform}. Once you finish, close that tab and refresh this page.`)
      } else {
        const errorMsg = data.error || `Server returned ${res.status}: ${res.statusText}`;
        alert(`Failed to connect ${platform}: ${errorMsg}`);
        console.error('Connect Error:', data);
      }
    } catch (e: any) {
      console.error('Network Error:', e)
      alert(`Network error: Could not reach the backend. Check your VITE_API_URL.`);
    } finally {
      setConnecting(null)
    }
  }

  const handleCustomConnect = async () => {
    if (!showCustomModal || !customCreds.identifier || !customCreds.password) return
    
    setConnecting(showCustomModal)
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/oauth/${showCustomModal}/manual-connect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(customCreds)
      })
      
      if (res.ok) {
        await fetchChannels(token as string)
        setShowCustomModal(null)
        setCustomCreds({ identifier: '', password: '' })
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to connect')
      }
    } catch (e) {
      console.error(e)
      alert('Connection error')
    } finally {
      setConnecting(null)
    }
  }

  const handleSync = async (channelId: string) => {
    setSyncingId(channelId)
    try {
      const token = await getToken()
      if (token) await fetchChannels(token)
      await new Promise(r => setTimeout(r, 1000))
    } finally {
      setSyncingId(null)
    }
  }

  const handleDisconnect = async (channelId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return
    try {
      const token = await getToken()
      if (!token) return
      
      const res = await apiFetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        await fetchChannels(token)
        setMenuOpen(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to disconnect channel')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const connectedPlatforms = new Set(channels.map((c: any) => c.platform))
  const availablePlatforms = ALL_PLATFORMS.filter(p => !connectedPlatforms.has(p.id as any))

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Social Channels</h1>
          <p className="text-muted-foreground mt-1">Connect and manage your social media identities.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          <span className="text-xs font-bold text-white">{channels.length} Connected</span>
        </div>
      </div>

      {/* Connect Platform Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowInfoModal(null)}>
          <div className="bg-[#141218] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {(() => {
                  const p = ALL_PLATFORMS.find(pl => pl.id === showInfoModal)
                  if (!p) return null
                  return (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <p.icon className={cn("w-6 h-6", p.color)} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Connect {p.label}</h2>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
              <button onClick={() => setShowInfoModal(null)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3 mb-5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Backend required</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {ALL_PLATFORMS.find(p => p.id === showInfoModal)?.authNote}. 
                  OAuth integration requires the backend server to be running with your OAuth credentials configured.
                </p>
              </div>
            </div>

            <Button className="w-full" onClick={() => setShowInfoModal(null)}>Got it</Button>
          </div>
        </div>
      )}

      {/* Custom Connect Modal (Bluesky/Medium) */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowCustomModal(null)}>
          <div className="bg-[#141218] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {(() => {
                  const p = ALL_PLATFORMS.find(pl => pl.id === showCustomModal)
                  if (!p) return null
                  return (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <p.icon className={cn("w-6 h-6", p.color)} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Connect {p.label}</h2>
                        <p className="text-xs text-muted-foreground">Direct authentication required</p>
                      </div>
                    </>
                  )
                })()}
              </div>
              <button onClick={() => setShowCustomModal(null)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {showCustomModal === 'bluesky' ? 'Handle (e.g. user.bsky.social)' : 
                   showCustomModal === 'telegram' ? 'Bot Name / Identifier' : 'Integration Token Name'}
                </label>
                <input
                  type="text"
                  value={customCreds.identifier}
                  onChange={(e) => setCustomCreds(c => ({ ...c, identifier: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {showCustomModal === 'bluesky' ? 'App Password' : 
                   showCustomModal === 'telegram' ? 'Bot Token' : 'Integration Token Secret'}
                </label>
                <input
                  type="password"
                  value={customCreds.password}
                  onChange={(e) => setCustomCreds(c => ({ ...c, password: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                />
                <p className="text-[10px] text-muted-foreground">
                  {showCustomModal === 'bluesky' ? "Generate this in your Bluesky Settings > Advanced > App Passwords" : 
                   showCustomModal === 'telegram' ? "Get this from @BotFather on Telegram" : "Generate this in your Medium Settings"}
                </p>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleCustomConnect}
              disabled={!customCreds.identifier || !customCreds.password || connecting === showCustomModal}
            >
              {connecting === showCustomModal ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect Account'}
            </Button>
          </div>
        </div>
      )}

      {/* Connected Channels */}
      {channels.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Connected Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel: any) => {
              const platform = ALL_PLATFORMS.find(p => p.id === channel.platform)
              const PlatformIcon = platform?.icon || Instagram
              return (
                <Card key={channel.id} className="relative overflow-hidden group hover:border-white/20 transition-all">
                  {/* Gradient bg */}
                  <div className="absolute top-0 left-0 right-0 h-24 opacity-10 bg-gradient-primary pointer-events-none" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <PlatformIcon className={cn("w-5 h-5", platform?.color)} />
                    </div>
                    <div className="relative">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMenuOpen(menuOpen === channel.id ? null : channel.id)}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {menuOpen === channel.id && (
                        <div className="absolute right-0 top-9 bg-[#141218] border border-white/10 rounded-xl shadow-2xl z-10 w-36 py-1 animate-in fade-in zoom-in-95 duration-100">
                          <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 flex items-center gap-2">
                            <RefreshCw className="w-3 h-3" /> Sync Now
                          </button>
                          <button 
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            onClick={() => handleDisconnect(channel.id)}
                          >
                            <Unplug className="w-3 h-3" /> Disconnect
                          </button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 border-2 border-white/10">
                        {channel.avatar && !channel.avatar.includes('shadcn.png') ? (
                          <AvatarImage src={channel.avatar} />
                        ) : null}
                        <AvatarFallback>{channel.name?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-white">{channel.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{channel.platform}</p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mt-5">
                      {[
                        { icon: Users, label: 'Followers', value: channel.followers >= 1000 ? `${(channel.followers/1000).toFixed(1)}K` : channel.followers },
                        { icon: TrendingUp, label: 'Engagement', value: `${channel.engagementRate}%` },
                        { icon: Eye, label: 'Reach', value: channel.reach >= 1000 ? `${(channel.reach/1000).toFixed(1)}K` : channel.reach },
                      ].map(stat => (
                        <div key={stat.label} className="p-2 rounded-lg bg-white/5 text-center">
                          <p className="text-xs font-bold text-white">{stat.value}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-tight mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Connected</span>
                      </div>
                      <Button 
                        variant="ghost" size="sm" className="h-7 text-[10px] gap-1 hover:bg-white/5"
                        onClick={() => handleSync(channel.id)}
                        disabled={syncingId === channel.id}
                      >
                        <RefreshCw className={cn("w-3 h-3", syncingId === channel.id && "animate-spin")} />
                        Sync
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      {availablePlatforms.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            {channels.length > 0 ? 'Add More Channels' : 'Connect a Channel'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availablePlatforms.map((platform) => (
              <Card
                key={platform.id}
                className={cn("cursor-pointer transition-all border-dashed border-2 border-white/10 bg-transparent", platform.bgHover)}
                onClick={() => handleConnect(platform.id)}
              >
                <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  {connectSuccess === platform.id ? (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                  ) : connecting === platform.id ? (
                    <Loader2 className={cn("w-8 h-8 animate-spin", platform.color)} />
                  ) : (
                    <platform.icon className={cn("w-8 h-8", platform.color)} />
                  )}
                  <div>
                    <p className="font-bold text-white text-sm">{connectSuccess === platform.id ? 'Connected!' : `Connect ${platform.label}`}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{platform.description}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs mt-1"
                    disabled={connecting === platform.id}
                  >
                    {connecting === platform.id ? 'Connecting...' : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {channels.length === 0 && (
        <div className="mt-4 p-6 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-muted-foreground text-sm">Connect a social media channel above to get started. Your accounts will appear here once connected.</p>
        </div>
      )}
    </div>
  )
}
