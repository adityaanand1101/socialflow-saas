import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  User, Globe, CreditCard, Bell, Clock, Link as LinkIcon, Key, Trash2,
  ChevronRight, Loader2, Check, Camera, AlertTriangle, ExternalLink, Copy, LogOut, Rss, X, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, SignOutButton } from '@clerk/react'
import { apiFetch } from '@/lib/api'

const sections = [
  { id: 'profile', icon: User, title: 'Profile', description: 'Personal information and avatar.' },
  { id: 'workspace', icon: Globe, title: 'Workspace', description: 'Branding and domain settings.' },
  { id: 'billing', icon: CreditCard, title: 'Billing', description: 'Manage plans and invoices.' },
  { id: 'notifications', icon: Bell, title: 'Notifications', description: 'Email and push alerts.' },
  { id: 'queue', icon: Clock, title: 'Posting Queue', description: 'Default publishing schedules.' },
  { id: 'integrations', icon: LinkIcon, title: 'Integrations', description: 'Connect Zapier, Slack, etc.' },
  { id: 'api', icon: Key, title: 'API Keys', description: 'Developer access and webhooks.' },
]

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$19/mo', features: ['3 Social Channels', '1 User Seat', '50 Posts/month'], current: true },
  { id: 'pro', name: 'Pro', price: '$49/mo', features: ['10 Social Channels', '5 User Seats', 'Unlimited Posts'], current: false },
  { id: 'enterprise', name: 'Enterprise', price: '$149/mo', features: ['Unlimited Channels', 'Unlimited Seats', 'Priority Support'], current: false },
]

