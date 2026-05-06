# Note Editor TOC & Live Mode Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ugly TOC sidebar with a floating dropdown panel, and replace the clumsy block-based live editor with Vditor IR mode for Obsidian-style WYSIWYG editing.

**Architecture:** Two independent changes that share the NoteEditor component as integration point. TOC becomes a position:absolute dropdown overlay instead of a Portal sidebar. LiveMarkdownEditor becomes a Vditor wrapper using dynamic import. Both changes remove `resizeForSidePanel` IPC calls and Portal machinery.

**Tech Stack:** React 19, Vditor (IR mode), TypeScript, CSS with existing design tokens.

**Spec:** `docs/superpowers/specs/2026-05-06-note-toc-live-redesign.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Rewrite | `src/renderer/src/components/common/TableOfContents.tsx` | Floating dropdown TOC panel with tree lines |
| Rewrite | `src/renderer/src/components/common/LiveMarkdownEditor.tsx` | Vditor IR wrapper with dynamic import, fallback, cursor tracking |
| Modify | `src/renderer/src/components/notes/NoteEditor.tsx` | Remove Portal/resize logic, render TOC inline, adapt to Vditor |
| Create | `src/renderer/src/styles/vditor-theme.css` | Dark theme overrides matching app design system |
| Install | `vditor` (npm) | WYSIWYG markdown editor |

---

## Task 1: Install Vditor Dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install vditor**

```bash
cd b:/AI-projects/fun-pets
npm install vditor
```

- [ ] **Step 2: Verify installation**

```bash
ls node_modules/vditor/package.json
```

Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vditor dependency for WYSIWYG note editing"
```

---

## Task 2: Rewrite TableOfContents as Floating Dropdown

**Files:**
- Rewrite: `src/renderer/src/components/common/TableOfContents.tsx`

The TOC becomes a floating dropdown panel rendered inline (not via Portal). It receives an `open` boolean and an `onClose` callback, plus the existing content/maxLevel/currentLineIndex/onHeadingClick props.

**New props interface:**

```tsx
interface TableOfContentsProps {
  content: string
  maxLevel: number
  currentLineIndex: number | null
  onHeadingClick: (lineIndex: number) => void
  onClose: () => void
  open: boolean
}
```

- [ ] **Step 1: Rewrite TableOfContents.tsx**

Replace the entire file with a floating dropdown implementation:

```tsx
import { useMemo, useEffect, useRef } from 'react'
import { extractHeadings } from '@/lib/toc-extract'
import { X } from 'lucide-react'

interface TableOfContentsProps {
  content: string
  maxLevel: number
  currentLineIndex: number | null
  onHeadingClick: (lineIndex: number) => void
  onClose: () => void
  open: boolean
}

export default function TableOfContents({ content, maxLevel, currentLineIndex, onHeadingClick, onClose, open }: TableOfContentsProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const headings = useMemo(() => extractHeadings(content, maxLevel), [content, maxLevel])

  const activeHeadingLine = useMemo(() => {
    if (currentLineIndex === null || headings.length === 0) return null
    let active: number | null = null
    for (const h of headings) {
      if (h.lineIndex <= currentLineIndex) active = h.lineIndex
      else break
    }
    return active
  }, [headings, currentLineIndex])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid the opening click triggering close
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [open, onClose])

  // Esc to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  if (headings.length === 0) {
    return (
      <div ref={panelRef} style={{
        position: 'absolute', top: 8, right: 8, zIndex: 50,
        width: 200, background: 'rgba(30,30,35,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        padding: '20px 16px', textAlign: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-quaternary)' }}>暂无标题</span>
      </div>
    )
  }

  // Build tree structure for nested rendering
  const renderHeadings = () => (
    headings.map((h, idx) => {
      const isActive = h.lineIndex === activeHeadingLine
      const indent = (h.level - 1) * 14
      const hasNextSibling = headings.some((other, i) => i > idx && other.level === h.level)

      return (
        <div key={h.lineIndex} style={{ position: 'relative' }}>
          {/* Tree connecting line */}
          {h.level > 1 && (
            <div style={{
              position: 'absolute', left: 14 + (h.level - 2) * 14, top: 0, bottom: hasNextSibling ? 0 : '50%',
              width: 1, background: 'rgba(255,255,255,0.06)',
            }} />
          )}
          <div
            onClick={() => onHeadingClick(h.lineIndex)}
            style={{
              fontSize: h.level === 1 ? 12 : 11,
              padding: '3px 8px',
              paddingLeft: 8 + indent,
              color: isActive ? 'var(--accent-blue)' : 'var(--text-tertiary)',
              background: isActive ? 'rgba(10,132,255,0.08)' : 'transparent',
              borderLeft: isActive ? '2px solid rgba(10,132,255,0.6)' : '2px solid transparent',
              borderRadius: '0 4px 4px 0',
              cursor: 'pointer',
              fontWeight: isActive ? 500 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s ease, background 0.15s ease',
              lineHeight: '22px',
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            {h.text}
          </div>
        </div>
      )
    })
  )

  return (
    <div ref={panelRef} style={{
      position: 'absolute', top: 8, right: 8, zIndex: 50,
      width: 220, maxHeight: '80%',
      background: 'rgba(30,30,35,0.95)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      animation: 'toc-fade-in 0.15s ease-out',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, padding: '10px 14px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        color: 'var(--text-quaternary)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>目录</span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-quaternary)', padding: 0, display: 'flex',
        }}>
          <X size={12} />
        </button>
      </div>
      <div style={{ padding: '6px 0', overflowY: 'auto', maxHeight: 240 }}>
        {renderHeadings()}
      </div>
    </div>
  )
}
```

