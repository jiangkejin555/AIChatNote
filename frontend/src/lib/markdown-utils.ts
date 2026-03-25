import { marked } from 'marked'

/**
 * Configure marked options for consistent markdown parsing
 */
function configureMarked(): void {
  marked.setOptions({
    gfm: true,
    breaks: true,
  })
}

/**
 * Convert Markdown to styled HTML with inline styles
 * for better rendering in notes
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  configureMarked()
  const html = await marked.parse(markdown)

  return html
    .replace(/<h1>/g, '<h1 style="font-size: 1.5em; font-weight: bold; margin: 16px 0 8px 0;">')
    .replace(/<h2>/g, '<h2 style="font-size: 1.25em; font-weight: bold; margin: 14px 0 6px 0;">')
    .replace(/<h3>/g, '<h3 style="font-size: 1.1em; font-weight: 600; margin: 12px 0 4px 0;">')
    .replace(/<h4>/g, '<h4 style="font-weight: 600; margin: 10px 0 4px 0;">')
    .replace(/<p>/g, '<p style="margin: 0 0 8px 0; line-height: 1.6;">')
    .replace(/<ul>/g, '<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc;">')
    .replace(/<ol>/g, '<ol style="margin: 8px 0; padding-left: 20px; list-style-type: decimal;">')
    .replace(/<li>/g, '<li style="margin: 4px 0; line-height: 1.6;">')
    .replace(
      /<blockquote>/g,
      '<blockquote style="border-left: 3px solid #3b82f6; padding-left: 12px; margin: 8px 0; color: #64748b; background: #f1f5f9; padding: 8px 12px; border-radius: 0 6px 6px 0;">'
    )
    .replace(
      /<code>/g,
      '<code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: ui-monospace, monospace;">'
    )
    .replace(
      /<pre>/g,
      '<pre style="background: #1e293b; color: #e2e8f0; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; font-size: 13px; line-height: 1.5; font-family: ui-monospace, monospace;">'
    )
    .replace(/<pre><code/g, '<pre><code style="background: transparent; padding: 0;"')
    .replace(/<a /g, '<a style="color: #3b82f6; text-decoration: underline;" ')
    .replace(/<table>/g, '<table style="border-collapse: collapse; width: 100%; margin: 12px 0;">')
    .replace(
      /<th>/g,
      '<th style="border: 1px solid #cbd5e1; padding: 8px 12px; background: #f1f5f9; font-weight: 600; text-align: left;">'
    )
    .replace(/<td>/g, '<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">')
    .replace(/<strong>/g, '<strong style="font-weight: 600;">')
    .replace(/<em>/g, '<em style="font-style: italic;">')
    .replace(/<hr>/g, '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">')
}

/**
 * Format messages as HTML for note export
 */
export async function formatMessagesAsHtml(
  messages: { role: string; content: string }[],
  translations: { me: string; ai: string }
): Promise<string> {
  const parts = await Promise.all(
    messages.map(async (msg) => {
      const roleName = msg.role === 'user' ? translations.me : translations.ai
      const roleColor = msg.role === 'user' ? '#374151' : '#2563eb'

      const contentHtml = await markdownToHtml(msg.content)

      return `
        <div style="margin-bottom: 20px;">
          <div style="font-size: 12px; color: ${roleColor}; margin-bottom: 8px; font-weight: 600;">
            ${roleName}
          </div>
          <div style="font-size: 14px; line-height: 1.7;">
            ${contentHtml}
          </div>
        </div>
      `
    })
  )
  return parts.join('')
}
