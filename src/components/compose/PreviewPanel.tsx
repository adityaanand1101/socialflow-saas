import { Monitor, Smartphone, Check, X as XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SocialPlatform } from '@/store/useStore'
import { ALL_PLATFORMS } from '@/lib/platforms'
import { getPlatformConstraint, getDefaultContentType } from '@/lib/platformConstraints'
import { getPlatformPreview } from '@/components/PlatformPreviews'

const ASPECT_CLASSES: Record<string, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '4:3': 'aspect-[4/3]',
  '2:3': 'aspect-[2/3]',
  '3:2': 'aspect-[3/2]',
  '1:3.5': 'aspect-[1/3.5]',
  '*': 'aspect-video',
}

interface PreviewPanelProps {
  selectedPlatforms: SocialPlatform[]
  activePreviewPlatform: string
  setActivePreviewPlatform: (v: string) => void
  previewDevice: 'mobile' | 'desktop'
  setPreviewDevice: (v: 'mobile' | 'desktop') => void
  activePlatform: string
  getCaptionForPlatform: (pid: string) => string
  mediaFiles: string[]
  mediaTypes: Record<string, string>
  mediaInfo: { url: string; type: 'image' | 'video' }[]
  getStructuredContent: (pid: string) => Record<string, string>
  postTypes: Record<string, string>
  getDefaultContentType: (pid: string) => string
  guessMediaType: (url: string, typesMap?: Record<string, string>) => 'image' | 'video'
  firstComments?: Record<string, string>
}

export default function PreviewPanel({
  selectedPlatforms,
  activePreviewPlatform,
  setActivePreviewPlatform,
  previewDevice,
  setPreviewDevice,
  activePlatform,
  getCaptionForPlatform,
  mediaFiles,
  mediaTypes,
  mediaInfo,
  getStructuredContent,
  postTypes,
  guessMediaType,
  firstComments,
}: PreviewPanelProps) {
  const activeConstraints = getPlatformConstraint(activePlatform)
  const previewIsVideo = mediaInfo.length > 0 && mediaInfo[0].type === 'video'
  const previewRatio = activeConstraints.imageRatios.includes('*')
    ? 'aspect-video'
    : ASPECT_CLASSES[activeConstraints.imageRatios[0]] || 'aspect-square'
  const previewRatioClass = previewIsVideo && activeConstraints.videoRatios.length > 0 && activeConstraints.videoRatios[0] !== '*'
    ? ASPECT_CLASSES[activeConstraints.videoRatios[0]] || 'aspect-video'
    : previewRatio

  const p = ALL_PLATFORMS.find(x => x.id === activePlatform)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Preview</h2>
        <div className="flex items-center gap-2">
          {selectedPlatforms.length > 1 && (
            <div className="flex gap-0.5 p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06] overflow-x-auto max-w-[240px] scrollbar-thin">
              {selectedPlatforms.map(pid => {
                const pl = ALL_PLATFORMS.find(x => x.id === pid)
                if (!pl) return null
                const Icon = pl.icon
                return (
                  <button
                    key={pid}
                    onClick={() => setActivePreviewPlatform(pid)}
                    className={cn(
                      "p-1.5 rounded-md transition-all shrink-0",
                      activePreviewPlatform === pid ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                    )}
                    title={pl.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={cn("p-1.5 rounded-md transition-all", previewDevice === 'mobile' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={cn("p-1.5 rounded-md transition-all", previewDevice === 'desktop' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.06]">
        {p && (() => {
          const Icon = p.icon
          const c = activeConstraints
          return (
            <>
              <Icon className={cn("w-4 h-4", p.color)} />
              <span className="text-sm font-medium text-white">{p.label}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">{c.maxChars < 10000 ? `${c.maxChars} char limit` : 'Unlimited chars'}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">
                {c.mediaType === 'none' ? 'No media' :
                 c.mediaType === 'video' ? 'Video only' :
                 c.mediaType === 'image' ? 'Image only' :
                 `Up to ${c.maxImages} images`}
              </span>
            </>
          )
        })()}
      </div>

      <div className={cn(
        "relative bg-white/[0.02] rounded-2xl border border-white/[0.05] overflow-hidden",
        previewDevice === 'mobile' ? 'max-w-[400px] mx-auto' : ''
      )}>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-[0.08]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500 blur-[120px] rounded-full" />
        </div>

        <div className={cn("z-10 relative", previewDevice === 'mobile' ? 'p-4' : 'p-4')}>
          {(() => {
            const PreviewComponent = getPlatformPreview(activePlatform)
            return (
              <PreviewComponent
                caption={getCaptionForPlatform(activePlatform)}
                mediaUrls={mediaFiles}
                mediaTypes={mediaTypes}
                mediaInfo={mediaInfo}
                isMobile={previewDevice === 'mobile'}
                getRatioClass={() => previewRatioClass}
                structuredContent={getStructuredContent(activePlatform)}
                contentTypeId={postTypes[activePlatform] || getDefaultContentType(activePlatform)}
              />
            )
          })()}
        </div>
      </div>

      {firstComments?.[activePlatform] && (
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">First comment</p>
          <p className="text-sm text-white/80">{firstComments[activePlatform]}</p>
        </div>
      )}

      {mediaFiles.length > 0 && selectedPlatforms.length > 1 && (
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06]">
            <p className="text-[11px] font-semibold text-white uppercase tracking-wider">Media compatibility</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="p-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Platform</th>
                  {mediaFiles.map((_, i) => (
                    <th key={i} className="p-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">#{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedPlatforms.map(pid => {
                  const c = getPlatformConstraint(pid)
                  let imageIdx = 0
                  let videoIdx = 0
                  return (
                    <tr key={pid} className="border-b border-white/[0.04] last:border-none">
                      <td className="p-2.5 text-white font-medium">{pid}</td>
                      {mediaFiles.map((url, i) => {
                        const type = guessMediaType(url, mediaTypes)
                        let ok = true
                        let ratio = ''
                        if (type === 'image') {
                          if (c.mediaType === 'video') ok = false
                          else if (imageIdx >= c.maxImages) ok = false
                          else ratio = c.imageRatios[0] === '*' ? 'Any' : c.imageRatios[0]
                          imageIdx++
                        } else {
                          if (c.mediaType === 'image') ok = false
                          else if (c.maxVideos === 0) ok = false
                          else if (videoIdx >= c.maxVideos) ok = false
                          else ratio = c.videoRatios[0] === '*' ? 'Any' : c.videoRatios[0]
                          videoIdx++
                        }
                        return (
                          <td key={i} className="p-2.5 text-center">
                            {ok ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-400">
                                <Check className="w-3 h-3" />
                                {ratio}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400">
                                <XIcon className="w-3 h-3" />
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
