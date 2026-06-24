import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SocialPlatform } from '@/store/useStore'
import { PLATFORM_CONSTRAINTS } from '@/lib/platformConstraints'
import { Circle } from 'lucide-react'

interface PlatformSelectorProps {
  availablePlatforms: any[]
  selectedPlatforms: SocialPlatform[]
  togglePlatform: (id: SocialPlatform) => void
  navigate: (path: string) => void
  isCustomized: (pid: string) => boolean
}

export default function PlatformSelector({
  availablePlatforms,
  selectedPlatforms,
  togglePlatform,
  navigate,
  isCustomized,
}: PlatformSelectorProps) {
  return (
    <Card className="border-white/[0.07] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-white">Platforms</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {selectedPlatforms.length === 0
                ? 'Select where to publish'
                : `${selectedPlatforms.length} selected`}
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
          <div className="flex flex-wrap gap-2">
            {availablePlatforms.map((p: any) => {
              const c = PLATFORM_CONSTRAINTS[p.id]
              const selected = selectedPlatforms.includes(p.id)
              const custom = isCustomized(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200",
                    selected
                      ? "border-purple-500/30 bg-purple-500/10 shadow-sm"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                  )}
                >
                  {custom && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0F1117]" />
                  )}
                  <p.icon className={cn("w-4 h-4 shrink-0", selected ? "text-white" : p.color)} />
                  <span className={cn(
                    "text-sm font-medium whitespace-nowrap transition-colors",
                    selected ? "text-white" : "text-muted-foreground"
                  )}>
                    {p.label}
                  </span>
                  {selected && c && (
                    <span className="text-[9px] font-bold text-white/50 bg-white/[0.06] px-1.5 py-0.5 rounded-md ml-0.5">
                      {c.maxChars < 10000 ? `${c.maxChars}c` : '\u221E'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