Also add a `@keyframes` animation in `src/renderer/src/styles/global.css` at the end:

```css
@keyframes toc-fade-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.web.json 2>&1 | head -20
```

Expected: No errors related to TableOfContents (other errors from existing code may be present)

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/common/TableOfContents.tsx src/renderer/src/styles/global.css
git commit -m "feat: rewrite TOC as floating dropdown panel with tree navigation"
```

---

## Task 3: Update NoteEditor to Remove Portal and Inline TOC

**Files:**
- Modify: `src/renderer/src/components/notes/NoteEditor.tsx`

Remove Portal machinery, remove `resizeForSidePanel` calls, render TOC inline inside the editor area with `position: relative`.

Key changes to NoteEditor.tsx:

1. **Remove imports**: `createPortal` from `react-dom`
2. **Remove state**: `portalTarget`, remove `tocVisibleRef` resize cleanup
3. **Remove effects**: Portal target resolution effect (lines 136-149)
4. **Remove from toggleToc**: `windowApi.resizeForSidePanel` calls
5. **Remove from unmount cleanup**: `resizeForSidePanel(-140)` call and `tocVisibleRef` check
6. **Remove from back button**: resize cleanup
7. **Change TOC rendering**: Replace Portal with inline `<TableOfContents>` inside the editor area, passing `open={tocVisible}`

- [ ] **Step 1: Edit NoteEditor.tsx — remove Portal and resize logic**

Changes to make:

```tsx
// REMOVE this import:
// import { createPortal } from 'react-dom'

// REMOVE these state/refs:
// const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
// const tocVisibleRef = useRef(tocVisible); tocVisibleRef.current = tocVisible

// REMOVE the entire useEffect for portal target resolution (lines 136-149)

// SIMPLIFY toggleToc — remove resizeForSidePanel calls:
const toggleToc = () => {
  setTocVisible(!tocVisible)
  setTocVisibleGlobal(!tocVisible)
}

// SIMPLIFY unmount cleanup — remove tocVisibleRef resize and tocVisible check:
useEffect(() => {
  return () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (dirtyRef.current) {
      const store = useNoteStore.getState()
      const { activeNoteId } = store
      const currentNote = store.notes.find((n) => n.id === activeNoteId)
      if (currentNote) {
        store.saveNoteContent(currentNote.id, contentRef.current)
        const h1 = extractH1Title(contentRef.current)
        if (h1 && h1 !== currentNote.title) {
          store.updateNoteTitle(currentNote.id, h1)
        }
      }
    }
  }
}, [])

