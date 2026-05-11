# PDF Export for Plans and Notes

## Overview

Add PDF export capability to plans and notes with two trigger points: list item context menu and detail page navigation bar. Exported PDFs embed images inline and render markdown with code highlighting, matching Obsidian-quality output.

## Requirements

- Two trigger points: list item context menu and detail page "more" button
- Simple export dialog: radio select between "Title + Body" and "Full Metadata + Body"
- Images always embedded as data URLs (not optional)
- High-quality PDF output using Chrome's rendering engine (Electron `printToPDF`)
- Code syntax highlighting preserved in PDF
- Loading state during export with error feedback via Toast

## Architecture

### Data Flow

```
User clicks "Export PDF"
       |
Renderer: show ExportDialog, user picks mode
       |
Renderer: build standalone HTML
  - marked parses markdown (reuse MarkdownPreview logic)
  - local images converted to data URLs via imageApi.readAsDataUrl()
  - highlight.js for code blocks
  - inject title/metadata header based on mode
       |
Renderer: IPC send { html, fileName } to main process
       |
Main: create hidden BrowserWindow, load HTML as data URL
       |
Main: webContents.printToPDF() -> PDF Buffer
       |
Main: return Buffer to renderer
       |
Renderer: show system save dialog (reuse dialog.showSaveDialog)
       |
Main: write file via fs.writeFileAbsolute
       |
Toast: success / error notification
```

### New IPC Channels

| Channel | Direction | Payload | Returns |
|---------|-----------|---------|---------|
| `EXPORT_GENERATE_PDF` | renderer -> main | `{ html: string }` | `Buffer` (PDF bytes) |

Existing channels reused: `dialog.showSaveDialog`, `fs.writeFileAbsolute`, `imageApi.readAsDataUrl`.

## UI Changes

### 1. List Item Context Menus (modify existing)

Add "Export to PDF" menu item to both PlanList and NotesPanel context menus:

**PlanList context menu:**
- Start Focus
- View Details
- Export to PDF (new)
- Edit Type and Date
- Delete Plan

**NotesPanel context menu:**
- View Details
- Export to PDF (new)
- Delete Note

Clicking triggers ExportDialog.

### 2. Detail Page Navigation Bar (modify existing)

Restructure PlanEditor and NoteEditor toolbar area into a unified navigation bar:

```
+---------------------------------------------+
| <- Back        Edit  Live  Preview  TOC  ... |
+---------------------------------------------+
```

- Left: back button (existing)
- Right: mode toggle buttons (existing) + TOC button (existing) + "..." more button (new)
- "..." opens a ContextMenu containing "Export to PDF"

### 3. ExportDialog Component (new)

Simple radio-select dialog:

- Title: "Export to PDF"
- Two radio options:
  - "Title + Body" — includes title heading and rendered body
  - "Full Metadata + Body" — title, tags, dates, plan type, then body
- Footer: "Cancel" + "Export" buttons
- Export button shows loading spinner during generation
- Auto-closes on success, shows error Toast on failure

### 4. New Files

| File | Purpose |
|------|---------|
| `src/renderer/src/components/common/ExportDialog.tsx` | Export options dialog |
| `src/renderer/src/lib/export-pdf.ts` | HTML construction + IPC orchestration |

### 5. Modified Files

| File | Change |
|------|--------|
| `src/renderer/src/components/planner/PlanEditor.tsx` | Restructure toolbar into nav bar, add more button |
| `src/renderer/src/components/notes/NoteEditor.tsx` | Restructure toolbar into nav bar, add more button |
| `src/renderer/src/components/planner/PlanList.tsx` | Add "Export to PDF" context menu item |
| `src/renderer/src/components/notes/NotesPanel.tsx` | Add "Export to PDF" context menu item |
| `src/renderer/src/lib/ipc.ts` | Add `export.generatePdf()` method |
| `src/main/ipc-handlers.ts` | Add `EXPORT_GENERATE_PDF` handler |
| `src/preload/index.ts` | Expose new IPC channel |
| `src/shared/types.ts` | Add export-related IPC channel constant |

## PDF Generation

### Main Process Handler

1. Receive `{ html }` from renderer
2. Create hidden BrowserWindow (`show: false`, offscreen dimensions)
3. Load HTML as data URL (`data:text/html;charset=utf-8,...`)
4. Wait for `did-finish-load` event + 500ms delay (ensure images render)
5. Call `webContents.printToPDF({ pageSize: 'A4', printBackground: true, margins })`
6. Return PDF Buffer to renderer
7. Destroy hidden window

### HTML Template

The exported HTML is a fully self-contained document:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* PDF-specific layout styles */
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 0; margin: 0; }
    .markdown-body { /* reuse existing markdown body styles */ }
    /* Code block styles (highlight.js themes) */
    /* Images: max-width: 100%, auto height */
  </style>
</head>
<body>
  <!-- Mode: Title + Body -->
  <h1 class="title">Plan/Note Title</h1>
  <div class="markdown-body">...rendered content...</div>

  <!-- Mode: Full Metadata + Body -->
  <h1 class="title">Plan/Note Title</h1>
  <div class="meta">
    <div>Created: 2025-05-11</div>
    <div>Tags: work, important</div>
    <div>Type: Daily Plan</div>
  </div>
  <hr>
  <div class="markdown-body">...rendered content...</div>
</body>
</html>
```

### Image Handling

- Local images (`./xxx/assets/img.png`): read via `imageApi.readAsDataUrl()` and embedded as `data:image/...;base64,...`
- External URL images: kept as-is (printToPDF will attempt to load; failure shows placeholder)
- All images: `max-width: 100%; height: auto;` to fit within page margins
- Image read failure: skip that image, proceed with export

### Error Handling

- Image read failure: log warning, skip image, continue export
- PDF generation failure: Toast with error message
- User cancels save dialog: silent return, no Toast
- Duplicate click prevention: Export button disabled during generation

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PDF engine | Electron `printToPDF` | Zero dependencies, vector text, Chrome rendering quality (same as Obsidian) |
| Image embedding | Data URLs in HTML | Self-contained PDF, no external references, guaranteed to render offline |
| HTML construction location | Renderer process | Reuses existing marked + hljs + image resolution logic |
| Export dialog style | Simple radio select | Only 2 options, no need for full settings panel; images always included |
| Detail page button placement | Nav bar right side | Unified layout with back button left, actions right |
