import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth, Show } from '@clerk/react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, Check, AlertCircle, Loader2, Mail } from 'lucide-react'

type InviteState = 'loading' | 'invalid' | 'valid' | 'accepting' | 'accepted' | 'error' | 'email_mismatch'

interface InviteData {
  workspaceId: string
  workspaceName: string
  role: string
  email: string
}

export const AcceptInvite = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const token = searchParams.get('token')
  const [state, setState] = useState<InviteState>(token ? 'loading' : 'invalid')
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [errorMsg, setErrorMsg] = useState(token ? '' : 'No invitation token provided.')

  useEffect(() => {
    if (!token) return

    const resolve = async () => {
      try {
        const res = await apiFetch(`/api/invites/resolve?token=${encodeURIComponent(token)}`)
        if (res.ok) {
          const data = await res.json()
          setInvite(data)
          setState('valid')
        } else {
          const err = await res.json().catch(() => ({ error: 'Invalid invite' }))
          setState('invalid')
          setErrorMsg(err.error || 'This invitation is invalid or has expired.')
        }
      } catch {
        setState('invalid')
        setErrorMsg('Network error. Please try again.')
      }
    }
    resolve()
  }, [token])

  const handleAccept = async () => {
    if (!token || !invite) return
    setState('accepting')

    try {
      const t = await getToken()
      if (!t) {
        setState('error')
        setErrorMsg('You must be signed in to accept this invitation.')
        return
      }

      const res = await apiFetch('/api/invites/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`
        },
        body: JSON.stringify({ token })
      })

      if (res.ok) {
        setState('accepted')
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to accept invite' }))
        if (err.error?.includes?.('different email')) {
          setState('email_mismatch')
          setErrorMsg(`This invitation was sent to ${err.invitedEmail || invite.email}, but you are signed in with a different email.`)
        } else {
          setState('error')
          setErrorMsg(err.error || 'Failed to accept invitation.')
        }
      }
    } catch {
      setState('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0f0d1a] to-[#141218] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="text-white w-7 h-7" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {state === 'loading' && 'Checking invitation...'}
            {state === 'invalid' && 'Invalid Invitation'}
            {state === 'valid' && `Join ${invite?.workspaceName || 'Workspace'}`}
            {state === 'accepting' && 'Accepting invitation...'}
            {state === 'accepted' && 'Welcome!'}
            {state === 'error' && 'Something went wrong'}
            {state === 'email_mismatch' && 'Email Mismatch'}
          </CardTitle>
          <CardDescription>
            {state === 'loading' && 'Verifying your invitation link...'}
            {state === 'invalid' && errorMsg}
            {state === 'valid' && `You've been invited to join with the role of `}
            {state === 'accepting' && 'Please wait...'}
            {state === 'accepted' && 'You are now a member of the workspace.'}
            {state === 'error' && errorMsg}
            {state === 'email_mismatch' && errorMsg}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === 'loading' && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          )}

          {state === 'valid' && invite && (
            <>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Invited as</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border bg-purple-500/20 border-purple-500/30 text-purple-400">
                    {invite.role}
                  </span>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {invite.email ? `Invite sent to ${invite.email}` : 'Anyone with this link can join'}
                </p>
              </div>

              <Show when="signed-in">
                <Button className="w-full gap-2" onClick={handleAccept}>
                  <Check className="w-4 h-4" />
                  Accept Invitation
                </Button>
                <div className="text-center">
                  <Button variant="link" className="text-xs text-muted-foreground" onClick={() => navigate('/app')}>
                    Go to Dashboard instead
                  </Button>
                </div>
              </Show>

              <Show when="signed-out">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-sm text-amber-400 text-center">
                    You need to sign in to accept this invitation.
                  </p>
                </div>
                <Button className="w-full" onClick={() => navigate('/sign-in')}>
                  Sign In
                </Button>
              </Show>
            </>
          )}

          {state === 'accepting' && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          )}

          {state === 'accepted' && (
            <Button className="w-full" onClick={() => navigate('/app')}>
              Go to Dashboard
            </Button>
          )}

          {state === 'invalid' && (
            <Button className="w-full" variant="outline" onClick={() => navigate('/')}>
              Go Home
            </Button>
          )}

          {(state === 'error' || state === 'email_mismatch') && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400 font-medium">
                  {state === 'email_mismatch' ? 'Email Mismatch' : 'Error'}
                </p>
                <p className="text-xs text-red-400/80 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