// SIMPLIFY back button onClick — remove tocVisible resize:
onClick={() => {
  if (tocVisible) {
    setTocVisible(false)
    setTocVisibleGlobal(false)
  }
  setActiveNote(null)
}}
```

For the editor area, wrap with `position: relative` and render TOC inline:

```tsx
{/* Editor / Preview */}
<div ref={editorRef} className="flex-1 min-h-0" style={{ overflow: 'auto', position: 'relative' }}>
  {mode === 'live' ? (
    <LiveMarkdownEditor key={activeNoteId} value={content} onChange={handleChange} onCursorLineChange={setCurrentLineIndex} />
  ) : mode === 'edit' ? (
    <MarkdownEditor value={content} onChange={handleChange} onCursorLineChange={setCurrentLineIndex} placeholder="# 标题\n\n内容..." />
  ) : (
    <MarkdownPreview content={content} />
  )}
  <TableOfContents
    content={content}
    maxLevel={tocMaxLevel}
    currentLineIndex={currentLineIndex}
    onHeadingClick={handleHeadingClick}
    onClose={() => { setTocVisible(false); setTocVisibleGlobal(false) }}
    open={tocVisible}
  />
</div>
```

Remove the old Portal render at the bottom of the component (the `{portalTarget && createPortal(...)}`).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.web.json 2>&1 | head -20
```

Expected: No new errors

- [ ] **Step 3: Run dev server and visually verify**

```bash
npm run dev
```

Test: Open a note, click the TOC (List) button — should see floating dropdown. Press Esc — should close. `Ctrl+Shift+O` should toggle it. The window should NOT resize when TOC opens/closes.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/notes/NoteEditor.tsx
git commit -m "feat: inline TOC dropdown in editor, remove Portal and resize logic"
```

---

## Task 4: Create Vditor Theme Override CSS

**Files:**
- Create: `src/renderer/src/styles/vditor-theme.css`

This file overrides Vditor's default dark theme to match the app's design tokens. Uses high-specificity selectors to ensure overrides apply.

- [ ] **Step 1: Create vditor-theme.css**

```css
/* ============================================
   Vditor Dark Theme Override — FunPets Design System
   ============================================ */

/* Base editor area */
.vditor {
  border: none !important;
  background: transparent !important;
  color: var(--text-primary) !important;
  font-family: var(--font-family) !important;
}

.vditor--ir {
  background: transparent !important;
}

/* Content area */
.vditor-ir {
  background: transparent !important;
  color: var(--text-secondary) !important;
  font-size: 13px !important;
  line-height: 1.65 !important;
  padding: 8px 0 !important;
}

/* Headings */
.vditor-ir h1,
.vditor-ir .vditor-ir__heading[h1] {
  font-size: 17px !important;
  font-weight: 700 !important;
  color: var(--text-primary) !important;
  margin: 16px 0 8px !important;
  padding-bottom: 6px !important;
  border-bottom: 1px solid var(--separator) !important;
}

.vditor-ir h2,
.vditor-ir .vditor-ir__heading[h2] {
  font-size: 15px !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  margin: 14px 0 6px !important;
}

.vditor-ir h3,
.vditor-ir .vditor-ir__heading[h3] {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  margin: 12px 0 4px !important;
}

.vditor-ir h4,
.vditor-ir h5,
.vditor-ir h6 {
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--text-secondary) !important;
  margin: 10px 0 4px !important;
}

/* Paragraphs */
.vditor-ir p {
  margin: 6px 0 !important;
  color: var(--text-secondary) !important;
}

/* Code blocks */
.vditor-ir pre {
  background: rgba(0,0,0,0.3) !important;
  border-radius: var(--radius-sm) !important;
  border: 1px solid var(--separator) !important;
  padding: 12px !important;
  margin: 8px 0 !important;
}

.vditor-ir pre code {
  font-family: var(--font-mono) !important;
  font-size: 11px !important;
  color: var(--text-secondary) !important;
}