export const Settings = () => {
  const { getToken } = useAuth()
  const [activeSection, setActiveSection] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState({ 
    name: '', 
    email: '', 
    avatarUrl: '',
    bio: ''
  })
  
  const [workspace, setWorkspace] = useState({
    id: '',
    name: "",
    slug: "",
    logoUrl: "",
    plan: "STARTER"
  })

  const [notifications, setNotifications] = useState({
    postPublished: true,
    postFailed: true,
    teamInvite: true,
    weeklyReport: false,
    aiUsage: false,
  })

  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [rssFeeds, setRssFeeds] = useState<any[]>([])
  const [showRssModal, setShowRssModal] = useState(false)
  const [rssUrl, setRssUrl] = useState('')
  const [connectingRss, setConnectingRss] = useState(false)

  const globalPlugins = [
    { id: 'stripe', name: 'Stripe', description: 'Payment processing and subscription management', icon: CreditCard, enabled: false },
    { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing and audience management', icon: LinkIcon, enabled: false },
    { id: 'slack-webhook', name: 'Slack Webhooks', description: 'Post notifications to Slack channels', icon: LinkIcon, enabled: false },
    { id: 'zapier', name: 'Zapier', description: 'Connect with 5,000+ apps via automation', icon: ExternalLink, enabled: false },
    { id: 'ga', name: 'Google Analytics', description: 'Track content performance metrics', icon: Globe, enabled: false },
    { id: 'hubspot', name: 'HubSpot', description: 'CRM and marketing automation', icon: LinkIcon, enabled: false },
    { id: 'discord-webhook', name: 'Discord Webhooks', description: 'Send notifications to Discord', icon: LinkIcon, enabled: false },
    { id: 'segment', name: 'Segment', description: 'Customer data platform and analytics', icon: Globe, enabled: false },
  ]
  const [pluginToggles, setPluginToggles] = useState<Record<string, boolean>>({})
  const [internalPlugins, setInternalPlugins] = useState<any[]>([])
  const [showInternalPluginModal, setShowInternalPluginModal] = useState(false)
  const [internalPluginName, setInternalPluginName] = useState('')
  const [internalPluginUrl, setInternalPluginUrl] = useState('')

  const [openclawKey, setOpenclawKey] = useState<string | null>(null)
  const [openclawConnected, setOpenclawConnected] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getToken()
        if (!token) return

        const res = await apiFetch('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.ok) {
          const user = await res.json()
          setProfile({
            name: user.name || '',
            email: user.email || '',
            avatarUrl: user.avatarUrl || '',
            bio: user.bio || ''
          })

          if (user.memberships && user.memberships.length > 0) {
            const ws = user.memberships[0].workspace
            setWorkspace({
              id: ws.id,
              name: ws.name || '',
              slug: ws.slug || '',
              logoUrl: ws.logoUrl || '',
              plan: ws.plan || 'STARTER'
            })

            // Fetch API keys, webhooks, and RSS feeds
            const [keysRes, whRes, channelsRes] = await Promise.all([
               apiFetch('/api/integrations/keys', { headers: { Authorization: `Bearer ${token}` } }),
               apiFetch('/api/integrations/endpoints', { headers: { Authorization: `Bearer ${token}` } }),
               apiFetch('/api/channels', { headers: { Authorization: `Bearer ${token}` } })
            ])
            if (keysRes.ok) setApiKeys(await keysRes.json())
            if (whRes.ok) setWebhooks(await whRes.json())
            if (channelsRes.ok) {
              const allChannels = await channelsRes.json()
              setRssFeeds(allChannels.filter((c: any) => c.platform === 'rss'))
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [getToken])

  const handleGenerateApiKey = async () => {
    try {
      const token = await getToken()
      const res = await apiFetch('/api/integrations/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: `Key created ${new Date().toLocaleDateString()}` })
      })
      if (res.ok) {
        const newKey = await res.json()
        setApiKeys([newKey, ...apiKeys])
      }
    } catch (e) { console.error(e) }
  }

  const handleRevokeApiKey = async (id: string) => {
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/integrations/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setApiKeys(apiKeys.filter(k => k.id !== id))
    } catch (e) { console.error(e) }
  }

  const handleAddWebhook = async () => {
    const url = prompt('Enter webhook URL to receive post.published and post.failed events:')
    if (!url) return
    try {
      const token = await getToken()
      const res = await apiFetch('/api/integrations/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url })
      })
      if (res.ok) {
        const newWh = await res.json()
        setWebhooks([newWh, ...webhooks])
      }
    } catch (e) { console.error(e) }
  }

  const handleRevokeWebhook = async (id: string) => {
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/integrations/endpoints/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setWebhooks(webhooks.filter(w => w.id !== id))
    } catch (e) { console.error(e) }
  }

  const handleAddRss = async () => {
    if (!rssUrl) return
    setConnectingRss(true)
    try {
      const token = await getToken()
      const res = await apiFetch('/api/oauth/rss/manual-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ identifier: rssUrl, password: '' })
      })
      if (res.ok) {
        const channelsRes = await apiFetch('/api/channels', { headers: { Authorization: `Bearer ${token}` } })
        if (channelsRes.ok) {
          const allChannels = await channelsRes.json()
          setRssFeeds(allChannels.filter((c: any) => c.platform === 'rss'))
        }
        setShowRssModal(false)
        setRssUrl('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to connect RSS feed')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to connect RSS feed')
    } finally {
      setConnectingRss(false)
    }
  }

  const handleRemoveRss = async (id: string) => {
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/channels/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setRssFeeds(prev => prev.filter(r => r.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const togglePlugin = (id: string) => {
    setPluginToggles(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleAddInternalPlugin = () => {
    if (!internalPluginName || !internalPluginUrl) return
    setInternalPlugins(prev => [...prev, {
      id: `internal_${Date.now()}`,
      name: internalPluginName,
      url: internalPluginUrl,
      enabled: true
    }])
    setShowInternalPluginModal(false)
    setInternalPluginName('')
    setInternalPluginUrl('')
  }

  const removeInternalPlugin = (id: string) => {
    setInternalPlugins(prev => prev.filter(p => p.id !== id))
  }

  const handleConnectOpenClaw = async () => {
    try {
      const token = await getToken()
      const res = await apiFetch('/api/integrations/keys', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOpenclawKey(data.key)
        setOpenclawConnected(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = await getToken()
      if (activeSection === 'profile') {
        await apiFetch('/api/user/me', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ name: profile.name, avatarUrl: profile.avatarUrl })
        })
      } else if (activeSection === 'workspace' && workspace.id) {
        await apiFetch(`/api/workspaces/${workspace.id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ name: workspace.name })
        })
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
       console.error('Save failed', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Update your personal information and avatar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-primary p-0.5">
                      {(profile.avatarUrl && !profile.avatarUrl.includes('shadcn.png')) ? (
                        <img src={profile.avatarUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-3xl font-bold text-white/60">{profile.name?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                      )}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#141218] border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                      <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                      <Input value={profile.email} disabled className="opacity-50 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avatar URL</label>
                    <Input 
                      value={profile.avatarUrl} 
                      onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-bold text-white">Log Out</p>
                    <p className="text-xs text-muted-foreground mt-1">Sign out of your account on this device.</p>
                  </div>
                  <SignOutButton>
                    <Button variant="outline" size="sm" className="gap-2 hover:bg-white/10">
                      <LogOut className="w-3.5 h-3.5" /> Log out
                    </Button>
                  </SignOutButton>
                </div>

                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className="text-sm font-bold text-red-400">Danger Zone</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Once you delete your account, there is no going back. Please be certain.</p>
                  <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2">
                    <Trash2 className="w-3 h-3" /> Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'workspace':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>Customize your workspace name and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Workspace Name</label>
                <Input value={workspace.name} onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Workspace Slug</label>
                <div className="flex items-center gap-0 bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-purple-500/50 transition-colors">
                  <span className="px-3 py-2.5 text-sm text-muted-foreground border-r border-white/10 bg-white/5">socialflow.app/</span>
                  <input
                    value={workspace.slug}
                    disabled
                    className="flex-1 bg-transparent px-3 py-2.5 text-white/50 text-sm focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>Upgrade your workspace to unlock advanced features.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => (
                    <div key={plan.id} className={cn("p-4 rounded-xl border transition-all", plan.current ? "bg-gradient-primary/10 border-purple-500/30" : "bg-white/5 border-white/10 hover:border-white/20")}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-white">{plan.name}</h3>
                        {workspace.plan === plan.name.toUpperCase() && <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">CURRENT</span>}
                      </div>
                      <p className="text-2xl font-bold text-white mb-4">{plan.price}</p>
                      <ul className="space-y-2 mb-4">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-green-400 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        variant={workspace.plan === plan.name.toUpperCase() ? "outline" : "default"} 
                        size="sm" 
                        className="w-full" 
                        disabled={workspace.plan === plan.name.toUpperCase()}
                        onClick={() => alert('Razorpay checkout integration pending environment variables.')}
                      >
                        {workspace.plan === plan.name.toUpperCase() ? 'Current Plan' : 'Upgrade Now'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control what alerts you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {Object.entries({
                postPublished: 'Post published successfully',
                postFailed: 'Post failed to publish',
                teamInvite: 'New team member joined',
                weeklyReport: 'Weekly performance report',
                aiUsage: 'AI usage limit warnings',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <p className="text-sm text-white">{label}</p>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    className={cn("w-11 h-6 rounded-full transition-all relative", notifications[key as keyof typeof notifications] ? "bg-gradient-primary shadow-glow" : "bg-white/10")}
                  >
                    <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", notifications[key as keyof typeof notifications] ? "left-6" : "left-1")} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )

      case 'queue':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Posting Queue</CardTitle>
              <CardDescription>Set your default publishing slots for automated scheduling.</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-white font-medium">Smart Queue coming soon</p>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">We're building a system to automatically find the best times to post for your audience.</p>
            </CardContent>
          </Card>
        )

      case 'integrations':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>RSS Feeds</CardTitle>
                  <CardDescription>Monitor blogs and news sources from your dashboard.</CardDescription>
                </div>
                <Button size="sm" className="gap-2" onClick={() => setShowRssModal(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add Feed
                </Button>
              </CardHeader>
              <CardContent>
                {rssFeeds.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8 italic">No RSS feeds connected yet.</p>
                ) : (
                  <div className="space-y-3">
                    {rssFeeds.map((feed: any) => (
                      <div key={feed.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center gap-4 group hover:border-white/20 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                          <Rss className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{feed.name || feed.displayName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{feed.manualHandle || feed.username}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/10 shrink-0"
                          onClick={() => handleRemoveRss(feed.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RSS Add Modal */}
            {showRssModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowRssModal(false)}>
                <div className="bg-[#141218] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Rss className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Add RSS Feed</h2>
                        <p className="text-xs text-muted-foreground">Monitor any RSS or Atom feed</p>
                      </div>
                    </div>
                    <button onClick={() => setShowRssModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Feed URL</label>
                      <input
                        type="text"
                        value={rssUrl}
                        onChange={(e) => setRssUrl(e.target.value)}
                        placeholder="https://example.com/feed.xml"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Enter the URL of any RSS or Atom feed. We'll fetch and display the latest entries on your dashboard — read-only.
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleAddRss}
                    disabled={!rssUrl || connectingRss}
                  >
                    {connectingRss ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect Feed'}
                  </Button>
                </div>
              </div>
            )}

            {/* Global & Internal Plugs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Plugins</CardTitle>
                  <CardDescription>Extend SocialFlow with global and custom integrations.</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowInternalPluginModal(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add Internal
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Global Plugins */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Global Plugins</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {globalPlugins.map(plugin => {
                      const Icon = plugin.icon
                      const enabled = pluginToggles[plugin.id] ?? plugin.enabled
                      return (
                        <div key={plugin.id} className={cn(
                          "p-4 rounded-xl border flex items-start gap-3 transition-all",
                          enabled ? "border-purple-500/30 bg-purple-500/5" : "border-white/10 bg-white/5"
                        )}>
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                            enabled ? "bg-purple-500/10 border-purple-500/30" : "bg-white/5 border-white/10"
                          )}>
                            <Icon className={cn("w-5 h-5", enabled ? "text-purple-400" : "text-white/40")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{plugin.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{plugin.description}</p>
                          </div>
                          <button
                            onClick={() => togglePlugin(plugin.id)}
                            className={cn(
                              "w-10 h-6 rounded-full relative shrink-0 transition-all mt-1",
                              enabled ? "bg-purple-500" : "bg-white/10"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow",
                              enabled ? "left-5" : "left-1"
                            )} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Internal Plugins */}
                {internalPlugins.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Internal Plugins</p>
                    <div className="space-y-2">
                      {internalPlugins.map(p => (
                        <div key={p.id} className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <LinkIcon className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.url}</p>
                          </div>
                          <button
                            onClick={() => removeInternalPlugin(p.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internal Plugin Add Modal */}
            {showInternalPluginModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowInternalPluginModal(false)}>
                <div className="bg-[#141218] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-bold text-white">Add Internal Plugin</h2>
                      <p className="text-xs text-muted-foreground">Connect a custom plugin endpoint</p>
                    </div>
                    <button onClick={() => setShowInternalPluginModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        value={internalPluginName}
                        onChange={(e) => setInternalPluginName(e.target.value)}
                        placeholder="My Custom Plugin"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Webhook URL</label>
                      <input
                        type="text"
                        value={internalPluginUrl}
                        onChange={(e) => setInternalPluginUrl(e.target.value)}
                        placeholder="https://your-service.com/webhook"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleAddInternalPlugin} disabled={!internalPluginName || !internalPluginUrl}>
                    Add Plugin
                  </Button>
                </div>
              </div>
            )}

            {/* OpenClaw Integration */}
            <Card>
              <CardHeader>
                <CardTitle>OpenClaw</CardTitle>
                <CardDescription>Connect SocialFlow to your OpenClaw AI agent gateway.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">OpenClaw Gateway</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Self-hosted AI agent gateway — run agents from any chat app.</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold",
                    openclawConnected ? "bg-green-500/10 text-green-400" : "bg-white/5 text-muted-foreground"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      openclawConnected ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" : "bg-white/20"
                    )} />
                    {openclawConnected ? 'Connected' : 'Not Connected'}
                  </div>
                </div>

                {openclawConnected && openclawKey && (
                  <div className="space-y-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Your SocialFlow API Key</p>
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                      <code className="text-xs text-green-400 font-mono flex-1 truncate">{openclawKey}</code>
                      <button onClick={() => navigator.clipboard.writeText(openclawKey!)} className="text-muted-foreground hover:text-white transition-colors shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[10px] text-muted-foreground space-y-1">
                      <p>Add this to your OpenClaw environment:</p>
                      <code className="block bg-black/30 rounded px-2 py-1 text-green-400 font-mono">echo 'SOCIALFLOW_API_KEY={openclawKey}' &gt;&gt; ~/.openclaw/.env</code>
                      <p className="mt-1">Then install the SocialFlow skill:</p>
                      <code className="block bg-black/30 rounded px-2 py-1 text-green-400 font-mono">npx clawhub@latest install socialflow/api</code>
                    </div>
                  </div>
                )}

                {!openclawConnected && (
                  <Button className="w-full" onClick={handleConnectOpenClaw}>
                    Generate API Key
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'api':
        return (
          <div className="space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage credentials for Zapier, Make, or custom integrations.</CardDescription>
                </div>
                <Button size="sm" className="gap-2" onClick={handleGenerateApiKey} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />} 
                  Generate New Key
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiKeys.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8 italic">No API keys generated yet.</p>
                ) : (
                  apiKeys.map((key) => (
                    <div key={key.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-white">{key.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Created: {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : 'Recently'}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 text-xs gap-1" onClick={() => handleRevokeApiKey(key.id)}>
                          <Trash2 className="w-3 h-3" /> Revoke
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                        <code className="text-xs text-green-400 font-mono flex-1">{key.key}</code>
                        <button onClick={() => navigator.clipboard.writeText(key.key)} className="text-muted-foreground hover:text-white transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Outbound Webhooks</CardTitle>
                  <CardDescription>Get notified when posts are published or fail.</CardDescription>
                </div>
                <Button size="sm" className="gap-2" onClick={handleAddWebhook} disabled={saving}>
                  <LinkIcon className="w-3.5 h-3.5" /> Add Webhook
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {webhooks.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8 italic">No webhooks configured.</p>
                ) : (
                  webhooks.map((wh) => (
                    <div key={wh.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                           <p className="text-sm font-bold text-white truncate max-w-[200px]">{wh.url}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 text-xs gap-1" onClick={() => handleRevokeWebhook(wh.id)}>
                          <Trash2 className="w-3 h-3" /> Remove
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        {(wh.events || []).map((ev: string) => (
                          <span key={ev} className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-muted-foreground border border-white/5">{ev}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">This section is coming soon.</p>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your SocialFlow experience.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-green-400" /> : null}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Nav */}
        <div className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group",
                activeSection === section.id ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <section.icon className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{section.title}</p>
              </div>
              <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0", activeSection === section.id && "opacity-100")} />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
