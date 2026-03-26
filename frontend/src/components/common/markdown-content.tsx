'use client'

import { useI18n, type Locale } from '@/i18n'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { legalContent } from './legal-content'

interface MarkdownContentProps {
  type: 'terms' | 'privacy'
  title: string
  icon?: React.ReactNode
}

export function MarkdownContent({ type, title, icon }: MarkdownContentProps) {
  const { locale } = useI18n()

  // Ensure we have a valid locale key
  const validLocale: 'zh' | 'en' = (locale === 'zh' || locale === 'en') ? locale : 'en'
  const content = legalContent[type][validLocale]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-center gap-2 p-4 max-w-4xl mx-auto">
          {icon}
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto prose prose-sm dark:prose-invert prose-headings:scroll-mt-20">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mb-4">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-6 mb-3 pb-2 border-b">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside text-muted-foreground space-y-1 mb-4">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-muted-foreground">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              a: ({ href, children }) => {
                if (href?.startsWith('/')) {
                  return (
                    <Link href={href} className="text-primary hover:underline">
                      {children}
                    </Link>
                  )
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {children}
                  </a>
                )
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="my-6 border-border" />,
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="w-full border-collapse border border-border rounded-md">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted/50">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border border-border px-4 py-3 text-left font-semibold bg-muted/30">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-4 py-2.5">{children}</td>
              ),
              tr: ({ children }) => (
                <tr className="even:bg-muted/20">{children}</tr>
              ),
              code: ({ className, children }) => {
                const isInline = !className
                if (isInline) {
                  return <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>
                }
                return <code className={className}>{children}</code>
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
