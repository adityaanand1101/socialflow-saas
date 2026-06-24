import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SocialPlatform } from '@/store/useStore'
import { PLATFORM_CONSTRAINTS } from '@/lib/platformConstraints'

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Select Platforms</CardTitle>
        <CardDescription>Choose where you want to publish this post.</CardDescription>
      </CardHeader>
      <CardContent>
        {availablePlatforms.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">No channels connected yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/channels')}
              className="text-xs"
            >
              Connect a Channel
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availablePlatforms.map((p: any) => {
              const c = PLATFORM_CONSTRAINTS[p.id]
              const selected = selectedPlatforms.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "group relative flex flex-col items-start px-3 py-2 rounded-lg border transition-all text-left",
                    selected
                      ? "bg-gradient-primary border-transparent text-white shadow-glow"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                  )}
                >
                  {selected && isCustomized(p.id) && (
                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-purple-400 border-2 border-[#0F1117] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <p.icon className={cn("w-4 h-4", !selected && p.color)} />
                    <span className="text-sm font-medium whitespace-nowrap">{p.label}</span>
                  </div>
                  {c && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn("text-[9px] uppercase font-bold tracking-wider", selected ? "text-white/70" : "text-muted-foreground/60")}>
                        {c.maxChars < 10000 ? `${c.maxChars}c` : '\u221E'}
                      </span>
                      <span className={cn("text-[9px]", selected ? "text-white/50" : "text-muted-foreground/40")}>·</span>
                        <span className={cn("text-[9px] uppercase font-bold tracking-wider", selected ? "text-white/70" : "text-muted-foreground/60")}>
                          {c.mediaType === 'none' ? 'No media' : c.mediaType === 'video' ? 'Video only' : c.mediaType === 'image' ? 'Image' : 'Media'}
                        </span>
                        {c.allowCarousel && (
                          <>
                            <span className={cn("text-[9px]", selected ? "text-white/50" : "text-muted-foreground/40")}>·</span>
                          <span className={cn("text-[9px] uppercase font-bold tracking-wider", selected ? "text-white/70" : "text-muted-foreground/60")}>
                            Carousel
                          </span>
                        </>
                      )}
                    </div>
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
