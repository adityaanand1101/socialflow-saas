import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Image as ImageIcon, Hash, Send, Save, Sparkles, Clock, Upload,
  AlertTriangle, Trash2, Lock, Plus, GripVertical, Link2, X, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SocialPlatform } from '@/store/useStore'
import { ALL_PLATFORMS } from '@/lib/platforms'
import {
  getContentTypes, getContentType, getPlatformConstraint, getPlatformWarnings,
  getDefaultContentType
} from '@/lib/platformConstraints'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { stripHtml } from '@/lib/htmlUtils'
import { MediaSection } from './MediaSection'
import type { MediaInfo } from '@/lib/platformConstraints'

const toneOptions = ['Professional', 'Casual', 'Funny', 'Inspirational', 'Urgent']

function guessMediaType(url: string, typesMap?: Record<string, string>): 'image' | 'video' {
  if (typesMap?.[url]) {
    const t = typesMap[url]
    if (t.startsWith('video/')) return 'video'
    if (t.startsWith('image/')) return 'image'
  }
  const ext = url.split('?')[0].split('/').pop()?.toLowerCase() || ''
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].some(e => ext.endsWith(e) || ext === e)) return 'video'
  return 'image'
}

interface ContentEditorProps {
  caption: string
  setCaption: (v: string) => void
  selectedPlatforms: SocialPlatform[]
  activeEditorPlatform: string
  setActiveEditorPlatform: (v: string) => void
  selectedTone: string
  setSelectedTone: (v: string) => void
  isRewriting: boolean
  handleRewrite: () => void
  platformCaptions: Record<string, string>
  postTypes: Record<string, string>
  structuredContent: Record<string, Record<string, string>>
  brokenOutPlatforms: Set<string>
  setContentType: (pid: string, typeId: string) => void
  setFieldValue: (pid: string, fieldKey: string, value: string) => void
  getFieldValue: (pid: string, fieldKey: string) => string
  getStructuredContent: (pid: string) => Record<string, string>
  getCaptionForPlatform: (pid: string) => string
  setCaptionForPlatform: (pid: string, text: string) => void
  isCustomized: (pid: string) => boolean
  breakoutPlatform: (pid: string) => void
  resetToGlobal: (pid: string) => void
  showThreadEditor: boolean
  setShowThreadEditor: (v: boolean) => void
  threadPosts: { id: string; content: string; delayMinutes: number }[]
  addThreadPost: () => void
  removeThreadPost: (id: string) => void
  updateThreadPost: (id: string, updates: Partial<{ content: string; delayMinutes: number }>) => void
  mediaFiles: string[]
  mediaTypes: Record<string, string>
  removeMedia: (index: number) => void
  isUploadingMedia: boolean
  uploadProgress: number
  isDragging: boolean
  setIsDragging: (v: boolean) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: React.DragEvent) => void
  showMediaLibrary: boolean
  setShowMediaLibrary: (v: boolean) => void
  libraryMedia: any[]
  toggleLibraryMedia: (url: string, fileType?: string) => void
  showHashtagModal: boolean
  setShowHashtagModal: (v: boolean) => void
  hashtagSuggestions: string[]
  hashtagNiche: string
  setHashtagNiche: (v: string) => void
  hashtagLoading: boolean
  generateHashtags: () => void
  insertHashtag: (tag: string) => void
  showShortlinkModal: boolean
  setShowShortlinkModal: (v: boolean) => void
  shortlinkProvider: string
  setShortlinkProvider: (v: 'dub' | 'shortio' | 'kutt' | 'linkdrip') => void
  shortlinkApiKey: string
  setShortlinkApiKey: (v: string) => void
  shortlinkDomain: string
  setShortlinkDomain: (v: string) => void
  shortlinkLoading: boolean
  handleShortenLinks: () => void
  showTemplateModal: boolean
  setShowTemplateModal: (v: boolean) => void
  templates: any[]
  loadTemplates: () => void
  saveTemplate: (name: string) => void
  deleteTemplate: (id: string) => void
  applyTemplate: (t: any) => void
  newTemplateName: string
  setNewTemplateName: (v: string) => void
  editorReloadKey: number
  showScheduler: boolean
  setShowScheduler: (v: boolean) => void
  handlePost: (status: 'published' | 'draft' | 'scheduled', force?: boolean) => void
  isSubmitting: boolean
}

