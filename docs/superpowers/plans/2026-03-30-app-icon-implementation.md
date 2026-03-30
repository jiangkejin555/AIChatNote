# App Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the newly designed "Knowledge Layers" (Top Blue to Bottom Purple) app icon as SVG assets and integrate them into the Next.js frontend application.

**Architecture:** We will create reusable SVG components/files for the app icon, generate different sizes if necessary (favicon, manifest icons, opengraph images), and update the Next.js `app` directory to serve these new assets instead of any default icons.

**Tech Stack:** Next.js (App Router), SVG, React

---

### File Structure Map
- Create: `public/icon.svg` (Main scalable vector asset)
- Create: `app/icon.tsx` (Next.js dynamic icon generation with solid background for light mode compatibility)
- Create: `components/ui/app-icon.tsx` (React component for inline usage in UI)
- Modify: `app/layout.tsx` (To ensure correct metadata configuration for icons)

---

### Task 1: Create the Core SVG Asset in Public Directory

**Files:**
- Create: `public/icon.svg`

- [ ] **Step 1: Create the SVG file**

```xml
<!-- public/icon.svg -->
<svg width="180" height="180" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <!-- Notebook 1 (Bottom) - Deep Purple -->
  <path d="M 25 80 L 65 95 L 115 80 L 75 65 Z" fill="#581C87" opacity="0.8"/>
  <path d="M 25 80 L 65 95 L 65 105 L 25 90 Z" fill="rgba(216, 180, 254, 0.4)"/>
  <path d="M 65 95 L 115 80 L 115 90 L 65 105 Z" fill="rgba(192, 132, 252, 0.3)"/>
  <path d="M 25 90 L 65 105 L 65 108 L 25 93 Z" fill="#3B0764"/>
  <path d="M 65 105 L 115 90 L 115 93 L 65 108 Z" fill="#3B0764"/>
  <polygon points="40,86 48,89 48,103 44,100 40,103" fill="#A855F7"/>

  <!-- Notebook 2 (Middle) - Indigo/Violet mix -->
  <path d="M 25 60 L 65 75 L 115 60 L 75 45 Z" fill="#4338CA" opacity="0.9"/>
  <path d="M 25 60 L 65 75 L 65 85 L 25 70 Z" fill="rgba(199, 210, 254, 0.6)"/>
  <path d="M 65 75 L 115 60 L 115 70 L 65 85 Z" fill="rgba(165, 180, 252, 0.5)"/>
  <path d="M 25 70 L 65 85 L 65 88 L 25 73 Z" fill="#312E81"/>
  <path d="M 65 85 L 115 70 L 115 73 L 65 88 Z" fill="#312E81"/>

  <!-- Notebook 3 (Top) - Bright Tech Blue -->
  <path d="M 25 40 L 65 55 L 115 40 L 75 25 Z" fill="#3B82F6"/>
  <path d="M 25 40 L 65 55 L 65 65 L 25 50 Z" fill="rgba(219, 234, 254, 0.9)"/>
  <path d="M 65 55 L 115 40 L 115 50 L 65 65 Z" fill="rgba(191, 219, 254, 0.8)"/>
  <path d="M 25 50 L 65 65 L 65 68 L 25 53 Z" fill="#1D4ED8"/>
  <path d="M 65 65 L 115 50 L 115 53 L 65 68 Z" fill="#1D4ED8"/>
  
  <!-- Note content on top cover -->
  <line x1="55" y1="36" x2="85" y2="44" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="50" y1="41" x2="70" y2="47" stroke="#BFDBFE" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="45" cy="40" r="3.5" fill="#93C5FD"/>
  <polygon points="90,47 98,44 98,58 94,56 90,58" fill="#60A5FA"/>
</svg>
```

- [ ] **Step 2: Verify file creation**

Run: `ls -la public/icon.svg`
Expected: Output showing the file exists and has size > 0.

- [ ] **Step 3: Commit**

```bash
git add public/icon.svg
git commit -m "asset: add main app icon svg"
```

---

### Task 2: Create React Component for UI Usage

**Files:**
- Create: `components/ui/app-icon.tsx`

- [ ] **Step 1: Create the directory if it doesn't exist**

```bash
mkdir -p components/ui
```

- [ ] **Step 2: Create the React component**

```tsx
// components/ui/app-icon.tsx
import React from 'react';

interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function AppIcon({ size = 40, className, ...props }: AppIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 140 140" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Notebook 1 (Bottom) - Deep Purple */}
      <path d="M 25 80 L 65 95 L 115 80 L 75 65 Z" fill="#581C87" opacity={0.8}/>
      <path d="M 25 80 L 65 95 L 65 105 L 25 90 Z" fill="rgba(216, 180, 254, 0.4)"/>
      <path d="M 65 95 L 115 80 L 115 90 L 65 105 Z" fill="rgba(192, 132, 252, 0.3)"/>
      <path d="M 25 90 L 65 105 L 65 108 L 25 93 Z" fill="#3B0764"/>
      <path d="M 65 105 L 115 90 L 115 93 L 65 108 Z" fill="#3B0764"/>
      <polygon points="40,86 48,89 48,103 44,100 40,103" fill="#A855F7"/>

      {/* Notebook 2 (Middle) - Indigo/Violet mix */}
      <path d="M 25 60 L 65 75 L 115 60 L 75 45 Z" fill="#4338CA" opacity={0.9}/>
      <path d="M 25 60 L 65 75 L 65 85 L 25 70 Z" fill="rgba(199, 210, 254, 0.6)"/>
      <path d="M 65 75 L 115 60 L 115 70 L 65 85 Z" fill="rgba(165, 180, 252, 0.5)"/>
      <path d="M 25 70 L 65 85 L 65 88 L 25 73 Z" fill="#312E81"/>
      <path d="M 65 85 L 115 70 L 115 73 L 65 88 Z" fill="#312E81"/>

      {/* Notebook 3 (Top) - Bright Tech Blue */}
      <path d="M 25 40 L 65 55 L 115 40 L 75 25 Z" fill="#3B82F6"/>
      <path d="M 25 40 L 65 55 L 65 65 L 25 50 Z" fill="rgba(219, 234, 254, 0.9)"/>
      <path d="M 65 55 L 115 40 L 115 50 L 65 65 Z" fill="rgba(191, 219, 254, 0.8)"/>
      <path d="M 25 50 L 65 65 L 65 68 L 25 53 Z" fill="#1D4ED8"/>
      <path d="M 65 65 L 115 50 L 115 53 L 65 68 Z" fill="#1D4ED8"/>
      
      {/* Note content on top cover */}
      <line x1="55" y1="36" x2="85" y2="44" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round"/>
      <line x1="50" y1="41" x2="70" y2="47" stroke="#BFDBFE" strokeWidth={2.5} strokeLinecap="round"/>
      <circle cx="45" cy="40" r="3.5" fill="#93C5FD"/>
      <polygon points="90,47 98,44 98,58 94,56 90,58" fill="#60A5FA"/>
    </svg>
  );
}
```

