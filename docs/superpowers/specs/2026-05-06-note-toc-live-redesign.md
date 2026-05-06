# Note Editor TOC & Live Mode Redesign

**Date:** 2026-05-06
**Status:** Approved
**Branch:** feature-v1.1-refactor

## Problem

1. **TOC (Table of Contents)** — Current implementation is a 140px fixed-width sidebar rendered via React Portal into `#side-panel-slot`. It requires IPC `resizeForSidePanel` calls to adjust window width. Visually: 10px font, minimal indentation, no tree lines, looks like a debug panel.

2. **Live Mode** — Current `LiveMarkdownEditor` uses block-level click-to-edit: click a block → textarea appears → blur → renders back to HTML. Interaction is clumsy; cursor management, selection, and block transitions feel unnatural.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| TOC layout | Dropdown floating panel in editor top-right | No layout shift, no IPC resize, cleaner UX |
| Live mode engine | Vditor with IR (Instant Rendering) mode | Matches Obsidian Live Preview behavior exactly; mature, well-maintained |
| Edit/Preview modes | Keep existing MarkdownEditor (textarea) and MarkdownPreview (marked) | No changes needed, low risk |

## Section 1: TOC Redesign

### What changes

- **Remove** Portal-based sidebar approach (`createPortal` into `#side-panel-slot`)
- **Remove** `resizeForSidePanel` IPC calls in NoteEditor
- **Remove** `#side-panel-slot` DOM lookup logic

### New TOC component

A dropdown floating panel positioned absolutely in the editor area:

- **Trigger**: Existing `List` icon button in toolbar + `Ctrl+Shift+O` shortcut
- **Position**: `position: absolute`, top-right of editor content area
- **Style**: Glassmorphism background (`rgba(30,30,35,0.95)` + `backdrop-filter: blur(20px)`), rounded corners, shadow
- **Tree navigation**: Indented items with CSS border-left connecting lines
- **Active heading**: Blue accent (`var(--accent-blue)`) with left border indicator
- **Close**: Click outside / Esc / toggle button
- **Font**: 11-12px (up from 10px)
- **Width**: ~220px (up from 140px)

### Heading click → scroll

- Live mode: Query `.vditor-ir h1, .vditor-ir h2, ...` elements, match by sequential index against extracted headings array, call `scrollIntoView()`
- Edit mode: Calculate textarea cursor position from line index, scroll
- Preview mode: Query rendered heading elements by index

### Files affected

- `src/renderer/src/components/common/TableOfContents.tsx` — Rewrite as floating dropdown
- `src/renderer/src/components/notes/NoteEditor.tsx` — Remove Portal, render TOC inline; remove `resizeForSidePanel` calls; remove `#side-panel-slot` logic

### Files unchanged

- `ipc-channels.ts` / `ipc-handlers.ts` / `window.ts` — `resize-for-side-panel` IPC channel stays (other features may use it); NoteEditor simply stops calling it

## Section 2: Vditor IR Mode Integration

### Vditor configuration

```
mode: 'ir'           // Instant Rendering (Obsidian Live Preview style)
toolbar: false        // NoteEditor manages its own toolbar
counter: { enable: true }
outline: { enable: false }  // We provide our own TOC
placeholder: '# 标题\n\n内容...'
theme: 'dark'
icon: 'ant'           // Ant Design icons
```

### Props interface

The rewritten `LiveMarkdownEditor` preserves the existing callback interface:

```
LiveMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onCursorLineChange?: (lineIndex: number | null) => void
  placeholder?: string
}
```

The Vditor wrapper is responsible for emitting `onCursorLineChange` by mapping cursor position to source line index.

### Lifecycle

1. `useEffect` initializes Vditor on mount with note content
2. `activeNoteId` changes → destroy old instance, create new one with new content
3. Mode switches to edit/preview → hide Vditor container (`display: none`), show textarea/preview
4. Mode switches back to live → show Vditor container; only call `setValue()` if content differs from last Vditor-known content (avoid unnecessary re-renders and cursor loss)

