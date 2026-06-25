import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SocialPlatform } from '@/store/useStore'
import { ALL_PLATFORMS } from '@/lib/platforms'
import { Circle } from 'lucide-react'

interface AccountItem {
  id: string
  platform: SocialPlatform
  name: string
  username: string
  avatar: string
  followers: number
}

interface PlatformSelectorProps {
  availablePlatforms: any[]
  selectedPlatforms: SocialPlatform[]
  navigate: (path: string) => void
  connectedAccounts: AccountItem[]
  selectedAccountIds: string[]
  toggleAccount: (accountId: string) => void
}

function AccountAvatar({ name, avatar, platformIcon: AccIcon, platformColor }: { name: string; avatar: string; platformIcon: React.ComponentType<any>; platformColor: string }) {
  const [error, setError] = React.useState(false)
  if (!avatar || error) {
    return (
      <div className="relative shrink-0">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-[11px] font-bold text-white">
          {name[0]?.toUpperCase() || '?'}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0F1117] flex items-center justify-center ring-1 ring-white/[0.06]">
          <AccIcon className={cn("w-2 h-2", platformColor)} />
        </div>
      </div>
    )
  }
  return (
    <div className="relative shrink-0">
      <img src={avatar} onError={() => setError(true)} alt="" className="w-7 h-7 rounded-full object-cover" />
      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0F1117] flex items-center justify-center ring-1 ring-white/[0.06]">
        <AccIcon className={cn("w-2 h-2", platformColor)} />
      </div>
    </div>
  )
}

export default function PlatformSelector({
  availablePlatforms,
  selectedPlatforms,
  navigate,
  connectedAccounts,
  selectedAccountIds,
  toggleAccount,
}: PlatformSelectorProps) {
  const platformAccounts = new Map<SocialPlatform, AccountItem[]>()
  for (const acc of connectedAccounts) {
    const existing = platformAccounts.get(acc.platform) || []
    existing.push(acc)
    platformAccounts.set(acc.platform, existing)
  }

  return (
    <Card className="border-white/[0.07] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-white">Accounts</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {selectedPlatforms.length === 0
                ? 'Select accounts to publish to'
                : `${selectedAccountIds.length} account${selectedAccountIds.length !== 1 ? 's' : ''} selected`}
            </CardDescription>
          </div>
          {selectedPlatforms.length > 0 && (
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
              {selectedPlatforms.length} / {availablePlatforms.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {availablePlatforms.length === 0 ? (
          <div className="text-center py-8 mesh-gradient rounded-xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
              <Circle className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">No channels connected yet.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/channels')}>
              Connect a Channel
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {availablePlatforms.map(p => {
              const platform = ALL_PLATFORMS.find(x => x.id === p.id)
              if (!platform) return null
              const AccIcon = platform.icon
              const accounts = platformAccounts.get(p.id as SocialPlatform) || []
              const anySelected = accounts.some(a => selectedAccountIds.includes(a.id))
              return (
                <div key={p.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: anySelected ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.06)', background: anySelected ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.02)' }}
                >
                  <AccIcon className={cn("w-3.5 h-3.5", platform.color)} />
                  <div className="flex -space-x-1">
                    {accounts.slice(0, 4).map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => toggleAccount(acc.id)}
                        className={cn(
                          "rounded-full transition-opacity hover:opacity-80",
                          selectedAccountIds.includes(acc.id) ? "ring-1 ring-purple-500" : "opacity-60"
                        )}
                        title={acc.name}
                      >
                        <AccountAvatar name={acc.name} avatar={acc.avatar} platformIcon={AccIcon} platformColor={platform.color} />
                      </button>
                    ))}
                    {accounts.length > 4 && (
                      <span className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] text-muted-foreground ring-1 ring-white/[0.06]">
                        +{accounts.length - 4}
                      </span>
                    )}
                  </div>
                  {accounts.length === 0 && (
                    <span className="text-[10px] text-muted-foreground">No accounts</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
