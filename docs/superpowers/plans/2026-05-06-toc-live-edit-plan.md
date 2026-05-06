# TOC Outline + Live Editing Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a document outline panel (TOC) and a Typora-style live Markdown editing mode to the note editor.

**Architecture:** Extend the existing note editor with three editing modes (live/edit/preview) using a textarea-per-block approach for live mode. Add a collapsible TOC panel on the leftmost side of the editor via a reusable sidebar slot, with IPC-based window resizing to keep the editor width unchanged.

**Tech Stack:** React 19, TypeScript, Zustand + Immer, Motion (Framer Motion), `marked` library, Electron IPC.

**Spec:** `docs/superpowers/specs/2026-05-06-toc-live-edit-design.md`

---

## File Structure

### New files
- `src/renderer/src/lib/block-parser.ts` — Markdown block parser (pure function, splits source into semantic blocks)
- `src/renderer/src/lib/toc-extract.ts` — TOC heading extraction from Markdown source (pure function)
- `src/renderer/src/components/common/TableOfContents.tsx` — TOC panel UI component
- `src/renderer/src/components/common/LiveMarkdownEditor.tsx` — Typora-style live editor component

### Modified files
- `src/renderer/src/stores/noteStore.ts` — Add `editorMode`, `tocMaxLevel`, `setEditorMode`, `setTocMaxLevel` to store + persistence
- `src/renderer/src/components/notes/NoteEditor.tsx` — Three-mode toggle, TOC trigger button, integrate LiveMarkdownEditor and TableOfContents
- `src/renderer/src/components/sidebar/Sidebar.tsx` — Add side panel slot for TOC (controlled by NoteEditor state, lifted via petStore)
- `src/renderer/src/stores/petStore.ts` — Add `tocVisible` and `setTocVisible` state for sidebar slot control
- `src/renderer/src/components/settings/SettingsPanel.tsx` — Add tocMaxLevel setting in editor group
- `src/renderer/src/lib/ipc.ts` — Add `resizeForSidePanel` helper using existing `windowApi.setBounds`

---

## Task 1: Store Updates — editorMode and tocMaxLevel persistence

**Files:**
- Modify: `src/renderer/src/stores/noteStore.ts:8-27,54-57,163-171`

- [ ] **Step 1: Add editorMode and tocMaxLevel to NoteStore interface**

Add to the interface at line 13 (after `viewMode`):
```typescript
editorMode: 'live' | 'edit' | 'preview'
tocMaxLevel: number
```

Add setters after line 26:
```typescript
setEditorMode: (mode: 'live' | 'edit' | 'preview') => void
setTocMaxLevel: (level: number) => void
```

- [ ] **Step 2: Add default values and setter implementations**

Add defaults at line 35 (after `viewMode: 'card'`):
```typescript
editorMode: 'live' as const,
tocMaxLevel: 3,
```

Add setter implementations after `setViewMode` (after line 171):
```typescript
setEditorMode: (mode) => {
  set({ editorMode: mode })
  store.set('notePrefs', { sortBy: get().sortBy, viewMode: get().viewMode, editorMode: mode, tocMaxLevel: get().tocMaxLevel })
},

setTocMaxLevel: (level) => {
  set({ tocMaxLevel: Math.max(1, Math.min(6, level)) })
  store.set('notePrefs', { sortBy: get().sortBy, viewMode: get().viewMode, editorMode: get().editorMode, tocMaxLevel: level })
},
```

- [ ] **Step 3: Update notePrefs loading to read new fields**

At line 54-57, update the prefs read to include new fields:
```typescript
const prefs = await store.get<{ sortBy: string; viewMode: string; editorMode?: string; tocMaxLevel?: number }>('notePrefs')
if (prefs) {
  set({
    sortBy: (prefs.sortBy as any) ?? 'time',
    viewMode: (prefs.viewMode as any) ?? 'card',
    editorMode: (prefs.editorMode as 'live' | 'edit' | 'preview') ?? 'live',
    tocMaxLevel: prefs.tocMaxLevel ?? 3,
  })
}
```

