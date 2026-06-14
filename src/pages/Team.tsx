import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@clerk/react'
import { apiFetch } from '@/lib/api'
import { 
  UserPlus, 
  MoreVertical, 
  Check,
  X,
  Activity,
  Mail,
  Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const Team = () => {
  const { getToken } = useAuth()
  
  const [members, setMembers] = useState<any[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviteSent, setInviteSent] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    const fetchUserAndMembers = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await apiFetch('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const user = await res.json();
          if (user.memberships && user.memberships.length > 0) {
            const workspaceId = user.memberships[0].workspaceId;
            setActiveWorkspaceId(workspaceId);
            
            // In a real app we'd fetch from /api/workspaces/:id/members
            // For now, we only show the current user until the list-members endpoint is ready
            setMembers([
              {
                id: user.id,
                name: user.name || user.email,
                email: user.email,
                role: user.memberships[0].role,
                avatar: user.avatarUrl || 'https://github.com/shadcn.png'
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchUserAndMembers();
  }, [getToken]);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !activeWorkspaceId) return
    
    try {
      const token = await getToken();
      const res = await apiFetch(`/api/workspaces/${activeWorkspaceId}/invites`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });

      if (res.ok) {
        setInviteSent(true)
        setTimeout(() => {
          setInviteSent(false)
          setShowInviteModal(false)
          setInviteEmail('')
        }, 2000)
      } else {
        const errorData = await res.json();
        alert(`Failed to send invite: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while sending invite.');
    }
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/accept-invite?workspace=${activeWorkspaceId || 'socialflow'}`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Team Collaboration</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace members and permissions.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowInviteModal(true)}>
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}>
          <div className="bg-[#141218] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
                <p className="text-sm text-muted-foreground mt-1">They'll receive an email invitation.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-purple-500/50 transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="flex-1 bg-transparent py-3 text-white placeholder:text-white/30 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['ADMIN', 'MEMBER', 'VIEWER'].map(role => {
                    return (
                      <button
                        key={role}
                        onClick={() => setInviteRole(role)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                          inviteRole === role ? "bg-gradient-primary border-transparent" : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        <span className="text-xs font-semibold text-white">{role}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <button onClick={copyInviteLink} className="text-xs text-muted-foreground hover:text-purple-400 flex items-center gap-1.5 transition-colors">
                  {copiedLink ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedLink ? 'Link copied!' : 'Or copy invite link'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={handleSendInvite} disabled={!inviteEmail.trim() || inviteSent}>
                {inviteSent ? <><Check className="w-4 h-4" /> Sent!</> : <><Mail className="w-4 h-4" /> Send Invite</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Members</CardTitle>
              <CardDescription>People with access to this socialflow workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No members found.</p>
                ) : (
                  members.map((member) => (
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
                          member.role === 'OWNER' ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-white/5 border-white/10 text-muted-foreground"
                        )}>
                          {member.role}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Matrix (Simplified) */}
          <Card>
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
                       <th className="pb-4 text-center">Admin</th>
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
               <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground text-sm">No recent activity.</p>
               </div>
               <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-white" disabled>View Full Audit Log</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
