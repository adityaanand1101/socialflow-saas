import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  User, Globe, CreditCard, Bell, Clock, Link as LinkIcon, Key, Trash2,
  ChevronRight, Loader2, Check, Camera, AlertTriangle, ExternalLink, Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@clerk/react'
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

            // Fetch API keys and webhooks
            const [keysRes, whRes] = await Promise.all([
               apiFetch('/api/integrations/keys', { headers: { Authorization: `Bearer ${token}` } }),
               apiFetch('/api/integrations/endpoints', { headers: { Authorization: `Bearer ${token}` } })
            ])
            if (keysRes.ok) setApiKeys(await keysRes.json())
            if (whRes.ok) setWebhooks(await whRes.json())
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
                      <img src={profile.avatarUrl || "https://github.com/shadcn.png"} alt="Profile" className="w-full h-full rounded-full object-cover" />
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

              {/* Danger Zone */}
              <div className="pt-6 border-t border-white/10">
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
          <Card>
            <CardHeader>
              <CardTitle>App Integrations</CardTitle>
              <CardDescription>Connect SocialFlow with your favorite tools.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Zapier', description: 'Automate workflows with 5,000+ apps.', icon: ExternalLink },
                  { name: 'Slack', description: 'Get notifications directly in your team channels.', icon: LinkIcon },
                  { name: 'Google Drive', description: 'Import media directly from your drive.', icon: Globe },
                  { name: 'Dropbox', description: 'Sync assets from your Dropbox folders.', icon: Camera },
                ].map((app) => (
                  <div key={app.name} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-4 group hover:border-white/20 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                      <app.icon className="w-5 h-5 text-white/60 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{app.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{app.description}</p>
                      <Button variant="ghost" size="sm" className="mt-3 h-8 text-[10px] uppercase font-bold tracking-wider text-purple-400 p-0 hover:bg-transparent">
                        Connect <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                          <p className="text-[10px] text-muted-foreground mt-0.5">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
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
                        {wh.events.map((ev: string) => (
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