/* Inline code */
.vditor-ir code:not(pre code) {
  font-family: var(--font-mono) !important;
  font-size: 11px !important;
  background: rgba(255,255,255,0.06) !important;
  padding: 1px 5px !important;
  border-radius: 4px !important;
  color: var(--accent-teal) !important;
}

/* Blockquotes */
.vditor-ir blockquote {
  border-left: 3px solid var(--accent-blue) !important;
  padding-left: 12px !important;
  margin: 8px 0 !important;
  color: var(--text-tertiary) !important;
  font-style: italic !important;
}

/* Lists */
.vditor-ir ul,
.vditor-ir ol {
  padding-left: 20px !important;
  margin: 6px 0 !important;
}

.vditor-ir li {
  margin: 3px 0 !important;
  color: var(--text-secondary) !important;
}

/* Tables */
.vditor-ir table {
  width: 100% !important;
  border-collapse: collapse !important;
  margin: 8px 0 !important;
  font-size: 11px !important;
}

.vditor-ir th {
  background: rgba(255,255,255,0.06) !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  padding: 6px 10px !important;
  border: 1px solid var(--separator) !important;
}

.vditor-ir td {
  padding: 5px 10px !important;
  border: 1px solid var(--separator) !important;
  color: var(--text-secondary) !important;
}

/* Horizontal rules */
.vditor-ir hr {
  border: none !important;
  border-top: 1px solid var(--separator) !important;
  margin: 12px 0 !important;
}

/* Links */
.vditor-ir a {
  color: var(--accent-blue) !important;
  text-decoration: none !important;
}

/* Strong / emphasis */
.vditor-ir strong {
  color: var(--text-primary) !important;
  font-weight: 600 !important;
}

.vditor-ir em {
  color: var(--text-secondary) !important;
}

/* Toolbar hidden */
.vditor-toolbar {
  display: none !important;
}

/* Placeholder */
.vditor-ir .vditor-ir__marker--heading,
.vditor-ir .vditor-ir__marker--strong,
.vditor-ir .vditor-ir__marker--em {
  color: var(--text-quaternary) !important;
}

/* Selection highlight */
.vditor-ir ::selection {
  background: rgba(10,132,255,0.3) !important;
}

/* Image */
.vditor-ir img {
  max-width: 100% !important;
  border-radius: var(--radius-sm) !important;
}

/* Scrollbar inside vditor */
.vditor-ir::-webkit-scrollbar { width: 4px; }
.vditor-ir::-webkit-scrollbar-track { background: transparent; }
.vditor-ir::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

/* Loading state */
.vditor .vditor-reset--loading {
  color: var(--text-quaternary) !important;
  font-size: 12px !important;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/styles/vditor-theme.css
git commit -m "feat: add Vditor dark theme override CSS matching app design system"
```

---

## Task 5: Rewrite LiveMarkdownEditor as Vditor Wrapper

**Files:**
- Rewrite: `src/renderer/src/components/common/LiveMarkdownEditor.tsx`

This is the core change. Replace the block-based editor with a Vditor IR wrapper that:
- Dynamically imports Vditor
- Initializes in IR mode
- Syncs content via `getValue()` / `setValue()`
- Tracks cursor position for TOC
- Falls back to textarea on init failure

- [ ] **Step 1: Rewrite LiveMarkdownEditor.tsx**

```tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { extractHeadings } from '@/lib/toc-extract'
import 'vditor/dist/index.css'
import '@/styles/vditor-theme.css'

interface LiveMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onCursorLineChange?: (lineIndex: number | null) => void
  placeholder?: string
}

