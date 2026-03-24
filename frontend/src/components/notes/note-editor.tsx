'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { EditorToolbar } from './editor-toolbar'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { useTranslations } from '@/i18n'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
  className?: string
  editable?: boolean
}

export function NoteEditor({ content, onChange, className, editable = true }: NoteEditorProps) {
  const t = useTranslations()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg p-4 overflow-x-auto text-sm font-mono shadow-sm my-3',
          },
        },
        link: false,
      }),
      Placeholder.configure({
        placeholder: t('notes.placeholder'),
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:underline',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'tiptap max-w-none focus:outline-none min-h-[400px] px-4 py-3'
        ),
      },
    },
    immediatelyRender: false,
  })

  // Sync content from parent
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editable, editor])

  return (
    <div className={cn('flex flex-col border rounded-lg overflow-hidden', className)}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="flex-1 overflow-auto" />
    </div>
  )
}
