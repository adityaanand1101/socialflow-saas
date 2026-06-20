import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Link, Heading1, Heading2, Heading3, Smile
} from 'lucide-react'
import { cn } from '@/lib/utils'
import EmojiPicker, { Theme } from 'emoji-picker-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  disabled?: boolean
}

export function RichTextEditor({ value, onChange, placeholder = "What's on your mind? Type your post here...", minHeight = '180px', disabled }: RichTextEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const isExternalUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https'],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      if (!isExternalUpdate.current) {
        onChange(ed.getHTML())
      }
      isExternalUpdate.current = false
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none text-base leading-relaxed',
      },
    },
  })

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentHTML = editor.getHTML() || ''
      if (value !== currentHTML) {
        isExternalUpdate.current = true
        editor.commands.setContent(value || '')
      }
    }
  }, [value, editor])

  const insertEmoji = useCallback((emoji: string) => {
    editor?.chain().focus().insertContent(emoji).run()
    setShowEmojiPicker(false)
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const ToolbarBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-all",
        active ? "bg-purple-500/20 text-purple-300" : "text-white/60 hover:text-white hover:bg-white/10"
      )}
    >
      {children}
    </button>
  )

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-0.5 p-1.5 bg-white/5 rounded-t-lg border border-white/10 mb-0 flex-wrap">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarBtn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="Insert link">
          <Link className="w-4 h-4" />
        </ToolbarBtn>
        <div className="flex-1" />
        <div className="relative">
          <ToolbarBtn onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Insert emoji">
            <Smile className="w-4 h-4" />
          </ToolbarBtn>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute top-full right-0 mt-1 z-50" onMouseDown={e => e.preventDefault()}>
              <EmojiPicker
                height={350}
                theme={Theme.DARK}
                onEmojiClick={(e) => insertEmoji(e.emoji)}
                open={showEmojiPicker}
              />
            </div>
          )}
        </div>
      </div>
      <div
        className={cn(
          "bg-white/5 border border-t-0 border-white/10 rounded-b-lg px-3 py-2",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <div style={{ minHeight }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
