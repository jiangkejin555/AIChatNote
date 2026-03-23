import { notesApi } from '@/lib/api/notes'
import type { Note } from '@/types'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface ImportResult {
  filename: string
  success: boolean
  note?: Note
  error?: string
}

export interface MarkdownParserResult {
  title: string
  content: string
}

/**
 * Parse Markdown file content to extract title and full content
 */
export function parseMarkdownContent(content: string, filename: string): MarkdownParserResult {
  // Extract title from first # heading
  const headingMatch = content.match(/^#\s+(.+)$/m)
  const title = headingMatch ? headingMatch[1].trim() : filename.replace(/\.md$/, '')

  return {
    title,
    content, // Keep full content as-is
  }
}

/**
 * Validate file before import
 */
export function validateMarkdownFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  if (!file.name.endsWith('.md')) {
    return { valid: false, error: '只支持 .md 文件' }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '文件大小超过 5MB 限制' }
  }

  return { valid: true }
}

/**
 * Import a single Markdown file
 */
export async function importMarkdownFile(
  file: File,
  folderId?: number
): Promise<ImportResult> {
  const validation = validateMarkdownFile(file)
  if (!validation.valid) {
    return {
      filename: file.name,
      success: false,
      error: validation.error,
    }
  }

  try {
    const note = await notesApi.importMarkdown(file, folderId)
    return {
      filename: file.name,
      success: true,
      note,
    }
  } catch (error) {
    return {
      filename: file.name,
      success: false,
      error: error instanceof Error ? error.message : '导入失败',
    }
  }
}

/**
 * Import multiple Markdown files
 */
export async function importMarkdownFiles(
  files: File[],
  folderId?: number,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult[]> {
  const results: ImportResult[] = []

  for (let i = 0; i < files.length; i++) {
    const result = await importMarkdownFile(files[i], folderId)
    results.push(result)
    onProgress?.(i + 1, files.length)
  }

  return results
}

/**
 * Create a download for exporting note as Markdown
 */
export function downloadMarkdownFile(note: Note): void {
  const markdown = `# ${note.title}\n\n${note.content.replace(/<[^>]*>/g, '')}`
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${note.title || 'note'}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
