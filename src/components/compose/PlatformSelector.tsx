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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/channels')}
            >
              Connect a Channel
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {availablePlatforms.map(p => {
              const platform = ALL_PLATFORMS.find(x => x.id === p.id)
              if (!platform) return null
              const AccIcon = platform.icon
              const accounts = platformAccounts.get(p.id as SocialPlatform) || []
              return (
                <div key={p.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <AccIcon className={cn("w-4 h-4", platform.color)} />
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{platform.label}</span>
                    <span className="text-[10px] text-muted-foreground">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {accounts.map(acc => {
                      const selected = selectedAccountIds.includes(acc.id)
                      return (
                        <button
                          key={acc.id}
                          onClick={() => toggleAccount(acc.id)}
                          className={cn(
                            "group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all duration-200",
                            selected
                              ? "border-purple-500/30 bg-purple-500/10 shadow-sm"
                              : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                          )}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={acc.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0F1117] flex items-center justify-center ring-1 ring-white/[0.06]">
                              <AccIcon className={cn("w-2.5 h-2.5", platform.color)} />
                            </div>
                          </div>
                          <div className="text-left">
                            <div className={cn("text-sm font-medium leading-tight", selected ? "text-white" : "text-muted-foreground")}>
                              {acc.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground/60">
                              @{acc.username}
                            </div>
                          </div>
                          {selected && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 absolute top-1 right-1" />
                          )}
                        </button>
                      )
                    })}
                    {accounts.length === 0 && (
                      <p className="text-xs text-muted-foreground px-2 py-1">No accounts</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
