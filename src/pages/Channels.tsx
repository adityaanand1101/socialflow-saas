import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Plus, 
  MoreVertical,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { Instagram, Linkedin, Twitter } from '@/components/icons'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

export const Channels = () => {
  const { channels } = useStore()

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Social Channels</h1>
          <p className="text-muted-foreground mt-1">Connect and manage your social media identities.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Connect New Channel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <Card key={channel.id} className="relative overflow-hidden group hover:border-white/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                 {channel.platform === 'instagram' && <Instagram className="w-6 h-6 text-pink-400" />}
                 {channel.platform === 'linkedin' && <Linkedin className="w-6 h-6 text-blue-400" />}
                 {channel.platform === 'x' && <Twitter className="w-6 h-6 text-white" />}
               </div>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                 <MoreVertical className="w-4 h-4" />
               </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 border-2 border-white/10">
                  <AvatarImage src={channel.avatar} />
                  <AvatarFallback>{channel.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-white">{channel.name}</h3>
                  <p className="text-xs text-muted-foreground">{channel.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                  <p className="text-lg font-bold text-white">{channel.followers.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Followers</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                  <p className="text-lg font-bold text-white">{channel.engagementRate}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Engagement</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    channel.status === 'connected' ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-red-400"
                  )} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                    {channel.status}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 hover:bg-white/5">
                  <RefreshCw className="w-3 h-3" />
                  Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <button className="h-full min-h-[250px] rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-4 group">
           <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gradient-primary transition-all">
             <Plus className="w-6 h-6 text-muted-foreground group-hover:text-white" />
           </div>
           <div className="text-center">
             <p className="text-sm font-bold text-white">Add New Channel</p>
             <p className="text-xs text-muted-foreground px-8 mt-1">Connect Pinterest, TikTok, or YouTube to expand your reach.</p>
           </div>
        </button>
      </div>

      {/* Connection Status Section */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
         <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                 <CheckCircle2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                 <h4 className="font-bold text-white">All systems operational</h4>
                 <p className="text-sm text-muted-foreground mt-1">Your social tokens are fresh. No action required.</p>
              </div>
           </div>
           <Button className="bg-white/10 hover:bg-white/20 text-white border-none shrink-0">
             Check API Status
           </Button>
         </CardContent>
      </Card>
    </div>
  )
}
