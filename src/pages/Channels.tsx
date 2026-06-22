import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChannelAvatar } from '@/components/ChannelAvatar'
import { 
  MoreVertical, RefreshCw, Unplug, TrendingUp, Users, Eye, Info, X, Loader2, Check, AlertCircle
} from 'lucide-react'
import { Instagram } from '@/components/icons'
import { useAuth } from '@clerk/react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { ALL_PLATFORMS } from '@/lib/platforms'

export const Channels = () => {
  const { getToken } = useAuth()
  const { channels, fetchChannels } = useStore()
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [showInfoModal, setShowInfoModal] = useState<string | null>(null)
  const [showCustomModal, setShowCustomModal] = useState<string | null>(null)
  const [showDisconnectModal, setShowDisconnectModal] = useState<string | null>(null)
  const [showConnectChoice, setShowConnectChoice] = useState<string | null>(null)
  const [customCreds, setCustomCreds] = useState({ identifier: '', password: '' })
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const initFetch = async () => {
      try {
        setLoading(true)
        setFetchError(null)
        const token = await getToken()
        if (token && !cancelled) await fetchChannels(token)
      } catch (e: any) {
        if (!cancelled) setFetchError(e.message || 'Failed to load channels')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    initFetch()
    return () => { cancelled = true }
  }, [getToken, fetchChannels])

  const closeModals = useCallback(() => {
    setShowInfoModal(null)
    setShowCustomModal(null)
    setShowDisconnectModal(null)
    setShowConnectChoice(null)
  }, [])

  useEffect(() => {
    if (!showInfoModal && !showCustomModal && !showDisconnectModal && !showConnectChoice) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModals() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showInfoModal, showCustomModal, showDisconnectModal, closeModals])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleConnect = async (platform: string) => {
    if (platform === 'bluesky' || platform === 'telegram') {
      setShowCustomModal(platform)
      return
    }

    if (platform === 'instagram') {
      setShowConnectChoice(platform)
      return
    }

    setConnecting(platform)
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/oauth/${platform}/connect`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      if (res.ok && data.authUrl) {
        window.open(data.authUrl, '_blank', 'noopener,noreferrer')
        showNotification('success', `A new tab has opened to connect ${platform}. After authorizing, come back and refresh.`)
      } else {
        const errorMsg = data.error || `Server returned ${res.status}: ${res.statusText}`
        showNotification('error', `Failed to connect ${platform}: ${errorMsg}`)
        console.error('Connect Error:', data)
      }
    } catch (e: any) {
      console.error('Network Error:', e)
      showNotification('error', `Network error: Could not reach the backend. Check your VITE_API_URL.`)
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
        showNotification('success', `Connected ${showCustomModal} successfully!`)
      } else {
        const data = await res.json()
        showNotification('error', data.error || 'Failed to connect')
      }
    } catch (e) {
      console.error(e)
      showNotification('error', 'Connection error')
    } finally {
      setConnecting(null)
    }
  }

  const handleSync = async (channelId: string) => {
    setSyncingId(channelId)
    try {
      const token = await getToken()
      if (token) await fetchChannels(token)
      showNotification('success', 'Channels synced successfully')
    } catch (e) {
      showNotification('error', 'Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  const handleDisconnect = async (channelId: string) => {
    setShowDisconnectModal(null)
    setMenuOpen(null)
    try {
      const token = await getToken()
      if (!token) return

      const res = await apiFetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        await fetchChannels(token)
        showNotification('success', 'Channel disconnected')
      } else {
        const data = await res.json()
        showNotification('error', data.error || 'Failed to disconnect channel')
      }
    } catch (e) {
      console.error(e)
      showNotification('error', 'Failed to disconnect')
    }
  }

  const availablePlatforms = ALL_PLATFORMS

  return (
    <div className="space-y-8 pb-10">
      {/* Notification Toast */}
      {notification && (
        <div className={cn(
          "fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200 flex items-center gap-3 max-w-md",
          notification.type === 'success' ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
        )}>
          {notification.type === 'success' ? (
            <Check className="w-5 h-5 text-green-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <p className={cn(
            "text-sm flex-1",
            notification.type === 'success' ? "text-green-200" : "text-red-200"
          )}>{notification.message}</p>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/5 rounded">
            <X className="w-3 h-3 text-white/40" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Social Channels</h1>
          <p className="text-muted-foreground mt-1">Connect and manage your social media identities.</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <span className="text-xs font-bold text-white">{channels.length} Connected</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {fetchError && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300 flex-1">{fetchError}</p>
            <Button variant="ghost" size="sm" onClick={() => setFetchError(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div>
          <div className="h-3 bg-white/10 rounded w-28 mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-white/10 bg-white/5 animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-32 mb-2" />
                      <div className="h-3 bg-white/10 rounded w-20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-5">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="p-2 rounded-lg bg-white/5">
                        <div className="h-4 bg-white/10 rounded w-10 mx-auto mb-1" />
                        <div className="h-2 bg-white/10 rounded w-12 mx-auto" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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

      {/* Connect Choice Modal (e.g. Instagram: API vs Manual) */}
      {showConnectChoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowConnectChoice(null)}>
          <div className="bg-[#141218] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Connect Instagram</h2>
              <button onClick={() => setShowConnectChoice(null)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Instagram only supports Business and Creator accounts via API. Personal accounts can be connected manually with just your handle.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full justify-start gap-3 h-auto py-3 px-4"
                variant="outline"
                onClick={() => {
                  setShowConnectChoice(null)
                  setConnecting('instagram')
                  ;(async () => {
                    try {
                      const token = await getToken()
                      const res = await apiFetch(`/api/oauth/instagram/connect`, {
                        credentials: 'include',
                        headers: { Authorization: `Bearer ${token}` }
                      })
                      const data = await res.json()
                      if (res.ok && data.authUrl) {
                        window.open(data.authUrl, '_blank', 'noopener,noreferrer')
                        showNotification('success', `A new tab has opened to connect Instagram. After authorizing, come back and refresh.`)
                      } else {
                        showNotification('error', `Failed to connect Instagram: ${data.error || res.statusText}`)
                      }
                    } catch (e: any) {
                      showNotification('error', `Network error: Could not reach the backend.`)
                    } finally {
                      setConnecting(null)
                    }
                  })()
                }}
                disabled={connecting === 'instagram'}
              >
                {connecting === 'instagram' ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : (
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                    <Instagram className="w-4 h-4 text-pink-400" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Business / Creator Account</p>
                  <p className="text-[11px] text-muted-foreground">Connect via OAuth — auto-publish posts</p>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-3 h-auto py-3 px-4"
                variant="outline"
                onClick={() => {
                  setShowConnectChoice(null)
                  setShowCustomModal('instagram')
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Instagram className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Personal Account</p>
                  <p className="text-[11px] text-muted-foreground">Connect manually with handle — you post, we remind</p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Connect Modal */}
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
                   showCustomModal === 'telegram' ? 'Bot Name / Identifier' : 
                   showCustomModal === 'instagram' ? 'Instagram Handle' : 'Integration Token Name'}
                </label>
                <input
                  type="text"
                  value={customCreds.identifier}
                  onChange={(e) => setCustomCreds(c => ({ ...c, identifier: e.target.value }))}
                  placeholder={showCustomModal === 'instagram' ? '@your_handle' : ''}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                />
              </div>
              {showCustomModal !== 'instagram' && (
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
              )}
              {showCustomModal === 'instagram' && (
                <p className="text-[10px] text-muted-foreground">
                  Enter your Instagram handle (e.g., @username). We'll remind you to post — no API access for personal accounts.
                </p>
              )}
            </div>

            <Button 
              className="w-full" 
              onClick={handleCustomConnect}
              disabled={!customCreds.identifier || (showCustomModal !== 'instagram' && !customCreds.password) || connecting === showCustomModal}
            >
              {connecting === showCustomModal ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect Account'}
            </Button>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowDisconnectModal(null)}>
          <div className="bg-[#141218] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Disconnect Account</h2>
              <button onClick={() => setShowDisconnectModal(null)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to disconnect this account? You'll need to re-authorize to connect it again.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDisconnectModal(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30" onClick={() => handleDisconnect(showDisconnectModal)}>Disconnect</Button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Channels */}
      {!loading && channels.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Connected Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel: any) => {
              const platform = ALL_PLATFORMS.find(p => p.id === channel.platform)
              const PlatformIcon = platform?.icon || Instagram
              const hasStats = channel.followers != null || channel.engagementRate != null || channel.reach != null
              return (
                <Card key={channel.id} className="relative overflow-hidden group hover:border-white/20 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-24 opacity-10 bg-gradient-primary pointer-events-none" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <PlatformIcon className="w-10 h-10" />
                    <div className="relative">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMenuOpen(menuOpen === channel.id ? null : channel.id)}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {menuOpen === channel.id && (
                        <div className="absolute right-0 top-9 bg-[#141218] border border-white/10 rounded-xl shadow-2xl z-10 w-36 py-1 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 flex items-center gap-2"
                            onClick={() => handleSync(channel.id)}
                          >
                            <RefreshCw className="w-3 h-3" /> Sync Now
                          </button>
                          <button 
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            onClick={() => { setMenuOpen(null); setShowDisconnectModal(channel.id) }}
                          >
                            <Unplug className="w-3 h-3" /> Disconnect
                          </button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <ChannelAvatar src={channel.avatar} name={channel.name} platform={channel.platform} className="w-14 h-14 border-2 border-white/10" />
                      <div>
                        <h3 className="font-bold text-white">{channel.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground capitalize">{channel.platform}</p>

                        </div>
                      </div>
                    </div>

                    {hasStats && (
                      <div className="grid grid-cols-3 gap-2 mt-5">
                        {[
                          { icon: Users, label: 'Followers', value: channel.followers >= 1000 ? `${(channel.followers/1000).toFixed(1)}K` : channel.followers },
                          { icon: TrendingUp, label: 'Engagement', value: `${channel.engagementRate}%` },
                          { icon: Eye, label: 'Reach', value: channel.reach >= 1000 ? `${(channel.reach/1000).toFixed(1)}K` : channel.reach },
                        ].filter(s => s.value != null && s.value !== '0%' && s.value !== '0' && s.value !== '0.0K').map(stat => (
                          <div key={stat.label} className="p-2 rounded-lg bg-white/5 text-center">
                            <p className="text-xs font-bold text-white">{stat.value}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-tight mt-0.5">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

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
                        {syncingId === channel.id ? 'Syncing...' : 'Sync'}
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
      {!loading && availablePlatforms.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            {channels.length > 0 ? 'Add More Channels' : 'Connect a Channel'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availablePlatforms.map((platform) => (
              <Card
                key={platform.id}
                className={cn("cursor-pointer transition-all border-dashed border-2 border-white/10 bg-transparent group", platform.bgHover)}
              >
                <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  {platform.id !== 'pinterest' && platform.id !== 'reddit' && (
                    <div className="flex items-center gap-2 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowInfoModal(platform.id) }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title={`About ${platform.label}`}
                      >
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  {platform.id === 'pinterest' || platform.id === 'reddit' ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 absolute top-3 right-3">Under Development</span>
                  ) : null}
                  {connecting === platform.id ? (
                    <Loader2 className={cn("w-8 h-8 animate-spin", platform.color)} />
                  ) : (
                    <platform.icon className={cn("w-8 h-8", platform.color)} />
                  )}
                  <div>
                    <p className="font-bold text-white text-sm">Connect {platform.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{platform.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs mt-1"
                    onClick={() => handleConnect(platform.id)}
                    disabled={connecting === platform.id || platform.id === 'pinterest' || platform.id === 'reddit'}
                  >
                    {platform.id === 'pinterest' || platform.id === 'reddit'
                      ? 'Under Development'
                      : connecting === platform.id ? 'Connecting...' : 'Connect'
                    }
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && channels.length === 0 && !fetchError && (
        <div className="mt-4 p-6 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-muted-foreground text-sm">Connect a social media channel above to get started. Your accounts will appear here once connected.</p>
        </div>
      )}
    </div>
  )
}
