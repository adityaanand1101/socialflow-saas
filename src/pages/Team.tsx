import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@clerk/react'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/store/useStore'
import {
  UserPlus, Check, X, Activity, Mail, Copy, Link,
  Shield, Settings, UserMinus,
  Clock, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_PERMISSIONS = [
  { feature: 'Manage Channels', roles: { OWNER: true, ADMIN: true, MEMBER: false, VIEWER: false } },
  { feature: 'Schedule Posts', roles: { OWNER: true, ADMIN: true, MEMBER: true, VIEWER: false } },
  { feature: 'View Analytics', roles: { OWNER: true, ADMIN: true, MEMBER: true, VIEWER: true } },
  { feature: 'Invite Team', roles: { OWNER: true, ADMIN: true, MEMBER: false, VIEWER: false } },
  { feature: 'Remove Members', roles: { OWNER: true, ADMIN: true, MEMBER: false, VIEWER: false } },
  { feature: 'Change Roles', roles: { OWNER: true, ADMIN: false, MEMBER: false, VIEWER: false } },
  { feature: 'Workspace Settings', roles: { OWNER: true, ADMIN: true, MEMBER: false, VIEWER: false } },
  { feature: 'Delete Workspace', roles: { OWNER: true, ADMIN: false, MEMBER: false, VIEWER: false } },
]

const ROLE_BADGES: Record<string, string> = {
  OWNER: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  ADMIN: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  MEMBER: 'bg-green-500/20 border-green-500/30 text-green-400',
  VIEWER: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
}

function formatActivity(action: string): string {
  const actionLabels: Record<string, string> = {
    'workspace.created': 'Created workspace',
    'workspace.updated': 'Updated workspace settings',
    'member.invited': 'Invited member',
    'member.joined': 'Joined workspace',
    'member.removed': 'Removed member',
    'member.role_changed': 'Changed role',
    'invite.cancelled': 'Cancelled invite',
  }
  return actionLabels[action] || action
}

export const Team = () => {
  const { getToken } = useAuth()

  const [members, setMembers] = useState<Array<{ id: string; role: string; user: { id: string; name: string; email: string; avatarUrl: string | null } }>>([])
  const [pendingInvites, setPendingInvites] = useState<Array<{ id: string; email: string; role: string; expiresAt: string; status: string }>>([])
  const [activities, setActivities] = useState<Array<{ id: string; action: string; details: string | null; createdAt: string; user: { id: string; name: string; email: string; avatarUrl: string | null } | null }>>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const [permissions, setPermissions] = useState(
    DEFAULT_PERMISSIONS.map(p => ({ ...p, roles: { ...p.roles } }))
  )

  const [editingWorkspaceName, setEditingWorkspaceName] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [savingWorkspace, setSavingWorkspace] = useState(false)

  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'
  const canChangeRoles = currentUserRole === 'OWNER'
  const canEditPermissions = currentUserRole === 'OWNER'
  const { workspaces, setWorkspaces } = useStore()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) { setLoading(false); return }

      const userRes = await apiFetch('/api/user/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!userRes.ok) { setError('Failed to load user data'); setLoading(false); return }
      const user = await userRes.json()
      const wsId = user.memberships?.[0]?.workspaceId
      if (!wsId) { setError('No workspace found'); setLoading(false); return }

      setActiveWorkspaceId(wsId)
      setCurrentUserRole(user.memberships[0].role)
      setWorkspaceName(user.memberships[0].workspace.name)

      const [membersRes, invitesRes, activityRes] = await Promise.all([
        apiFetch(`/api/workspaces/${wsId}/members`, { headers: { Authorization: `Bearer ${token}` } }),
        canManage
          ? apiFetch(`/api/workspaces/${wsId}/invites`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
        apiFetch(`/api/workspaces/${wsId}/activity`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (membersRes.ok) setMembers(await membersRes.json())
      if (invitesRes && invitesRes.ok) setPendingInvites(await invitesRes.json())
      if (activityRes.ok) setActivities(await activityRes.json())
    } catch (err) {
      console.error(err)
      setError('Network error loading team data')
    } finally {
      setLoading(false)
    }
  }, [getToken, canManage])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const handleSendInvite = async () => {
    if (!activeWorkspaceId) return
    setInviteError(null)
    setGeneratedLink('')
    try {
      const token = await getToken()
      const body: any = { role: inviteRole }
      if (inviteEmail.trim()) body.email = inviteEmail.trim()

      const res = await apiFetch(`/api/workspaces/${activeWorkspaceId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        const data = await res.json()
        setInviteSent(true)
        setGeneratedLink(data.inviteLink || '')
        fetchData()
        setTimeout(() => {
          setInviteSent(false)
        }, 2000)
      } else {
        const errorData = await res.json()
        setInviteError(errorData.error || 'Failed to send invite')
      }
    } catch {
      setInviteError('Network error while sending invite')
    }
  }

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!activeWorkspaceId) return
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/workspaces/${activeWorkspaceId}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      })
      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from workspace?`)) return
    if (!activeWorkspaceId) return
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/workspaces/${activeWorkspaceId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    if (!activeWorkspaceId) return
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/workspaces/${activeWorkspaceId}/invites/${inviteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveWorkspaceName = async () => {
    if (!activeWorkspaceId || !newWorkspaceName.trim()) return
    setSavingWorkspace(true)
    try {
      const token = await getToken()
      const res = await apiFetch(`/api/workspaces/${activeWorkspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newWorkspaceName })
      })
      if (res.ok) {
        const data = await res.json()
        setWorkspaceName(data.name)
        setEditingWorkspaceName(false)
        setWorkspaces(workspaces.map((w: any) => w.id === data.id ? { ...w, name: data.name } : w))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingWorkspace(false)
    }
  }

  const togglePermission = (featureIdx: number, role: string) => {
    if (!canEditPermissions || role === 'OWNER') return
    setPermissions(prev => prev.map((p, i) =>
      i === featureIdx ? { ...p, roles: { ...p.roles, [role]: !p.roles[role as keyof typeof p.roles] } } : p
    ))
  }

  const resetPermissions = () => {
    setPermissions(DEFAULT_PERMISSIONS.map(p => ({ ...p, roles: { ...p.roles } })))
  }

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Team Collaboration</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace members and permissions.</p>
        </div>
        {canManage && (
          <Button className="gap-2" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && (generatedLink ? setShowInviteModal(false) : null)}>
          <div className="bg-[#141218] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
                <p className="text-sm text-muted-foreground mt-1">Generate a link to share with your teammate.</p>
              </div>
              <button onClick={() => { setShowInviteModal(false); setGeneratedLink(''); setInviteEmail('') }} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {generatedLink ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400 font-medium">Invite link generated!</p>
                  <p className="text-xs text-green-400/60 mt-1">Expires in 7 days</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 bg-transparent text-white text-xs focus:outline-none truncate"
                  />
                  <button
                    onClick={() => copyInviteLink(generatedLink)}
                    className="shrink-0 p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {copiedLink ? 'Copied!' : 'Share this link with your teammate.'}
                </p>
                <Button className="w-full" onClick={() => { setShowInviteModal(false); setGeneratedLink(''); setInviteEmail('') }}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email <span className="font-normal normal-case opacity-50">(optional)</span></label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-purple-500/50 transition-colors">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com — leave blank for link-only"
                      className="flex-1 bg-transparent py-3 text-white placeholder:text-white/30 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['ADMIN', 'MEMBER', 'VIEWER'].map(role => (
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
                    ))}
                  </div>
                </div>

                {inviteError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> {inviteError}
                  </p>
                )}
              </div>
            )}

            {!generatedLink && (
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                <Button className="flex-1 gap-2" onClick={handleSendInvite} disabled={inviteSent}>
                  {inviteSent ? <><Check className="w-4 h-4" /> Created!</> : <><Link className="w-4 h-4" /> Generate Link</>}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Workspace Settings */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  Workspace
                </CardTitle>
                <CardDescription>Manage your workspace settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {editingWorkspaceName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newWorkspaceName}
                          onChange={(e) => setNewWorkspaceName(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        />
                        <Button size="sm" onClick={handleSaveWorkspaceName} disabled={savingWorkspace}>
                          {savingWorkspace ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingWorkspaceName(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white font-semibold">{workspaceName}</p>
                        <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                      </div>
                    )}
                  </div>
                  {canManage && !editingWorkspaceName && (
                    <Button variant="ghost" size="sm" onClick={() => { setNewWorkspaceName(workspaceName); setEditingWorkspaceName(true) }}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Members ({members.length})</CardTitle>
              <CardDescription>People with access to this workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No members found.</p>
                ) : (
                  (['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const).map(roleGroup => {
                    const group = members.filter((m: any) => m.role === roleGroup)
                    if (group.length === 0) return null
                    return (
                      <div key={roleGroup}>
                        <div className="flex items-center gap-2 px-1 py-2">
                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border", ROLE_BADGES[roleGroup])}>
                            {roleGroup}
                          </span>
                          <span className="text-[11px] text-muted-foreground">({group.length})</span>
                        </div>
                        {group.map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-3 pl-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors mb-1">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 border border-white/10">
                                <AvatarImage src={member.user.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs">{(member.user.name || member.user.email)[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-white">{member.user.name || member.user.email}</p>
                                <p className="text-xs text-muted-foreground">{member.user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {member.role === 'OWNER' ? (
                                <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border opacity-60", ROLE_BADGES['OWNER'])}>
                                  OWNER
                                </div>
                              ) : canChangeRoles && roleGroup === member.role ? (
                                <select
                                  value={member.role}
                                  onChange={(e) => handleChangeRole(member.id, e.target.value)}
                                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
                                >
                                  {['ADMIN', 'MEMBER', 'VIEWER'].map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              ) : null}
                              {canManage && member.role !== 'OWNER' && (
                                <button
                                  onClick={() => handleRemoveMember(member.id, member.user.name || member.user.email)}
                                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invites */}
          {canManage && pendingInvites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invites ({pendingInvites.length})</CardTitle>
                <CardDescription>Invitations that have not been accepted yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-white">{invite.email}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className={cn("px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider border", ROLE_BADGES[invite.role])}>
                              {invite.role}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires {new Date(invite.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Permissions Matrix
              </CardTitle>
              <CardDescription>Define what each role can do in the workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      <th className="pb-4 pr-4">Feature</th>
                      <th className="pb-4 text-center">Owner</th>
                      <th className="pb-4 text-center">Admin</th>
                      <th className="pb-4 text-center">Member</th>
                      <th className="pb-4 text-center">Viewer</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {permissions.map(({ feature, roles }, fi) => (
                      <tr key={feature} className="border-b border-white/5 group">
                        <td className="py-4 pr-4 text-white font-medium whitespace-nowrap">{feature}</td>
                        {(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const).map(role => {
                          const enabled = roles[role]
                          const canToggle = canEditPermissions && role !== 'OWNER'
                          return (
                            <td
                              key={role}
                              onClick={() => togglePermission(fi, role)}
                              className={cn(
                                "py-4 text-center transition-colors",
                                canToggle ? "cursor-pointer hover:bg-white/5" : "cursor-default"
                              )}
                            >
                              {canToggle ? (
                                <div className={cn(
                                  "w-6 h-6 mx-auto rounded-md border transition-all flex items-center justify-center",
                                  enabled
                                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                                    : "bg-white/5 border-white/10 text-red-400/40 hover:border-white/20"
                                )}>
                                  {enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                </div>
                              ) : (
                                enabled
                                  ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                                  : <X className="w-4 h-4 text-red-400/60 mx-auto" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {canEditPermissions && (
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={resetPermissions} className="text-xs text-muted-foreground">
                    Reset to Defaults
                  </Button>
                </div>
              )}
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
            <CardContent>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No recent activity.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <Avatar className="w-6 h-6 mt-0.5 border border-white/10">
                        <AvatarImage src={activity.user?.avatarUrl || undefined} />
                        <AvatarFallback className="text-[8px]">{(activity.user?.name || activity.user?.email || '?')[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium">
                          {activity.user?.name || activity.user?.email || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatActivity(activity.action)}
                          {activity.details && activity.user?.name && !activity.details.startsWith(activity.user.name) && (
                            <> — {activity.details}</>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
