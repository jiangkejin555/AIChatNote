'use client'

import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link,
  Minus,
  Code2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  editor: Editor | null
  className?: string
}

export function EditorToolbar({ editor, className }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('输入链接 URL:', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const headingItems = [
    { level: 1, icon: Heading1, label: '标题 1' },
    { level: 2, icon: Heading2, label: '标题 2' },
    { level: 3, icon: Heading3, label: '标题 3' },
  ]

  return (
    <div className={cn('flex items-center gap-0.5 border-b border-border px-2 py-1.5', className)}>
      {/* Undo/Redo */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0"
        aria-label="撤销"
      >
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 p-0"
        aria-label="重做"
      >
        <Redo className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Headings Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-2 cursor-pointer">
          <Heading1 className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {headingItems.map(({ level, icon: Icon, label }) => (
            <DropdownMenuItem
              key={level}
              onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
              className={cn(
                editor.isActive('heading', { level }) && 'bg-accent'
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Text Formatting */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
        aria-label="加粗"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
        aria-label="斜体"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        className="h-8 w-8 p-0"
        aria-label="删除线"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('code')}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        className="h-8 w-8 p-0"
        aria-label="行内代码"
      >
        <Code className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Link */}
      <Toggle
        size="sm"
        pressed={editor.isActive('link')}
        onPressedChange={setLink}
        className="h-8 w-8 p-0"
        aria-label="插入链接"
      >
        <Link className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Code Block */}
      <Toggle
        size="sm"
        pressed={editor.isActive('codeBlock')}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        className="h-8 w-8 p-0"
        aria-label="代码块"
      >
        <Code2 className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Lists */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
        aria-label="无序列表"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
        aria-label="有序列表"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        className="h-8 w-8 p-0"
        aria-label="引用"
      >
        <Quote className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Horizontal Rule */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        className="h-8 w-8 p-0"
        aria-label="分割线"
      >
        <Minus className="h-4 w-4" />
      </Toggle>
    </div>
  )
}