- [ ] **Step 3: Check Typescript compilation (if possible)**

Run: `npx tsc --noEmit`
Expected: Should not throw errors related to the new component.

- [ ] **Step 4: Commit**

```bash
git add components/ui/app-icon.tsx
git commit -m "feat(ui): add AppIcon react component"
```

---

### Task 3: Update Next.js Metadata and App Router Icons

**Files:**
- Create: `app/icon.tsx` (Dynamic icon generation)
- Modify: `app/layout.tsx` (If exists)
- Delete: `app/favicon.ico`, `public/favicon.ico` (Clean up defaults)

- [ ] **Step 1: Clean up default icons**

```bash
rm -f app/favicon.ico public/favicon.ico
```

- [ ] **Step 2: Create dynamic Next.js icon with solid background**

```tsx
// app/icon.tsx
import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F0F16', // Dark background as per spec
          borderRadius: '20%',
        }}
      >
        <svg 
          width="360" 
          height="360" 
          viewBox="0 0 140 140" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Notebook 1 (Bottom) - Deep Purple */}
          <path d="M 25 80 L 65 95 L 115 80 L 75 65 Z" fill="#581C87" opacity={0.8}/>
          <path d="M 25 80 L 65 95 L 65 105 L 25 90 Z" fill="rgba(216, 180, 254, 0.4)"/>
          <path d="M 65 95 L 115 80 L 115 90 L 65 105 Z" fill="rgba(192, 132, 252, 0.3)"/>
          <path d="M 25 90 L 65 105 L 65 108 L 25 93 Z" fill="#3B0764"/>
          <path d="M 65 105 L 115 90 L 115 93 L 65 108 Z" fill="#3B0764"/>
          <polygon points="40,86 48,89 48,103 44,100 40,103" fill="#A855F7"/>

          {/* Notebook 2 (Middle) - Indigo/Violet mix */}
          <path d="M 25 60 L 65 75 L 115 60 L 75 45 Z" fill="#4338CA" opacity={0.9}/>
          <path d="M 25 60 L 65 75 L 65 85 L 25 70 Z" fill="rgba(199, 210, 254, 0.6)"/>
          <path d="M 65 75 L 115 60 L 115 70 L 65 85 Z" fill="rgba(165, 180, 252, 0.5)"/>
          <path d="M 25 70 L 65 85 L 65 88 L 25 73 Z" fill="#312E81"/>
          <path d="M 65 85 L 115 70 L 115 73 L 65 88 Z" fill="#312E81"/>

          {/* Notebook 3 (Top) - Bright Tech Blue */}
          <path d="M 25 40 L 65 55 L 115 40 L 75 25 Z" fill="#3B82F6"/>
          <path d="M 25 40 L 65 55 L 65 65 L 25 50 Z" fill="rgba(219, 234, 254, 0.9)"/>
          <path d="M 65 55 L 115 40 L 115 50 L 65 65 Z" fill="rgba(191, 219, 254, 0.8)"/>
          <path d="M 25 50 L 65 65 L 65 68 L 25 53 Z" fill="#1D4ED8"/>
          <path d="M 65 65 L 115 50 L 115 53 L 65 68 Z" fill="#1D4ED8"/>
          
          {/* Note content on top cover */}
          <line x1="55" y1="36" x2="85" y2="44" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round"/>
          <line x1="50" y1="41" x2="70" y2="47" stroke="#BFDBFE" strokeWidth={2.5} strokeLinecap="round"/>
          <circle cx="45" cy="40" r="3.5" fill="#93C5FD"/>
          <polygon points="90,47 98,44 98,58 94,56 90,58" fill="#60A5FA"/>
        </svg>
      </div>
    ),
    { ...size }
  )
}
```

- [ ] **Step 3: Verify Layout Metadata**

Check `app/layout.tsx` (if it exists) to ensure there are no conflicting `icons` array that overrides the automatic Next.js router conventions.

Run: `cat app/layout.tsx | grep metadata -A 10`

- [ ] **Step 4: Start local dev server and test**

Run: `npm run dev` (in a separate terminal)
Expected: Open `http://localhost:3000` in browser. Inspect element -> Network tab -> refresh, ensure `/icon` or `/favicon` requests return a 200 OK and visually load the new icon with dark background correctly in the browser tab.

- [ ] **Step 5: Commit**

```bash
git add app/icon.tsx
git commit -m "chore: implement dynamic app icon with dark background"
```

---