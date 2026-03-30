# TOC Layout Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `hidden xl:block` TOC breakpoint with a smart ResizeObserver-based layout that shows line indicators + hover overlay when space is tight, and full TOC when space is plentiful.

**Architecture:** Keep the current DOM structure (TOC as absolute child of sidebar). All changes happen inside `TocSidebar` component (collapsed mode with Notion-style line indicators and hover overlay) and `notes/page.tsx` (ResizeObserver space detection replacing the CSS breakpoint).

**Tech Stack:** React 19, Next.js 16, Tailwind CSS, ResizeObserver API

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `frontend/src/components/notes/toc-sidebar.tsx` | Modify | Add `collapsed` prop, line indicators, hover overlay |
| `frontend/src/app/(main)/notes/page.tsx` | Modify | Add ResizeObserver detection, remove `hidden xl:block`, pass `collapsed` prop |

---

### Task 1: Update TocSidebar with Collapsed Mode

**Files:**
- Modify: `frontend/src/components/notes/toc-sidebar.tsx`

- [ ] **Step 1: Add `collapsed` prop to TocSidebarProps**

Replace the existing interface (lines 13-16) with:

```tsx
interface TocSidebarProps {
  content: string
  className?: string
  collapsed?: boolean
}
```

- [ ] **Step 2: Add hover state management for collapsed overlay**

Add these imports and state at the top of the component function (after line 23):

```tsx
export function TocSidebar({ content, className, collapsed = false }: TocSidebarProps) {
  const t = useTranslations()
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [truncatedIds, setTruncatedIds] = useState<Set<string>>(new Set())
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Hover state for collapsed mode overlay
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
```

- [ ] **Step 3: Add hover handlers**

Add after `hideTimerRef` (before the existing useEffect on line 26):

```tsx
  const handleMouseEnter = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setIsOverlayVisible(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setIsOverlayVisible(false), 300)
  }, [])
```

- [ ] **Step 4: Add the collapsed render branch**

Replace the early return and return statement (lines 89-136) with the following. This adds a `collapsed` branch that renders line indicators + hover overlay, while keeping the existing expanded rendering unchanged:

```tsx
  // Don't render if less than 2 headings
  if (headings.length < 2) {
    return null
  }

  // --- Collapsed mode: line indicators + hover overlay ---
  if (collapsed) {
    return (
      <div className={cn('shrink-0', className)}>
        <div
          className="sticky top-20"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Line indicators */}
          <nav className="space-y-1.5 py-1">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={cn(
                  'block h-0.5 rounded-full transition-colors cursor-pointer',
                  heading.level === 1 && 'w-4',
                  heading.level === 2 && 'w-4 ml-2',
                  heading.level === 3 && 'w-4 ml-4',
                  activeId === heading.id
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                )}
              />
            ))}
          </nav>

          {/* Hover overlay with full TOC */}
          {isOverlayVisible && (
            <div className="absolute left-full top-0 ml-2 w-48 bg-popover/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 z-50">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('notes.toc')}
              </h4>
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                {headings.map((heading) => (
                  <button
                    key={heading.id}
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
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- Expanded mode: current behavior (unchanged) ---
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
```

- [ ] **Step 5: Verify the component compiles**

Run: `cd /Users/bytedance/Desktop/KOK/ai-chat-notes/frontend && npm run build 2>&1 | head -30`
Expected: Build succeeds (the new `collapsed` prop is optional with default `false`, so existing usage is unaffected).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/notes/toc-sidebar.tsx
git commit -m "feat(notes): add collapsed mode to TocSidebar with line indicators and hover overlay"
```

---

### Task 2: Integrate Space Detection in Notes Page

**Files:**
- Modify: `frontend/src/app/(main)/notes/page.tsx`

- [ ] **Step 1: Add ResizeObserver-based space detection**

Replace the entire `NotesPageContent` function (lines 9-34) with:

```tsx
function NotesPageContent() {
  const t = useTranslations()
  const { selectedNoteId, isEditing, editingContent } = useNotesStore()
  const { data: note } = useNote(selectedNoteId)

  // Use editing content when in edit mode, otherwise use saved content
  const tocContent = isEditing ? editingContent : (note?.content || '')

  // ResizeObserver-based TOC collapse detection
  const containerRef = useRef<HTMLDivElement>(null)
  const [tocCollapsed, setTocCollapsed] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const SIDEBAR_WIDTH = 256 // w-64 = 16rem = 256px
    const MIN_CONTENT_WIDTH = 700 // minimum NoteDetail width for expanded TOC

    const observer = new ResizeObserver(([entry]) => {
      const containerWidth = entry.contentRect.width
      const noteDetailWidth = containerWidth - SIDEBAR_WIDTH
      setTocCollapsed(noteDetailWidth < MIN_CONTENT_WIDTH)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="h-full flex">
      {/* Left Sidebar - Notes List with TOC */}
      <div className="w-64 flex flex-col shrink-0 relative">
        <NotesSidebar />
        {/* TOC - absolute positioned to the right of sidebar */}
        {(note || isEditing) && tocContent && (
          <div className="absolute left-full top-52 pl-4">
            <TocSidebar
              content={tocContent}
              className={tocCollapsed ? 'w-6' : 'w-36'}
              collapsed={tocCollapsed}
            />
          </div>
        )}
      </div>

      {/* Right - Note Editor */}
      <NoteDetail />
    </div>
  )
}
```

Before the function, update the React import on line 1 from:
```tsx
import { Suspense } from 'react'
```
to:
```tsx
import { Suspense, useRef, useState, useEffect } from 'react'
```

Key changes from current code:
- Updated React import to include `useRef`, `useState`, `useEffect`
- Added `containerRef` and `tocCollapsed` state
- Added `useEffect` with `ResizeObserver` watching the flex container
- Replaced `hidden xl:block` with dynamic collapse based on measured width
- Pass `collapsed` and dynamic `className` to `TocSidebar`

- [ ] **Step 2: Verify the page compiles and renders**

Run: `cd /Users/bytedance/Desktop/KOK/ai-chat-notes/frontend && npm run build 2>&1 | head -30`
Expected: Build succeeds.

- [ ] **Step 3: Manual verification checklist**

Open `http://localhost:3000/notes` and verify:
1. On wide screens (>1200px viewport): TOC shows full text, same as before
2. Gradually narrow the browser window: at some point TOC switches to thin line indicators
3. Hover over line indicators: full TOC appears as overlay to the right
4. Move mouse away: overlay disappears after ~300ms
5. Click a heading in overlay: scrolls to heading correctly
6. Line for active heading is highlighted in primary color

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/\(main\)/notes/page.tsx
git commit -m "feat(notes): add ResizeObserver-based TOC collapse detection"
```