export default function ContentEditor(props: ContentEditorProps) {
  const {
    caption, setCaption,
    selectedPlatforms, activeEditorPlatform, setActiveEditorPlatform,
    selectedTone, setSelectedTone, isRewriting, handleRewrite,
    platformCaptions, postTypes, structuredContent, brokenOutPlatforms,
    setContentType, setFieldValue, getFieldValue, getStructuredContent,
    getCaptionForPlatform, setCaptionForPlatform, isCustomized, breakoutPlatform, resetToGlobal,
    showThreadEditor, setShowThreadEditor, threadPosts, addThreadPost, removeThreadPost, updateThreadPost,
    mediaFiles, mediaTypes, removeMedia, isUploadingMedia, uploadProgress,
    isDragging, setIsDragging, fileInputRef, onFileChange, onDrop,
    showMediaLibrary, setShowMediaLibrary, libraryMedia, toggleLibraryMedia,
    showHashtagModal, setShowHashtagModal, hashtagSuggestions, hashtagNiche, setHashtagNiche,
    hashtagLoading, generateHashtags, insertHashtag,
    showShortlinkModal, setShowShortlinkModal, shortlinkProvider, setShortlinkProvider,
    shortlinkApiKey, setShortlinkApiKey, shortlinkDomain, setShortlinkDomain,
    shortlinkLoading, handleShortenLinks,
    showTemplateModal, setShowTemplateModal, templates, loadTemplates, saveTemplate, deleteTemplate, applyTemplate,
    newTemplateName, setNewTemplateName, editorReloadKey,
    showScheduler, setShowScheduler, handlePost, isSubmitting,
  } = props

  const currentEditorCaption = activeEditorPlatform === 'master' ? caption : getCaptionForPlatform(activeEditorPlatform)

  const detectedUrls = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const matches = stripHtml(currentEditorCaption).match(urlRegex)
    return matches || []
  }, [currentEditorCaption])

  const mediaInfo = useMemo(() => mediaFiles.map(url => ({ url, type: guessMediaType(url, mediaTypes) })), [mediaFiles, mediaTypes])

  const allWarnings = useMemo(() => {
    if (selectedPlatforms.length === 0) return {}
    const result: Record<string, string[]> = {}
    for (const pid of selectedPlatforms) {
      const content = getCaptionForPlatform(pid)
      const w = getPlatformWarnings(pid, stripHtml(content), mediaInfo)
      if (w.length > 0) result[pid] = w
    }
    return result
  }, [selectedPlatforms, caption, platformCaptions, mediaInfo, getCaptionForPlatform])

  const hasWarnings = Object.keys(allWarnings).length > 0

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Content Editor</CardTitle>
        <div className="flex items-center gap-2">
          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-purple-500/50"
          >
            {toneOptions.map(t => <option key={t} value={t} className="bg-[#0F1117]">{t}</option>)}
          </select>
          <Button
            variant="ghost" size="sm"
            className="text-purple-400 gap-2 hover:bg-purple-500/10"
            onClick={handleRewrite}
            disabled={isRewriting || !currentEditorCaption}
          >
            {isRewriting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Rewrite
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveEditorPlatform('master')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all",
              activeEditorPlatform === 'master' ? "bg-purple-500/20 text-white" : "text-muted-foreground hover:text-white"
            )}
          >
            Global
          </button>
          {selectedPlatforms.map(pid => {
            const p = ALL_PLATFORMS.find(x => x.id === pid)
            if (!p) return null
            const hasCustom = isCustomized(pid)
            const Icon = p.icon
            return (
              <button
                key={pid}
                onClick={() => setActiveEditorPlatform(pid)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all",
                  activeEditorPlatform === pid ? "bg-purple-500/20 text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                <Icon className="w-3 h-3" />
                {p.label}
                {hasCustom && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
              </button>
            )
          })}
        </div>

        <div className="relative flex-1 space-y-3">
          {activeEditorPlatform !== 'master' && !isCustomized(activeEditorPlatform) ? (
            <div
              onClick={() => breakoutPlatform(activeEditorPlatform)}
              className="relative min-h-[200px] rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                <Lock className="w-5 h-5 text-white/40 group-hover:text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Using global content</p>
                <p className="text-[11px] text-white/30 mt-1">Click to customize content for this platform</p>
              </div>
            </div>
          ) : activeEditorPlatform !== 'master' ? (() => {
            const types = getContentTypes(activeEditorPlatform)
            const currentType = postTypes[activeEditorPlatform] || types[0]?.id || ''
            return (
              <>
                {types.length > 1 && (
                  <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg border border-white/10">
                    {types.map(t => (
                      <button key={t.id} onClick={() => setContentType(activeEditorPlatform, t.id)}
                        className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all", currentType === t.id ? "bg-purple-500/20 text-white" : "text-muted-foreground hover:text-white")}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => resetToGlobal(activeEditorPlatform)}
                    className="text-[10px] text-muted-foreground hover:text-amber-400 transition-colors flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                    Reset to global
                  </button>
                </div>
                {(() => {
                  const ct = getContentType(activeEditorPlatform, currentType)
                  if (!ct || ct.fields.length === 0) {
                    return <p className="text-xs text-muted-foreground py-8 text-center">This content type has no text fields (media-only).</p>
                  }
                  return (
                    <div className="space-y-3">
                      {ct.fields.map(field => (
                        <div key={field.key}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {field.label}
                              {!field.required && <span className="text-[9px] font-normal text-white/30 ml-1">(optional)</span>}
                            </label>
                            {field.maxLength && (
                              <span className="text-[10px] text-muted-foreground">
                                {getFieldValue(activeEditorPlatform, field.key).length} / {field.maxLength}
                              </span>
                            )}
                          </div>
                          {field.type === 'textarea' ? (
                            <textarea
                              value={getFieldValue(activeEditorPlatform, field.key)}
                              onChange={e => setFieldValue(activeEditorPlatform, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              maxLength={field.maxLength}
                              className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 resize-none text-sm focus:outline-none focus:border-purple-500/50"
                            />
                          ) : field.type === 'multiline-list' ? (
                            <textarea
                              value={getFieldValue(activeEditorPlatform, field.key)}
                              onChange={e => setFieldValue(activeEditorPlatform, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 resize-none text-sm focus:outline-none focus:border-purple-500/50 font-mono"
                            />
                          ) : field.type === 'select' ? (
                            <select
                              value={getFieldValue(activeEditorPlatform, field.key)}
                              onChange={e => setFieldValue(activeEditorPlatform, field.key, e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                            >
                              {(Array.isArray(field.options) ? field.options : []).map((opt, oi) => {
                                const val = typeof opt === 'string' ? opt : opt.value
                                const lbl = typeof opt === 'string' ? opt : opt.label
                                return (
                                  <option key={oi} value={val} className="bg-gray-800 text-white">{lbl}</option>
                                )
                              })}
                            </select>
                          ) : field.type === 'number' || field.type === 'date' ? (
                            <input
                              type={field.type}
                              value={getFieldValue(activeEditorPlatform, field.key)}
                              onChange={e => setFieldValue(activeEditorPlatform, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-purple-500/50"
                            />
                          ) : (
                            <input
                              type={field.type === 'url' ? 'url' : 'text'}
                              value={getFieldValue(activeEditorPlatform, field.key)}
                              onChange={e => setFieldValue(activeEditorPlatform, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              maxLength={field.maxLength}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-purple-500/50"
                            />
                          )}
                          {field.fieldNote && (
                            <p className="text-[9px] text-muted-foreground/60 mt-1 leading-relaxed">{field.fieldNote}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </>
            )
          })() : (
            <RichTextEditor
              key={editorReloadKey}
              value={caption}
              onChange={setCaption}
              placeholder="What's on your mind? Type your post here..."
              minHeight="180px"
            />
          )}
        </div>

        {selectedPlatforms.length > 1 && (
          <div className="space-y-1">
            {selectedPlatforms.map(pid => {
              const raw = getCaptionForPlatform(pid)
              const content = stripHtml(raw)
              const ct = getContentType(pid, postTypes[pid])
              const c = getPlatformConstraint(pid)
              const maxChars = ct?.maxChars || c.maxChars
              const pct = Math.min((content.length / maxChars) * 100, 100)
              const over = content.length > maxChars
              return (
                <div key={pid} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase w-16 truncate shrink-0">{pid}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", over ? "bg-red-500" : "bg-purple-500/60")} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={cn("text-[10px] w-12 text-right shrink-0", over ? "text-red-400 font-bold" : "text-muted-foreground")}>
                    {content.length}/{maxChars < 10000 ? maxChars : '\u221E'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {showThreadEditor && (
          <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Thread Posts</span>
                <span className="text-[10px] text-muted-foreground">{threadPosts.length + 1} total (1 main + {threadPosts.length} thread)</span>
              </div>
              <button
                onClick={() => setShowThreadEditor(false)}
                className="text-[10px] text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {threadPosts.map((tp, idx) => (
                <div key={tp.id} className="flex gap-2 items-start group">
                  <div className="flex flex-col items-center gap-1 pt-2 shrink-0">
                    <GripVertical className="w-3.5 h-3.5 text-white/20" />
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-purple-400">#{idx + 2}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <textarea
                      value={tp.content}
                      onChange={e => updateThreadPost(tp.id, { content: e.target.value })}
                      placeholder="Additional post in this thread..."
                      className="w-full min-h-[60px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder:text-white/20 resize-none text-xs focus:outline-none focus:border-purple-500/50"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground">Delay after previous:</span>
                        <select
                          value={tp.delayMinutes}
                          onChange={e => updateThreadPost(tp.id, { delayMinutes: Number(e.target.value) })}
                          className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white focus:outline-none"
                        >
                          {[0, 1, 2, 5, 10, 15, 30, 60, 120, 360, 720, 1440].map(m => (
                            <option key={m} value={m} className="bg-gray-800">
                              {m === 0 ? 'Immediately' : m < 60 ? `${m}m` : m < 1440 ? `${m / 60}h` : `${m / 1440}d`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeThreadPost(tp.id)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-300 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addThreadPost}
              className="w-full py-1.5 rounded-lg border border-dashed border-white/10 text-[11px] text-muted-foreground hover:text-white hover:border-purple-500/40 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add thread post
            </button>
          </div>
        )}

        {mediaFiles.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {mediaFiles.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                {guessMediaType(url, mediaTypes) === 'video' ? (
                  <video src={url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                <button onClick={() => removeMedia(i)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="absolute top-0.5 right-0.5 px-1 py-0.5 rounded bg-black/60 text-[8px] font-bold text-white uppercase">
                  {guessMediaType(url, mediaTypes)}
                </div>
              </div>
            ))}
          </div>
        )}

        {detectedUrls.length > 0 && (
          <div className="space-y-1.5">
            {detectedUrls.slice(0, 1).map((url, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px]">{'\uD83D\uDD17'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-blue-300 truncate">{url}</p>
                  <p className="text-[9px] text-muted-foreground">Link will be included in post</p>
                </div>
              </div>
            ))}
            {detectedUrls.length > 1 && (
              <p className="text-[10px] text-muted-foreground">+{detectedUrls.length - 1} more URL{detectedUrls.length > 2 ? 's' : ''} detected</p>
            )}
          </div>
        )}

        {hasWarnings && (
          <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Platform warnings
            </div>
            {Object.entries(allWarnings).map(([pid, warnings]) =>
              warnings.map((w, i) => (
                <p key={`${pid}-${i}`} className="text-[11px] text-amber-300/80 ml-5">{pid}: {w}</p>
              ))
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-1">
            <input type="file" className="hidden" ref={fileInputRef} accept="*/*" multiple onChange={onFileChange} />
            <Button
              variant="ghost" size="icon"
              className={cn("text-muted-foreground hover:text-white", isUploadingMedia && "animate-pulse")}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingMedia}
              title="Upload media files"
            >
              {isUploadingMedia ? <span className="text-[10px] font-bold text-purple-400">{uploadProgress}%</span> : <Upload className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost" size="icon"
              className="text-muted-foreground hover:text-white"
              onClick={() => setShowMediaLibrary(true)}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white relative" onClick={() => { setHashtagNiche(''); setHashtagSuggestions([]); setShowHashtagModal(true) }} title="Hashtag suggestions">
              <Hash className="w-5 h-5" />
              {(() => {
                const count = (caption.match(/#\w+/g) || []).length
                if (count > 0) return <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-500 text-[7px] font-bold text-white flex items-center justify-center">{count}</span>
                return null
              })()}
            </Button>
            <Button
              variant="ghost" size="icon"
              className={cn("text-muted-foreground hover:text-white", showThreadEditor && "text-purple-400")}
              onClick={() => setShowThreadEditor(!showThreadEditor)}
              title="Thread posts"
            >
              <GripVertical className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className={cn("text-muted-foreground hover:text-white", showShortlinkModal && "text-purple-400")}
              onClick={() => setShowShortlinkModal(true)}
              title="Shorten links"
            >
              <Link2 className="w-5 h-5" />
            </Button>
            <div className="w-px h-6 bg-white/10" />
            <Button
              variant="ghost" size="sm"
              className="text-muted-foreground hover:text-white text-xs gap-1"
              onClick={() => { loadTemplates(); setShowTemplateModal(true) }}
            >
              <Save className="w-3.5 h-3.5" />
              Templates
            </Button>
          </div>
        </div>

        {showMediaLibrary && (
          <MediaSection
            show={showMediaLibrary}
            onClose={() => setShowMediaLibrary(false)}
            libraryMedia={libraryMedia}
            mediaFiles={mediaFiles}
            toggleLibraryMedia={toggleLibraryMedia}
            isUploadingMedia={isUploadingMedia}
            uploadProgress={uploadProgress}
            fileInputRef={fileInputRef}
            onFileChange={onFileChange}
            onDrop={onDrop}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
          />
        )}

        {showHashtagModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[310] flex items-center justify-center p-4" onClick={() => setShowHashtagModal(false)}>
            <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white">Hashtag Suggestions</h3>
                <button onClick={() => setShowHashtagModal(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <input
                  value={hashtagNiche}
                  onChange={e => setHashtagNiche(e.target.value)}
                  placeholder="e.g. marketing, tech, food..."
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  onKeyDown={e => { if (e.key === 'Enter') generateHashtags() }}
                />
                <Button size="sm" onClick={generateHashtags} disabled={hashtagLoading || !hashtagNiche.trim()}>
                  {hashtagLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {hashtagLoading ? '...' : 'Generate'}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {hashtagSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
                    <Hash className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">Enter a niche above to generate hashtag ideas.</p>
                    <p className="text-xs mt-1">Click a hashtag to insert it into your caption.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {hashtagSuggestions.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => insertHashtag(tag)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 rounded-full text-sm text-purple-400 transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                <span>Click a hashtag to add it to your caption.</span>
                <Button variant="ghost" size="sm" onClick={() => setShowHashtagModal(false)}>Done</Button>
              </div>
            </div>
          </div>
        )}

        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
            <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white">Post Templates</h3>
                <button onClick={() => setShowTemplateModal(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <input
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  placeholder="Template name..."
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  onKeyDown={e => { if (e.key === 'Enter' && newTemplateName.trim()) { saveTemplate(newTemplateName.trim()) } }}
                />
                <Button size="sm" disabled={!newTemplateName.trim() || !caption} onClick={() => { if (newTemplateName.trim()) saveTemplate(newTemplateName.trim()) }}>
                  Save Current
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No saved templates yet.</p>
                ) : templates.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {t.caption?.slice(0, 80) || 'No caption'} · {t.platforms?.length || 0} platforms
                      </p>
                    </div>
                    <button onClick={() => applyTemplate(t)} className="text-xs text-purple-400 hover:text-purple-300 shrink-0 px-2 py-1 rounded hover:bg-purple-500/10">
                      Load
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} className="text-xs text-red-400 hover:text-red-300 shrink-0 px-2 py-1 rounded hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showShortlinkModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={() => setShowShortlinkModal(false)}>
            <div className="bg-[#141218] border border-white/10 rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white">Shorten Links</h3>
                <button onClick={() => setShowShortlinkModal(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20 shrink-0">Provider</label>
                  <select
                    value={shortlinkProvider}
                    onChange={e => setShortlinkProvider(e.target.value as any)}
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="dub">Dub.co</option>
                    <option value="shortio">Short.io</option>
                    <option value="kutt">Kutt.it</option>
                    <option value="linkdrip">LinkDrip</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20 shrink-0">API Key</label>
                  <input
                    type="password"
                    value={shortlinkApiKey}
                    onChange={e => setShortlinkApiKey(e.target.value)}
                    placeholder="Enter API key..."
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20 shrink-0">Domain</label>
                  <input
                    type="text"
                    value={shortlinkDomain}
                    onChange={e => setShortlinkDomain(e.target.value)}
                    placeholder="Optional custom domain..."
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="text-center text-muted-foreground py-8">
                  <Link2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Enter provider details above, then click Shorten to auto-replace links in your caption.</p>
                  <p className="text-xs mt-1">All https:// URLs will be shortened using the selected provider.</p>
                </div>
              </div>
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setShowShortlinkModal(false)}>Cancel</Button>
                <Button size="sm" onClick={handleShortenLinks} disabled={shortlinkLoading || !shortlinkApiKey.trim()}>
                  {shortlinkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  {shortlinkLoading ? '...' : 'Shorten Links'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowScheduler(!showScheduler)}
          >
            <Clock className="w-4 h-4" />
            Schedule
          </Button>
          <Button
            className="gap-2 px-6"
            onClick={() => handlePost('published')}
            disabled={isSubmitting || !caption || selectedPlatforms.length === 0}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
