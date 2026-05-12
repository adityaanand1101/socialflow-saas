import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  User, 
  Globe, 
  CreditCard, 
  Bell, 
  Clock, 
  Link as LinkIcon, 
  Key, 
  Trash2,
  ChevronRight,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'profile', icon: User, title: 'Profile', description: 'Personal information and security.' },
  { id: 'workspace', icon: Globe, title: 'Workspace', description: 'Branding and domain settings.' },
  { id: 'billing', icon: CreditCard, title: 'Billing', description: 'Manage plans and invoices.' },
  { id: 'notifications', icon: Bell, title: 'Notifications', description: 'Email and push alerts.' },
  { id: 'queue', icon: Clock, title: 'Posting Queue', description: 'Default publishing schedules.' },
  { id: 'integrations', icon: LinkIcon, title: 'Integrations', description: 'Connect Zapier, Slack, etc.' },
  { id: 'api', icon: Key, title: 'API Keys', description: 'Developer access and webhooks.' },
]

export const Settings = () => {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your SocialFlow experience.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group",
                section.id === 'profile' ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <section.icon className="w-4 h-4" />
              <div className="flex-1">
                 <p className="text-sm font-semibold">{section.title}</p>
              </div>
              <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", section.id === 'profile' && "opacity-100")} />
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-white/10">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Delete Workspace</span>
            </button>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Profile</CardTitle>
              <CardDescription>This information is visible to all team members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="shrink-0 flex flex-col items-center gap-3">
                   <div className="w-24 h-24 rounded-2xl bg-gradient-primary p-1">
                      <div className="w-full h-full rounded-[14px] bg-navy-800 flex items-center justify-center text-3xl font-bold text-white">SF</div>
                   </div>
                   <Button variant="outline" size="sm">Change Logo</Button>
                </div>
                <div className="flex-1 space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Workspace Name</label>
                        <Input defaultValue="SocialFlow HQ" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Workspace URL</label>
                        <Input defaultValue="app.socialflow.ai/hq" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Industry</label>
                      <Input defaultValue="Marketing Agency" />
                   </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-white/10">
                 <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                   <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                   <CardTitle>Whitelabel Branding</CardTitle>
                   <CardDescription>Customize the dashboard with your brand colors.</CardDescription>
                </div>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-sm text-white">Primary Color</span>
                         <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#7C3AED</span>
                            <div className="w-6 h-6 rounded bg-[#7C3AED] border border-white/20" />
                         </div>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm text-white">Accent Color</span>
                         <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#EC4899</span>
                            <div className="w-6 h-6 rounded bg-[#EC4899] border border-white/20" />
                         </div>
                      </div>
                   </div>
                   <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-3">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-red-500" />
                         <div className="w-3 h-3 rounded-full bg-yellow-500" />
                         <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <div className="h-20 w-full rounded bg-white/5 flex items-center justify-center">
                         <div className="w-1/2 h-2 bg-gradient-primary rounded-full blur-[2px]" />
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground">Live Theme Preview</p>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