export default function LiveMarkdownEditor({ value, onChange, onCursorLineChange, placeholder }: LiveMarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<any>(null)
  const initialValueRef = useRef(value)
  const lastSyncedRef = useRef(value)
  const [fallback, setFallback] = useState(false)
  const [loading, setLoading] = useState(true)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onCursorLineChangeRef = useRef(onCursorLineChange)
  onCursorLineChangeRef.current = onCursorLineChange

  // Track cursor position for TOC
  const handleCursorTracking = useCallback(() => {
    if (!onCursorLineChangeRef.current || !vditorRef.current) return
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    let node = sel.anchorNode as HTMLElement | null
    if (!node) return
    // Walk up to find a heading element
    while (node && node !== containerRef.current) {
      if (node.nodeType === 1) {
        const el = node as HTMLElement
        const tag = el.tagName
        if (['H1','H2','H3','H4','H5','H6'].includes(tag)) {
          const text = el.textContent?.trim() ?? ''
          const md = vditorRef.current.getValue()
          const headings = extractHeadings(md)
          const match = headings.find(h => h.text === text)
          if (match) {
            onCursorLineChangeRef.current(match.lineIndex)
            return
          }
        }
      }
      node = node.parentElement
    }
    // Not in a heading — find closest heading above cursor
    const md = vditorRef.current.getValue()
    const lines = md.split('\n')
    // Estimate line from cursor position in DOM
    const vditorEl = containerRef.current?.querySelector('.vditor-ir')
    if (!vditorEl) return
    // Use a simpler approach: get the line count
    onCursorLineChangeRef.current(null)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false

    const initVditor = async () => {
      try {
        const Vditor = (await import('vditor')).default
        if (destroyed || !containerRef.current) return

        const vditor = new Vditor(containerRef.current, {
          mode: 'ir',
          toolbar: false,
          counter: { enable: true },
          outline: { enable: false },
          placeholder: placeholder ?? '# 标题\n\n内容...',
          theme: 'dark',
          icon: 'ant',
          value: initialValueRef.current,
          input: (val) => {
            lastSyncedRef.current = val
            onChangeRef.current(val)
          },
          after: () => {
            if (destroyed) return
            setLoading(false)
            lastSyncedRef.current = initialValueRef.current
          },
        })
        vditorRef.current = vditor
      } catch (err) {
        console.error('Vditor init failed, falling back to textarea:', err)
        setFallback(true)
        setLoading(false)
      }
    }

    initVditor()

    return () => {
      destroyed = true
      if (vditorRef.current) {
        try { vditorRef.current.destroy() } catch {}
        vditorRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync content when value changes externally (mode switch, note switch)
  useEffect(() => {
    if (!vditorRef.current) return
    if (value !== lastSyncedRef.current) {
      lastSyncedRef.current = value
      vditorRef.current.setValue(value)
    }
  }, [value])

  // Cursor tracking via keyup
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = () => handleCursorTracking()
    el.addEventListener('keyup', handler)
    el.addEventListener('click', handler)
    return () => {
      el.removeEventListener('keyup', handler)
      el.removeEventListener('click', handler)
    }
  }, [handleCursorTracking])

  // Fallback: plain textarea
  if (fallback) {
    return (
      <textarea
        className="w-full h-full bg-transparent text-xs text-white/80 font-mono resize-none outline-none placeholder:text-white/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    )
  }

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {loading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-quaternary)', fontSize: 12,
          background: 'rgba(28,28,30,0.5)',
        }}>
          加载编辑器...
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.web.json 2>&1 | head -20
```

Expected: No errors related to LiveMarkdownEditor

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/common/LiveMarkdownEditor.tsx
git commit -m "feat: rewrite LiveMarkdownEditor as Vditor IR wrapper with dynamic import"
```

---

## Task 6: Update NoteEditor Heading Click for Vditor DOM

**Files:**
- Modify: `src/renderer/src/components/notes/NoteEditor.tsx`

The `handleHeadingClick` function currently uses `data-start-line` for live mode. Update it to query `.vditor-ir h1, h2, ...` elements and match by sequential index.

- [ ] **Step 1: Update handleHeadingClick**

Replace the live mode branch in `handleHeadingClick`:

```tsx
const handleHeadingClick = (lineIndex: number) => {
  setCurrentLineIndex(lineIndex)
  if (!editorRef.current) return

  if (mode === 'edit') {
    const textarea = editorRef.current.querySelector('textarea')
    if (textarea) {
      const lines = content.split('\n')
      let pos = 0
      for (let i = 0; i < lineIndex; i++) pos += (lines[i]?.length ?? 0) + 1
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
      textarea.scrollTop = lineIndex * 20
    }
    return
  }

  if (mode === 'live') {
    const headings = extractHeadings(content, tocMaxLevel)
    const targetIdx = headings.findIndex(h => h.lineIndex === lineIndex)
    if (targetIdx !== -1) {
      const headingEls = editorRef.current.querySelectorAll('.vditor-ir h1, .vditor-ir h2, .vditor-ir h3, .vditor-ir h4, .vditor-ir h5, .vditor-ir h6')
      if (headingEls.length > targetIdx) {
        const el = headingEls[targetIdx] as HTMLElement
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    return
  }

  // preview mode
  const headings = extractHeadings(content, tocMaxLevel)
  const targetIdx = headings.findIndex(h => h.lineIndex === lineIndex)
  if (targetIdx !== -1) {
    const headingEls = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
    if (headingEls.length > targetIdx) {
      scrollToElement(headingEls[targetIdx] as HTMLElement)
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.web.json 2>&1 | head -20
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/notes/NoteEditor.tsx
git commit -m "feat: update heading click to use Vditor DOM selectors"
```

---

## Task 7: Integration Testing & Visual Polish

**Files:**
- Potentially modify: `src/renderer/src/styles/vditor-theme.css`
- Potentially modify: `src/renderer/src/components/common/LiveMarkdownEditor.tsx`

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test TOC floating panel**

Checklist:
- [ ] Open a note with headings → click List icon → TOC dropdown appears
- [ ] Active heading highlighted with blue accent
- [ ] Click a heading → editor scrolls to that heading
- [ ] Press Esc → TOC closes
- [ ] Click outside TOC → TOC closes
- [ ] Click List icon again → TOC toggles off
- [ ] `Ctrl+Shift+O` → TOC toggles
- [ ] Window does NOT resize when TOC opens/closes
- [ ] Switch between notes → TOC closes or updates correctly

- [ ] **Step 3: Test Vditor IR mode**

Checklist:
- [ ] Open a note in live mode → content renders with WYSIWYG
- [ ] Type `**bold**` → text renders bold when cursor moves away
- [ ] Type `## Heading` → renders as heading
- [ ] Type `- list item` → renders as list
- [ ] Cursor position shows source markdown, rest is rendered
- [ ] Auto-save triggers after 3 seconds of inactivity
- [ ] `Ctrl+S` → manual save works
- [ ] Switch to Edit mode → content preserved in textarea
- [ ] Edit in Edit mode → switch back to Live → changes appear
- [ ] Switch to Preview → renders correctly
- [ ] Switch back to Live → content intact

- [ ] **Step 4: Test edge cases**

Checklist:
- [ ] Open a note with no content → placeholder shows
- [ ] Open a note with only headings → TOC works
- [ ] Switch rapidly between modes → no crash, no content loss
- [ ] Switch between different notes → content loads correctly
- [ ] Close note with unsaved changes → auto-saves

- [ ] **Step 5: Fix any issues found and commit**

```bash
git add -A
git commit -m "fix: polish TOC and Vditor integration"
```

---

## Task 8: Final Cleanup

**Files:**
- Potentially modify: `src/renderer/src/components/notes/NoteEditor.tsx` — remove unused imports

- [ ] **Step 1: Remove unused imports in NoteEditor.tsx**

Remove if present:
- `createPortal` from `react-dom` (if not already removed)
- `windowApi` import from `@/lib/ipc` (no longer used after removing resizeForSidePanel)
- Any unused refs: `tocVisibleRef`
- Remove `block-parser` import if it exists anywhere

- [ ] **Step 2: Verify full TypeScript compilation**

```bash
npx tsc --noEmit -p tsconfig.web.json && npx tsc --noEmit -p tsconfig.node.json
```

Expected: Clean compilation

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: clean up unused imports after TOC/Vditor refactor"
```
