# TOC Layout Optimization Design

## Problem

The TOC (Table of Contents) in the notes page is absolutely positioned (`absolute left-full`) as a child of the left sidebar. It floats above the note content area and does not participate in the flex layout flow. When the page width decreases, the TOC visually overlaps the note content, creating a poor reading experience.

Currently, the TOC uses a hard breakpoint (`hidden xl:block`) — it is either fully visible at 1280px+ or completely absent below. There is no intermediate responsive behavior.

## Solution: Smart Hover-Expand Pattern (Notion-style)

The TOC stays in its current position but gains two modes based on available space:

### Mode 1: Wide Screen (Sufficient Space)
- Full TOC with text labels, identical to current behavior
- Width: ~144px (w-36), sticky positioning
- Always visible, click-to-scroll navigation

### Mode 2: Narrow Screen (Insufficient Space)
- Collapses to a thin vertical strip (~24px) with horizontal line indicators
- Each heading is represented by a short horizontal line, indented by heading level
- Active heading's line is highlighted
- On hover: full TOC expands as an overlay popover with background, shadow, and rounded corners
- On mouse leave: collapses back to line indicators

### Line Indicator Visual

```
 ——           (h1)
   ——         (h2)
     ——       (h3)
   ——         (h2)
 ——           (h1)
```

- Uniform line length (~16px), differentiated by left margin indentation
- Active heading line uses accent color; inactive lines use muted color
- The strip is narrow enough to not significantly overlap content

### Hover Expansion Behavior
- Overlay appears to the right of the line indicators
- Semi-transparent background + border-radius + box-shadow
- Clicking a TOC item scrolls to the heading
- Overlay auto-dismisses on mouse leave (with a small delay to prevent flicker)

## Implementation Scope

### Files to Modify

1. **`frontend/src/components/notes/toc-sidebar.tsx`** — Primary changes:
   - Add `collapsed` prop to control display mode
   - Add `TocIndicators` sub-component for the line-indicator strip
   - Add hover state management for expand/collapse
   - Overlay rendering for expanded TOC in collapsed mode

2. **`frontend/src/app/(main)/notes/page.tsx`** — Minor changes:
   - Remove `hidden xl:block` hard breakpoint
   - Add ResizeObserver-based space detection
   - Pass `collapsed` prop to `TocSidebar` based on available space

### Space Detection Logic

Use a ResizeObserver on the note content container to compare:
- TOC right edge position (sidebar width + TOC width)
- Note content left edge position

When the TOC would overlap the content area, switch to collapsed mode.

### DOM Structure

The outer positioning (`absolute left-full` on the sidebar child) remains unchanged. All changes happen inside `TocSidebar`:

```
<div absolute left-full>          ← unchanged
  <TocSidebar collapsed={...}>
    {!collapsed ? (
      <FullToc />                 ← current behavior
    ) : (
      <div className="group">     ← hover container
        <LineIndicators />        ← always visible thin strip
        <PopoverOverlay>          ← visible on hover via group-hover
          <FullToc />
        </PopoverOverlay>
      </div>
    )}
  </TocSidebar>
</div>
```

## Out of Scope

- Moving TOC to a different page region (right side, etc.)
- Changing the TOC heading parsing or IntersectionObserver logic
- Mobile-specific TOC behavior (already handled by separate mobile layout)
- TOC width customization settings