- [ ] **Step 4: Update existing setSortBy and setViewMode to include new fields in notePrefs writes**

At line 165, update `setSortBy`:
```typescript
store.set('notePrefs', { sortBy: sort, viewMode: get().viewMode, editorMode: get().editorMode, tocMaxLevel: get().tocMaxLevel })
```

At line 170, update `setViewMode`:
```typescript
store.set('notePrefs', { sortBy: get().sortBy, viewMode: mode, editorMode: get().editorMode, tocMaxLevel: get().tocMaxLevel })
```

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/noteStore.ts
git commit -m "feat: add editorMode and tocMaxLevel to noteStore with persistence"
```

---

## Task 2: TOC Heading Extraction Utility

**Files:**
- Create: `src/renderer/src/lib/toc-extract.ts`

- [ ] **Step 1: Create the TOC extraction module**

```typescript
// src/renderer/src/lib/toc-extract.ts

export interface TocHeading {
  level: number  // 1-6
  text: string
  lineIndex: number  // 0-based line number in source
}

const headingRegex = /^(#{1,6})\s+(.+)$/

export function extractHeadings(source: string, maxLevel = 3): TocHeading[] {
  const lines = source.split('\n')
  const headings: TocHeading[] = []

  for (let i = 0; i < lines.length; i++) {
    const match = headingRegex.exec(lines[i])
    if (match) {
      const level = match[1].length
      if (level <= maxLevel) {
        headings.push({ level, text: match[2].trim(), lineIndex: i })
      }
    }
  }

  return headings
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/lib/toc-extract.ts
git commit -m "feat: add TOC heading extraction utility"
```

---

## Task 3: Markdown Block Parser

**Files:**
- Create: `src/renderer/src/lib/block-parser.ts`

- [ ] **Step 1: Create the block parser**

```typescript
// src/renderer/src/lib/block-parser.ts

export type BlockType = 'heading' | 'paragraph' | 'list' | 'code' | 'blockquote' | 'table' | 'hr' | 'html'

export interface Block {
  type: BlockType
  content: string
  startLine: number
  endLine: number
}

const codeFenceRegex = /^(`{3,}|~{3,})/
const headingRegex = /^#{1,6}\s/
const hrRegex = /^(-{3,}|\*{3,}|_{3,})(\s*)$/
const tableRegex = /^\|(.+)\|$/
const blockquoteRegex = /^>\s?/
const listRegex = /^(\s*)([-*+]|\d+\.)\s/

export function parseBlocks(source: string): Block[] {
  const lines = source.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty lines
    if (line.trim() === '') {
      i++
      continue
    }

    // Fenced code block
    const fenceMatch = codeFenceRegex.exec(line)
    if (fenceMatch) {
      const startLine = i
      const fenceChar = fenceMatch[1][0]  // ` or ~
      const fenceLen = fenceMatch[1].length
      i++
      while (i < lines.length) {
        const closingMatch = codeFenceRegex.exec(lines[i])
        if (closingMatch && closingMatch[1][0] === fenceChar && closingMatch[1].length >= fenceLen) break
        i++
      }
      if (i < lines.length) i++ // closing fence
      blocks.push({ type: 'code', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
      continue
    }

    // Heading
    if (headingRegex.test(line)) {
      blocks.push({ type: 'heading', content: line, startLine: i, endLine: i })
      i++
      continue
    }

    // Horizontal rule
    if (hrRegex.test(line)) {
      blocks.push({ type: 'hr', content: line, startLine: i, endLine: i })
      i++
      continue
    }

    // Table (collect consecutive table lines)
    if (tableRegex.test(line)) {
      const startLine = i
      while (i < lines.length && tableRegex.test(lines[i])) i++
      blocks.push({ type: 'table', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
      continue
    }

    // Blockquote
    if (blockquoteRegex.test(line)) {
      const startLine = i
      while (i < lines.length && (blockquoteRegex.test(lines[i]) || lines[i].trim() === '')) i++
      blocks.push({ type: 'blockquote', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
      continue
    }

    // List
    if (listRegex.test(line)) {
      const startLine = i
      while (i < lines.length && (listRegex.test(lines[i]) || (lines[i].trim() !== '' && !headingRegex.test(lines[i]) && !codeFenceRegex.test(lines[i]) && !blockquoteRegex.test(lines[i])))) {
        i++
        // Stop if we hit an empty line followed by a non-list line
        if (i < lines.length && lines[i].trim() === '') {
          if (i + 1 < lines.length && !listRegex.test(lines[i + 1])) break
          i++
        }
      }
      blocks.push({ type: 'list', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
      continue
    }

    // Paragraph (collect until empty line or block element)
    {
      const startLine = i
      while (i < lines.length && lines[i].trim() !== '' && !headingRegex.test(lines[i]) && !codeFenceRegex.test(lines[i]) && !hrRegex.test(lines[i]) && !blockquoteRegex.test(lines[i]) && !listRegex.test(lines[i])) {
        i++
      }
      blocks.push({ type: 'paragraph', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
    }
  }

  return blocks
}

/**
 * Replace a block's content in the source string using line-splice.
 * This avoids stale line-index issues — it operates on the current source
 * and current block positions, then re-parse happens on the next render.
 */
export function replaceBlockInSource(source: string, block: Block, newContent: string): string {
  const lines = source.split('\n')
  const newLines = newContent.split('\n')
  lines.splice(block.startLine, block.endLine - block.startLine + 1, ...newLines)
  return lines.join('\n')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/lib/block-parser.ts
git commit -m "feat: add Markdown block parser for live editing mode"
```

---

## Task 4: TableOfContents Component

**Files:**
- Create: `src/renderer/src/components/common/TableOfContents.tsx`

- [ ] **Step 1: Create the TOC component**

```tsx
// src/renderer/src/components/common/TableOfContents.tsx
import { useMemo } from 'react'
import { extractHeadings, type TocHeading } from '@/lib/toc-extract'
import { X } from 'lucide-react'

interface TableOfContentsProps {
  content: string
  maxLevel: number
  currentLineIndex: number | null
  onHeadingClick: (lineIndex: number) => void
  onClose: () => void
}

export default function TableOfContents({ content, maxLevel, currentLineIndex, onHeadingClick, onClose }: TableOfContentsProps) {
  const headings = useMemo(() => extractHeadings(content, maxLevel), [content, maxLevel])

  // Find which heading the current line belongs to
  const activeHeadingLine = useMemo(() => {
    if (currentLineIndex === null || headings.length === 0) return null
    let active: number | null = null
    for (const h of headings) {
      if (h.lineIndex <= currentLineIndex) active = h.lineIndex
      else break
    }
    return active
  }, [headings, currentLineIndex])

  if (headings.length === 0) {
    return (
      <div style={{ width: 140, background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-quaternary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span>目录</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-quaternary)', padding: 0, display: 'flex' }}>
            <X size={10} />
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <span style={{ fontSize: 10, color: 'var(--text-quaternary)' }}>暂无标题</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: 140, background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-quaternary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span>目录</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-quaternary)', padding: 0, display: 'flex' }}>
          <X size={10} />
        </button>
      </div>
      <div style={{ flex: 1, padding: '6px 4px', overflowY: 'auto', fontSize: 10 }}>
        {headings.map((h) => {
          const isActive = h.lineIndex === activeHeadingLine
          const indent = (h.level - 1) * 8
          return (
            <div
              key={h.lineIndex}
              onClick={() => onHeadingClick(h.lineIndex)}
              style={{
                padding: '3px 5px',
                paddingLeft: 5 + indent,
                color: isActive ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                background: isActive ? 'rgba(10,132,255,0.1)' : 'transparent',
                borderRadius: 4,
                cursor: 'pointer',
                marginBottom: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 500 : 400,
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              {h.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/common/TableOfContents.tsx
git commit -m "feat: add TableOfContents component"
```

---

## Task 5: Window Resize Helper for Side Panel

**Files:**
- Modify: `src/renderer/src/lib/ipc.ts:29-65`

- [ ] **Step 1: Add resizeForSidePanel helper to windowApi**

Add after `restoreDefault` (line 51):
```typescript
resizeForSidePanel: async (panelWidth: number) => {
  const bounds = await windowApi.getWindowBounds()
  if (!bounds) return
  // Expand leftward: decrease x, increase width
  const newBounds = {
    x: bounds.x - panelWidth,
    y: bounds.y,
    width: bounds.width + panelWidth,
    height: bounds.height,
  }
  // Clamp to screen: don't go past left edge
  if (newBounds.x < 0) {
    newBounds.x = 0
  }
  await windowApi.setBounds(newBounds)
},
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/lib/ipc.ts
git commit -m "feat: add resizeForSidePanel helper for TOC window resize"
```

---

## Task 6: Sidebar Layout — Side Panel Slot + petStore tocVisible

**Files:**
- Modify: `src/renderer/src/stores/petStore.ts` — Add tocVisible state
- Modify: `src/renderer/src/components/sidebar/Sidebar.tsx` — Add animated slot

- [ ] **Step 1: Add tocVisible to petStore**

Read `src/renderer/src/stores/petStore.ts` and add to the store interface:
```typescript
tocVisible: boolean
setTocVisible: (v: boolean) => void
```

In the store implementation, add defaults:
```typescript
tocVisible: false,
```

And the setter:
```typescript
setTocVisible: (v) => set({ tocVisible: v }),
```

- [ ] **Step 2: Add animated side panel slot in Sidebar.tsx**

Add import at the top:
```tsx
import { usePetStore } from '@/stores/petStore'
import { motion, AnimatePresence } from 'motion/react'
```

Inside the component, add:
```tsx
const tocVisible = usePetStore((s) => s.tocVisible)
```

Before PanelRouter (line 30), add an animated slot:
```tsx
<AnimatePresence>
  {tocVisible && (
    <motion.div
      id="side-panel-slot"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 140, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ flexShrink: 0, overflow: 'hidden' }}
    />
  )}
</AnimatePresence>
```

This provides the 200ms spring-like animation specified in the design spec. The slot uses a portal pattern — `TableOfContents` renders into `#side-panel-slot` via React portal.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/stores/petStore.ts src/renderer/src/components/sidebar/Sidebar.tsx
git commit -m "feat: add animated side panel slot to Sidebar for TOC"
```

---

## Task 7: LiveMarkdownEditor + MarkdownEditor onCursorLineChange

**IMPORTANT:** This task must be completed BEFORE Task 8 (NoteEditor integration) because Task 8 references both `LiveMarkdownEditor` and the `onCursorLineChange` prop.

**Files:**
- Create: `src/renderer/src/components/common/LiveMarkdownEditor.tsx`
- Modify: `src/renderer/src/components/common/MarkdownEditor.tsx` — Add optional onCursorLineChange prop

- [ ] **Step 1: Add onCursorLineChange prop to MarkdownEditor**

In `src/renderer/src/components/common/MarkdownEditor.tsx`, add to props interface:
```typescript
onCursorLineChange?: (lineIndex: number | null) => void
```

In the textarea, add onSelect handler:
```typescript
onSelect={(e) => {
  if (props.onCursorLineChange) {
    const textarea = e.currentTarget
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart)
    const lineIndex = textBeforeCursor.split('\n').length - 1
    props.onCursorLineChange(lineIndex)
  }
}}
```

- [ ] **Step 2: Create LiveMarkdownEditor component**

```tsx
// src/renderer/src/components/common/LiveMarkdownEditor.tsx
import { useState, useRef, useCallback, useMemo } from 'react'
import { marked } from 'marked'
import { parseBlocks, replaceBlockInSource, type Block } from '@/lib/block-parser'

interface LiveMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onCursorLineChange?: (lineIndex: number | null) => void
  placeholder?: string
}

export default function LiveMarkdownEditor({ value, onChange, onCursorLineChange, placeholder }: LiveMarkdownEditorProps) {
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRefs = useRef<Map<number, HTMLTextAreaElement>>(new Map())

  const blocks = useMemo(() => parseBlocks(value), [value])

  const handleBlockFocus = useCallback((index: number) => {
    setActiveBlockIndex(index)
    if (onCursorLineChange) {
      onCursorLineChange(blocks[index]?.startLine ?? null)
    }
  }, [blocks, onCursorLineChange])

  const handleBlockBlur = useCallback(() => {
    setActiveBlockIndex(null)
  }, [])

  const handleBlockChange = useCallback((index: number, newContent: string) => {
    const block = blocks[index]
    if (!block) return
    const newSource = replaceBlockInSource(value, block, newContent)
    onChange(newSource)
  }, [blocks, value, onChange])

  // Auto-resize textarea to fit content
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])

  const renderBlock = (block: Block, index: number) => {
    const isActive = activeBlockIndex === index

    if (isActive) {
      return (
        <textarea
          key={`edit-${index}`}
          ref={(el) => { if (el) { textareaRefs.current.set(index, el); autoResize(el) } }}
          value={block.content}
          onChange={(e) => { handleBlockChange(index, e.target.value); autoResize(e.target) }}
          onFocus={() => handleBlockFocus(index)}
          onBlur={handleBlockBlur}
          autoFocus
          style={{
            width: '100%',
            minHeight: 24,
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(10,132,255,0.20)',
            borderRadius: 4,
            padding: '6px 8px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.5,
            resize: 'none',
            outline: 'none',
            display: 'block',
            boxSizing: 'border-box',
          }}
        />
      )
    }

    if (block.content.trim() === '' && block.type === 'paragraph') {
      return (
        <div
          key={`render-${index}`}
          onClick={() => handleBlockFocus(index)}
          style={{ minHeight: 24, cursor: 'text', borderRadius: 4, padding: '6px 8px', color: 'var(--text-quaternary)', fontSize: 12 }}
        >
          {placeholder ?? ''}
        </div>
      )
    }

    const html = block.type === 'hr'
      ? '<hr/>'
      : (marked.parse(block.content, { async: false }) as string)

    return (
      <div
        key={`render-${index}`}
        onClick={() => handleBlockFocus(index)}
        style={{
          cursor: 'text',
          borderRadius: 4,
          padding: '6px 8px',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--text-primary)',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto"
      style={{ padding: '8px 0' }}
    >
      {blocks.length === 0 ? (
        <div
          onClick={() => {
            onChange('# 标题\n\n')
            setTimeout(() => setActiveBlockIndex(0), 0)
          }}
          style={{ padding: '8px', color: 'var(--text-quaternary)', fontSize: 12, cursor: 'text' }}
        >
          {placeholder ?? '# 标题\n\n'}
        </div>
      ) : (
        blocks.map((block, index) => renderBlock(block, index))
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/common/LiveMarkdownEditor.tsx src/renderer/src/components/common/MarkdownEditor.tsx
git commit -m "feat: add LiveMarkdownEditor with Typora-style block editing and auto-resize"
```

---

## Task 8: NoteEditor — Three-Mode Toggle + TOC Integration

**IMPORTANT:** This task depends on Tasks 6, 7 (LiveMarkdownEditor and MarkdownEditor must exist first).

**Files:**
- Modify: `src/renderer/src/components/notes/NoteEditor.tsx`

This is the main integration task. It modifies NoteEditor to:
1. Extend mode toggle to three buttons (⚡ live | ✏️ edit | 👁 preview)
2. Add ☰ TOC toggle button
3. Render TableOfContents via portal when TOC is open
4. Handle window resize when TOC opens/closes
5. Integrate LiveMarkdownEditor for live mode

- [ ] **Step 1: Update imports**

```typescript
import { Zap, Pencil, Eye, List } from 'lucide-react'
import { createPortal } from 'react-dom'
import LiveMarkdownEditor from '@/components/common/LiveMarkdownEditor'
import TableOfContents from '@/components/common/TableOfContents'
import { usePetStore } from '@/stores/petStore'
import { windowApi } from '@/lib/ipc'
```

Remove the old `Pencil, Eye` from the existing import since they're replaced above.

- [ ] **Step 2: Extend mode state and add TOC state**

Replace the mode state (line 27). Initialize directly from store:
```typescript
const [mode, setMode] = useState<'live' | 'edit' | 'preview'>(
  () => useNoteStore.getState().editorMode
)
const [tocVisible, setTocVisible] = useState(false)
const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(0)
const editorRef = useRef<HTMLDivElement>(null)
```

Add store subscriptions:
```typescript
const tocMaxLevel = useNoteStore((s) => s.tocMaxLevel)
const setTocVisibleGlobal = usePetStore((s) => s.setTocVisible)
```

- [ ] **Step 3: Add TOC toggle handler with window resize**

```typescript
const toggleToc = async () => {
  const nextVisible = !tocVisible
  setTocVisible(nextVisible)
  setTocVisibleGlobal(nextVisible)
  if (nextVisible) {
    await windowApi.resizeForSidePanel(140)
  } else {
    await windowApi.resizeForSidePanel(-140)
  }
}
```

- [ ] **Step 4: Close TOC when leaving editor**

Update the back button handler and unmount cleanup to close TOC:
```typescript
const handleBack = async () => {
  if (tocVisible) {
    setTocVisible(false)
    setTocVisibleGlobal(false)
    await windowApi.resizeForSidePanel(-140)
  }
  setActiveNote(null)
}
```

Also update the unmount cleanup (lines 72-88) to close TOC:
```typescript
useEffect(() => {
  return () => {
    if (tocVisible) {
      usePetStore.getState().setTocVisible(false)
      windowApi.resizeForSidePanel(-140)
    }
    // ... existing cleanup
  }
}, [])
```

- [ ] **Step 5: Add scroll-to-heading handler**

```typescript
const handleHeadingClick = (lineIndex: number) => {
  setCurrentLineIndex(lineIndex)
  if (!editorRef.current) return

  if (mode === 'preview') {
    // Preview mode: find rendered heading by scanning h1-h6 elements
    const headingEls = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
    // Match heading text to find the right element
    const headings = extractHeadings(content, tocMaxLevel)
    const target = headings.find(h => h.lineIndex === lineIndex)
    if (target) {
      for (const el of headingEls) {
        if (el.textContent?.trim() === target.text) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          break
        }
      }
    }
  } else {
    // Edit/Live mode: estimate scroll position by line count
    const lineHeight = 20
    editorRef.current.scrollTop = lineIndex * lineHeight
  }
}
```

Add `import { extractHeadings } from '@/lib/toc-extract'` to imports.

- [ ] **Step 6: Replace toggle UI (lines 133-159) with three-button version**

```tsx
{/* TOC toggle */}
<motion.button
  onClick={toggleToc}
  whileTap={{ scale: 0.9 }}
  style={{
    width: 24, height: 24, borderRadius: 5,
    background: tocVisible ? 'rgba(10,132,255,0.15)' : 'transparent',
    border: tocVisible ? '0.5px solid rgba(10,132,255,0.30)' : 'none',
    color: tocVisible ? 'var(--accent-blue)' : 'var(--text-quaternary)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s ease, color 0.2s ease',
  }}
>
  <List size={12} />
</motion.button>

{/* Mode toggle */}
<div className="flex gap-0.5" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
  {([
    ['live', Zap],
    ['edit', Pencil],
    ['preview', Eye],
  ] as const).map(([m, Icon]) => (
    <motion.button
      key={m}
      onClick={() => {
        setMode(m)
        useNoteStore.getState().setEditorMode(m)
      }}
      whileTap={{ scale: 0.9 }}
      style={{
        width: 28, height: 24, borderRadius: 5,
        background: mode === m ? 'var(--accent-blue)' : 'transparent',
        color: mode === m ? '#fff' : 'var(--text-quaternary)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s ease, color 0.2s ease',
      }}
    >
      <Icon size={12} />
    </motion.button>
  ))}
</div>
```

- [ ] **Step 7: Update editor/preview rendering section**

Replace lines 171-177. Wrap in a ref div for scroll-to-heading:
```tsx
<div ref={editorRef} className="flex-1 min-h-0" style={{ overflow: 'auto' }}>
  {mode === 'live' ? (
    <LiveMarkdownEditor value={content} onChange={handleChange} onCursorLineChange={setCurrentLineIndex} />
  ) : mode === 'edit' ? (
    <MarkdownEditor value={content} onChange={handleChange} onCursorLineChange={setCurrentLineIndex} placeholder="# 标题\n\n内容..." />
  ) : (
    <MarkdownPreview content={content} />
  )}
</div>
```

- [ ] **Step 8: Add TOC portal rendering**

After the main component div, add:
```tsx
{tocVisible && typeof document !== 'undefined' && document.getElementById('side-panel-slot') && createPortal(
  <TableOfContents
    content={content}
    maxLevel={tocMaxLevel}
    currentLineIndex={currentLineIndex}
    onHeadingClick={handleHeadingClick}
    onClose={toggleToc}
  />,
  document.getElementById('side-panel-slot')!
)}
```

- [ ] **Step 9: Update dirty indicator to show in all modes**

Change line 128 from `mode === 'edit'` to `dirty`:
```tsx
{dirty && (
  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-orange)', flexShrink: 0 }} />
)}
```

- [ ] **Step 10: Commit**

```bash
git add src/renderer/src/components/notes/NoteEditor.tsx
git commit -m "feat: integrate three-mode toggle and TOC panel into NoteEditor"
```

---

## Task 9: Settings — tocMaxLevel Configuration

**Files:**
- Modify: `src/renderer/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1: Add editor settings group after "应用行为" group (after line 613)**

Add `Pencil` to the lucide-react import.

Add a reactive subscription inside the component:
```tsx
const tocMaxLevel = useNoteStore((s) => s.tocMaxLevel)
const setTocMaxLevel = useNoteStore((s) => s.setTocMaxLevel)
```

Add after the "应用行为" SettingsGroup:
```tsx
{/* ===== Editor Group ===== */}
<SettingsGroup
  icon={<Pencil size={16} />}
  title="编辑器"
  iconColor="var(--accent-teal)"
>
  <NumberInputRow
    label="目录显示层级"
    value={tocMaxLevel}
    unit="级"
    min={1}
    max={6}
    onChange={setTocMaxLevel}
  />
</SettingsGroup>
```

This setting takes effect immediately (no save button needed), consistent with the spec.

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/settings/SettingsPanel.tsx
git commit -m "feat: add tocMaxLevel setting to settings panel"
```

---

## Task 10: Keyboard Shortcut — Ctrl+Shift+O

**Files:**
- Modify: `src/renderer/src/components/notes/NoteEditor.tsx`

- [ ] **Step 1: Add Ctrl+Shift+O keyboard shortcut**

Add alongside the existing Ctrl+S handler (after line 69):
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
      e.preventDefault()
      toggleToc()
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [tocVisible])
```

- [ ] **Step 2: Final integration test — run the dev server and verify**

Run: `cd b:/AI-projects/fun-pets && npm run dev`

Verify:
1. Open a note → editor opens in live mode by default
2. Three-button toggle works: ⚡ live / ✏️ edit / 👁 preview
3. Click ☰ → TOC panel appears on leftmost side, window expands left
4. Click ✕ or ☰ again → TOC closes, window shrinks back
5. Ctrl+Shift+O toggles TOC
6. Click heading in TOC → editor scrolls to position
7. Live mode: click rendered text → switches to textarea, blur → renders
8. Settings page shows tocMaxLevel stepper
9. Editor mode preference persists across note switches
10. Back button closes TOC and restores window size

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/notes/NoteEditor.tsx
git commit -m "feat: add Ctrl+Shift+O keyboard shortcut for TOC toggle"
```