### Content sync & auto-save

- Vditor `input` event → `getValue()` → `handleChange(newValue)` → existing 3-second debounce auto-save
- `Ctrl+S` → `getValue()` → `doSave(false)`
- Unmount cleanup → `getValue()` → save if dirty

### TOC integration

- Extract headings from `getValue()` using existing `toc-extract.ts`
- Track current position: listen to Vditor's `keyup` event, get cursor via `window.getSelection()`, walk up DOM to find heading element (h1-h6), map heading text to source line index via extracted headings array. Emit `onCursorLineChange` with the matched line index.
- Heading click → scroll to Vditor's rendered heading element

### Init failure handling

If Vditor fails to initialize (JS error, resource load failure), catch the error in the init `useEffect` and fall back to showing the MarkdownEditor (plain textarea) with a toast notification. This ensures the user can always edit their notes.

### Theme customization

- Override Vditor's default CSS to match the app's dark design system
- Key properties: font family, font size, colors, code block style, heading styles
- Applied via a new CSS file imported alongside Vditor's default theme

### Files affected

- `src/renderer/src/components/common/LiveMarkdownEditor.tsx` — Rewrite as Vditor wrapper
- `src/renderer/src/components/notes/NoteEditor.tsx` — Adapt to new editor interface
- New file: Vditor theme override CSS (e.g., `src/renderer/src/styles/vditor-theme.css`)

### Dependencies added

- `vditor` (npm package)

### Files no longer referenced

- `src/renderer/src/lib/block-parser.ts` — File can stay, but no longer imported

## Section 3: Mode Switching & Integration

### Three-mode architecture

| Mode | Component | Behavior |
|------|-----------|----------|
| Live | Vditor (IR mode) | WYSIWYG: cursor line shows source, rest is rendered |
| Edit | MarkdownEditor (textarea) | Plain Markdown source editing |
| Preview | MarkdownPreview (marked) | Read-only rendered HTML |

### Mode switch flow

1. **Live → Edit**: `vditor.getValue()` → pass to MarkdownEditor
2. **Edit → Live**: MarkdownEditor value → `vditor.setValue(value)`
3. **Live/Edit → Preview**: Get current Markdown → render via MarkdownPreview
4. **Preview → Live/Edit**: Content preserved in state, render appropriate component

Content is never lost during mode switches. Unsaved changes are preserved.

### Preserved features

- `Ctrl+S` manual save
- 3-second debounce auto-save with toast notification
- H1 title auto-extraction
- Tag editing via TagInput
- `Ctrl+Shift+O` TOC toggle
- Dirty data save on unmount
- Back button with unsaved TOC cleanup

### Removed code

- Portal rendering (`createPortal` to `#side-panel-slot`)
- `resizeForSidePanel` calls in NoteEditor (including the unmount cleanup at line 117 of current NoteEditor.tsx)
- `#side-panel-slot` DOM lookup with timeout hack
- `block-parser.ts` imports (file preserved, no longer used)

### Unchanged files

- `NotesPanel.tsx` — Note list, filtering, sorting
- `MarkdownEditor.tsx` — Plain textarea editor
- `MarkdownPreview.tsx` — Read-only preview
- `noteStore.ts` / `petStore.ts` — State management
- `toc-extract.ts` — Heading extraction (reused)
- IPC layer — `resize-for-side-panel` channel preserved for other features

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Vditor bundle size (~500KB) | Dynamic `import('vditor')` in LiveMarkdownEditor; only loaded when live mode renders |
| Vditor CSS conflicts with app styles | Scoped theme overrides with high-specificity selectors |
| Vditor initialization latency | Show loading placeholder during init |
| Mode switch content sync bugs | Always source truth from `content` state, sync on every mode change |
| TOC scroll-to-heading in Vditor DOM | Use Vditor's outline API or query rendered heading elements by data attributes |
