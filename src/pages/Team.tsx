import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  UserPlus, 
  MoreVertical, 
  Check,
  X,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

const members = [
  { id: '1', name: 'Aditya Anand', email: 'aditya@socialflow.ai', role: 'Owner', avatar: 'https://github.com/shadcn.png' },
  { id: '2', name: 'Sara Smith', email: 'sara@socialflow.ai', role: 'Editor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128' },
  { id: '3', name: 'John Doe', email: 'john@socialflow.ai', role: 'Analyst', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=128' },
]

const activityLog = [
  { id: '1', user: 'Aditya Anand', action: 'scheduled a new post for', target: 'Instagram', time: '10m ago' },
  { id: '2', user: 'Sara Smith', action: 'edited the caption of', target: 'LinkedIn post', time: '1h ago' },
  { id: '3', user: 'John Doe', action: 'exported a report for', target: 'Q2 Analytics', time: '3h ago' },
]

export const Team = () => {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Team Collaboration</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace members and permissions.</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Members</CardTitle>
              <CardDescription>People with access to this socialflow workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-white">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
                        member.role === 'Owner' ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-white/5 border-white/10 text-muted-foreground"
                      )}>
                        {member.role}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Matrix (Simplified) */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Permissions Matrix</CardTitle>
              <CardDescription>Define what each role can do in the workspace.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="relative overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-white/10 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                       <th className="pb-4">Feature</th>
                       <th className="pb-4 text-center">Owner</th>
                       <th className="pb-4 text-center">Editor</th>
                       <th className="pb-4 text-center">Viewer</th>
                     </tr>
                   </thead>
                   <tbody className="text-sm">
                     {['Manage Channels', 'Schedule Posts', 'View Analytics', 'Invite Team'].map((feature) => (
                       <tr key={feature} className="border-b border-white/5 group">
                         <td className="py-4 text-white font-medium">{feature}</td>
                         <td className="py-4 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                         <td className="py-4 text-center">
                            {feature === 'Invite Team' || feature === 'Manage Channels' ? <X className="w-4 h-4 text-red-400 mx-auto" /> : <Check className="w-4 h-4 text-green-400 mx-auto" />}
                         </td>
                         <td className="py-4 text-center">
                            {feature === 'View Analytics' ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Log Sidebar */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Real-time updates from your team.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
               {activityLog.map((log) => (
                 <div key={log.id} className="relative pl-6 border-l-2 border-white/5 pb-6 last:pb-0">
                    <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                    <p className="text-xs text-white leading-relaxed">
                      <span className="font-bold text-purple-400">{log.user}</span> {log.action} <span className="font-bold">{log.target}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">{log.time}</p>
                 </div>
               ))}
               <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-white">View Full Audit Log</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
