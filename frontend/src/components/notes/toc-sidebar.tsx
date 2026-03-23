'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TocSidebarProps {
  content: string
  className?: string
}

export function TocSidebar({ content, className }: TocSidebarProps) {
  const t = useTranslations()
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [truncatedIds, setTruncatedIds] = useState<Set<string>>(new Set())
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Parse headings from HTML content
  useEffect(() => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const headingElements = doc.querySelectorAll('h1, h2, h3')

    const items: TocItem[] = []
    headingElements.forEach((heading, index) => {
      const id = `heading-${index}`
      heading.id = id
      items.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1)),
      })
    })

    setHeadings(items)
  }, [content])

  // Check which buttons are truncated after render
  useEffect(() => {
    const truncated = new Set<string>()
    buttonRefs.current.forEach((button, id) => {
      if (button.scrollWidth > button.clientWidth) {
        truncated.add(id)
      }
    })
    setTruncatedIds(truncated)
  }, [headings])

  // Observe headings for active state
  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0% -35% 0%' }
    )

    // Observe actual DOM headings in the viewer
    const viewerHeadings = document.querySelectorAll('.note-viewer h1, .note-viewer h2, .note-viewer h3')
    viewerHeadings.forEach((heading, index) => {
      heading.id = `heading-${index}`
      observer.observe(heading)
    })

    return () => observer.disconnect()
  }, [headings, content])

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }, [])

  // Don't render if less than 2 headings
  if (headings.length < 2) {
    return null
  }

  return (
    <div className={cn('shrink-0', className)}>
      <div className="sticky top-20">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t('notes.toc')}
        </h4>
        <nav className="space-y-1">
          {headings.map((heading) => {
            const isTruncated = truncatedIds.has(heading.id)
            return (
              <div key={heading.id} className={cn('relative', isTruncated && 'group')}>
                <button
                  ref={(el) => {
                    if (el) buttonRefs.current.set(heading.id, el)
                  }}
                  onClick={() => scrollToHeading(heading.id)}
                  className={cn(
                    'block w-full text-left text-xs py-1 px-2 rounded-md transition-colors cursor-pointer truncate',
                    'hover:bg-accent hover:text-accent-foreground',
                    activeId === heading.id
                      ? 'text-primary bg-primary/10 font-medium'
                      : 'text-muted-foreground',
                    heading.level === 1 && 'font-medium',
                    heading.level === 2 && 'pl-3',
                    heading.level === 3 && 'pl-5'
                  )}
                >
                  {heading.text}
                </button>
                {/* Tooltip only when truncated */}
                {isTruncated && (
                  <div className="absolute left-0 top-full z-50 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity whitespace-nowrap max-w-[200px] truncate">
                    {heading.text}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
