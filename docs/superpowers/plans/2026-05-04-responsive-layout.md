# 响应式布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the expanded panel mode window resizable with content that adapts fluidly via CSS container queries and grid auto-fill.

**Architecture:** Main process enables resizable + anchors window to right edge on resize events. Renderer sets up a CSS container query context on the panel router, then each panel uses grid auto-fill and clamp() for responsive typography/spacing. Window size is persisted to electron-store on collapse.

**Tech Stack:** Electron BrowserWindow API, CSS container queries (cqw), CSS Grid auto-fill, CSS clamp()

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `src/shared/store-schema.ts` | Add `window.expandedSize` schema field | Modify |
| `src/main/window.ts` | Resizable toggle, resize anchoring, size persistence | Modify |
| `src/main/ipc-handlers.ts` | Wire size persistence through existing expand/collapse IPC handlers | Modify |
| `src/renderer/src/components/sidebar/PanelRouter.tsx` | Container query context | Modify |
| `src/renderer/src/components/common/GlassPanel.tsx` | Responsive padding | Modify |
| `src/renderer/src/styles/global.css` | Responsive CSS variables | Modify |
| `src/renderer/src/components/planner/PlannerPanel.tsx` | View switcher responsive font | Modify |
| `src/renderer/src/components/planner/PlanList.tsx` | Plan cards grid auto-fill | Modify |
| `src/renderer/src/components/timer/TimerPanel.tsx` | Timer centering | Modify |
| `src/renderer/src/components/notes/NotesPanel.tsx` | Note list adaptive width | Verify only |
| `src/renderer/src/components/settings/SettingsPanel.tsx` | Max-width centering | Modify |

Note: No new IPC channels needed. Size persistence uses existing `store.get`/`store.set` within the existing expand/collapse handlers. `ipc-channels.ts`, `preload/index.ts`, and `renderer/lib/ipc.ts` are not modified.

---

### Task 1: Store schema — add `window.expandedSize`

**Files:**
- Modify: `src/shared/store-schema.ts`

- [ ] **Step 1: Add `window` field to StoreSchema and defaults**

Add a `window` top-level key with `expandedSize` to the schema:

```typescript
// In StoreSchema interface, add:
window: {
  expandedSize: { width: number; height: number }
}

// In storeDefaults, add:
window: {
  expandedSize: { width: 480, height: 680 },
},
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd b:/AI-projects/fun-pets && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to store-schema

- [ ] **Step 3: Commit**

```bash
git add src/shared/store-schema.ts
git commit -m "feat(responsive): add window.expandedSize to store schema"
```

---

### Task 2: Main process — resizable toggle + resize anchoring + size persistence

**Files:**
- Modify: `src/main/window.ts`

- [ ] **Step 1: Add resize anchoring logic**

At the top of `window.ts`, add a variable to track whether we're in expanded mode and a function to handle resize anchoring:

```typescript
let isExpandedMode = false

function handleResizeAnchor(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const bounds = mainWindow.getBounds()
  const display = getTargetDisplay()
  const { workAreaSize } = display
  // Anchor right edge to screen right edge
  const targetX = display.bounds.x + workAreaSize.width - bounds.width
  // Vertically center
  const targetY = display.bounds.y + Math.floor((workAreaSize.height - bounds.height) / 2)
  // setPosition only fires 'resize' if size actually changes, so no infinite loop risk
  mainWindow.setPosition(targetX, targetY)
}
```

- [ ] **Step 2: Modify `expandToPanelMode` — enable resizable, restore saved size**

Replace the function body. Key changes:
- Read `window.expandedSize` from store via a parameter (passed from IPC handler)
- Call `mainWindow.setResizable(true)` and `mainWindow.setMinimumSize(480, 500)`
- Set `isExpandedMode = true`
- Register resize listener

New signature: `expandToPanelMode(petX?: number, petY?: number, savedExpandedSize?: { width: number; height: number })`

```typescript
export function expandToPanelMode(
  petX?: number,
  petY?: number,
  savedExpandedSize?: { width: number; height: number }
): { x: number; y: number } {
  if (!mainWindow) return { x: 0, y: 0 }
  const original = mainWindow.getBounds()
  const display = getTargetDisplay()
  const { workAreaSize } = display

  const size = savedExpandedSize ?? { width: EXPANDED_WIDTH, height: EXPANDED_HEIGHT }

  let targetX = display.bounds.x + workAreaSize.width - size.width
  let targetY = display.bounds.y + Math.floor((workAreaSize.height - size.height) / 2)
  targetX = Math.max(display.bounds.x, targetX)
  targetY = Math.max(display.bounds.y, targetY)

  mainWindow.setResizable(true)
  mainWindow.setMinimumSize(480, 500)
  mainWindow.setBounds({ x: targetX, y: targetY, width: size.width, height: size.height })
  isExpandedMode = true
  mainWindow.on('resize', handleResizeAnchor)

  return { x: original.x, y: original.y }
}
```

- [ ] **Step 3: Modify `collapseToPetMode` — save size, disable resizable**

Add size saving before collapsing. Accept an optional `expandedSize` return callback or just let the IPC handler handle it:

```typescript
export function collapseToPetMode(petX?: number, petY?: number): { width: number; height: number } | null {
  if (!mainWindow) return null

  // Save expanded size before collapsing
  let savedSize: { width: number; height: number } | null = null
  if (isExpandedMode) {
    const bounds = mainWindow.getBounds()
    savedSize = { width: bounds.width, height: bounds.height }
  }

  mainWindow.removeListener('resize', handleResizeAnchor)
  mainWindow.setResizable(false)
  mainWindow.setMinimumSize(0, 0)
  isExpandedMode = false

  let targetX = petX
  let targetY = petY
  if (targetX === undefined || targetY === undefined) {
    const display = getTargetDisplay()
    const { workAreaSize } = display
    targetX = display.bounds.x + workAreaSize.width - PET_WIDTH - 20
    targetY = display.bounds.y + Math.floor((workAreaSize.height - PET_HEIGHT) / 2)
  }

  mainWindow.setBounds({ x: targetX!, y: targetY!, width: PET_WIDTH, height: PET_HEIGHT })
  return savedSize
}
```

Note: The return type changed from `void` to `{ width: number; height: number } | null`. The IPC handler will persist this to the store.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd b:/AI-projects/fun-pets && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Errors in `ipc-handlers.ts` because `collapseToPetMode` signature changed — this will be fixed in Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/main/window.ts
git commit -m "feat(responsive): resizable toggle, resize anchoring, save size on collapse"
```

---

### Task 3: IPC handler + preload — wire up size persistence

**Files:**
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/src/lib/ipc.ts`

- [ ] **Step 1: Update IPC handler in `ipc-handlers.ts`**

Modify the `WINDOW_EXPAND_PANEL` handler to read saved size from store and pass it:

```typescript
ipcMain.handle(IPC.WINDOW_EXPAND_PANEL, (_e, petX?: number, petY?: number) => {
  const savedSize = store.get('window.expandedSize') as { width: number; height: number } | undefined
  return expandToPanelMode(petX, petY, savedSize)
})
```

Modify the `WINDOW_COLLAPSE_PET` handler to save the returned size:

```typescript
ipcMain.handle(IPC.WINDOW_COLLAPSE_PET, (_e, petX?: number, petY?: number) => {
  const savedSize = collapseToPetMode(petX, petY)
  if (savedSize) {
    store.set('window.expandedSize', savedSize)
  }
})
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd b:/AI-projects/fun-pets && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Clean compile (no new errors)

- [ ] **Step 3: Commit**

```bash
git add src/main/ipc-handlers.ts
git commit -m "feat(responsive): wire expanded size persistence through IPC"
```

---

### Task 4: Renderer — container query context on PanelRouter

**Files:**
- Modify: `src/renderer/src/components/sidebar/PanelRouter.tsx`

- [ ] **Step 1: Add container-type to PanelRouter outer div**

The outer `<div>` currently has `className="flex-1 overflow-hidden"` and `style={{ minWidth: 280 }}`. Add `containerType: 'inline-size'` to the style object:

```typescript
style={{ minWidth: 280, containerType: 'inline-size' }}
```

Also add the CSS class `container-type-inline-size` as a fallback (some Tailwind setups need it). The final div:

```tsx
<div className="flex-1 overflow-hidden" style={{ minWidth: 280, containerType: 'inline-size' }}>
```

- [ ] **Step 2: Verify the app starts**

Run: `cd b:/AI-projects/fun-pets && npm run dev`
Check that the app starts in pet mode, expand to panel mode works, and panels render normally. No visual changes expected yet.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/sidebar/PanelRouter.tsx
git commit -m "feat(responsive): add container query context to PanelRouter"
```

---

### Task 5: GlassPanel — responsive padding

**Files:**
- Modify: `src/renderer/src/components/common/GlassPanel.tsx`

- [ ] **Step 1: Replace fixed padding with clamp()**

Current:
```tsx
<div className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
```

Change to:
```tsx
<div className="flex-1 overflow-y-auto" style={{ padding: 'clamp(16px, 4cqw, 32px)' }}>
```

At current content width (~407px), `4cqw` ≈ 16.3px, clamped to 16px — very close to current 20px but slightly tighter. To maintain current feel, use `clamp(18px, 4.5cqw, 32px)` which gives ≈18.3px at 407px (close to 20px) and scales up to 32px.

- [ ] **Step 2: Verify visually**

Run dev server, expand panel mode, check that panel padding looks normal. Then drag window wider — padding should increase subtly.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/common/GlassPanel.tsx
git commit -m "feat(responsive): responsive padding in GlassPanel via clamp()"
```

---

### Task 6: Global CSS — responsive typography variables

**Files:**
- Modify: `src/renderer/src/styles/global.css`

- [ ] **Step 1: Add responsive font size CSS variables**

In `:root`, after the existing typography variables, add responsive variants:

```css
/* --- Responsive Typography (container query units) --- */
--text-title-2-responsive: 600 clamp(22px, 4.5cqw, 32px) / 1.35 var(--font-family);
--text-caption-1-responsive: 400 clamp(12px, 2.5cqw, 15px) / 1.35 var(--font-family);
```

These are used by panels that want responsive fonts. Panels opt-in by using these variables instead of the fixed ones.

- [ ] **Step 2: Verify no visual regression**

Run dev server — the new CSS variables exist but aren't used yet, so no changes visible.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/styles/global.css
git commit -m "feat(responsive): add responsive typography CSS variables"
```

---

### Task 7: PlannerPanel — view switcher responsive font + PlanList grid

**Files:**
- Modify: `src/renderer/src/components/planner/PlannerPanel.tsx`
- Modify: `src/renderer/src/components/planner/PlanList.tsx`

- [ ] **Step 1: In PlannerPanel.tsx, make view switcher text responsive**

The view switcher buttons currently use `fontSize: 12`. Change to use the responsive variable:

```tsx
fontSize: 'clamp(12px, 2.5cqw, 15px)',
```

This applies to both `LayoutList`/`CalendarDays` buttons.

- [ ] **Step 2: In PlanList.tsx, change plan cards container to grid**

The plan cards list is at the section with `{filteredPlans.map((plan) => {`. Its parent `<div className="flex-1 min-h-0 overflow-y-auto flex flex-col" style={{ gap: 4 }}>` needs to become a grid:

Change from:
```tsx
<div className="flex-1 min-h-0 overflow-y-auto flex flex-col" style={{ gap: 4 }}>
```

To:
```tsx
<div className="flex-1 min-h-0 overflow-y-auto" style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 4,
  alignContent: 'start',
}}>
```

`alignContent: 'start'` ensures grid items pack to top rather than stretching vertically.

- [ ] **Step 3: Verify visually**

Run dev server, open planner panel. Plan cards should stack vertically as before at 480px (single column fits since 200px min < 407px content width). Drag wider — at ~620px content width, cards should start wrapping to 2 columns.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/planner/PlannerPanel.tsx src/renderer/src/components/planner/PlanList.tsx
git commit -m "feat(responsive): planner view switcher responsive font + plan cards grid"
```

---

### Task 8: TimerPanel — centering + responsive stat grid

**Files:**
- Modify: `src/renderer/src/components/timer/TimerPanel.tsx`

- [ ] **Step 1: Ensure timer area is centered with even whitespace**

Find the timer display area (`<div className="flex flex-col items-center gap-4">`). The `items-center` class already centers horizontally. Verify the parent structure allows the timer to stay centered as width increases.

If the timer area has a fixed-width parent, ensure it uses `flex-1` or similar to expand. The existing `items-center` should handle centering — just verify no max-width constraints exist.

- [ ] **Step 2: Make stat cards grid responsive**

Find the stat cards grid (currently `gridTemplateColumns: '1fr 1fr'`). Change to:

```tsx
gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
```

This allows stat cards to wrap to more columns when window is wide.

- [ ] **Step 3: Verify visually**

Run dev server, open timer panel. Timer should be centered. At 480px, stats show 2 columns. Wider window → stats may show 3-4 columns.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/timer/TimerPanel.tsx
git commit -m "feat(responsive): timer centering + responsive stat cards grid"
```

---

### Task 9: NotesPanel — adaptive width

**Files:**
- Modify: `src/renderer/src/components/notes/NotesPanel.tsx`

Notes keep their list form (not grid cards) per the spec. The note items naturally fill width via flexbox. Changes are minimal.

- [ ] **Step 1: Verify note list items auto-expand with container width**

The note cards use `display: 'flex'` with `flex-1 min-w-0` on the text area. These should naturally expand as the container widens. No code changes needed if this already works — verify by running the dev server and dragging the window wider.

If any note items have hardcoded widths, replace them with relative values.

- [ ] **Step 2: Make the tag bar wrap nicely at wider widths**

The tag bar in notes uses flexbox. Verify tags wrap naturally when there are many tags. If `flex-wrap: wrap` is missing, add it.

- [ ] **Step 3: Commit (if changes were needed)**

```bash
git add src/renderer/src/components/notes/NotesPanel.tsx
git commit -m "feat(responsive): ensure note list items adapt to container width"
```

If no changes were needed, skip this commit and note it in the plan.

---

### Task 10: SettingsPanel — max-width centering

**Files:**
- Modify: `src/renderer/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1: Add max-width constraint to settings content**

The settings panel root is `<div className="flex flex-col" style={{ position: 'relative' }}>`. Wrap the inner content (all settings groups) in a container with max-width and auto margins:

The simplest approach: add `maxWidth` and `margin` to the root div:

```tsx
<div className="flex flex-col" style={{ position: 'relative', maxWidth: 520, margin: '0 auto', width: '100%' }}>
```

This keeps settings compact even when the window is very wide, centered within the content area.

- [ ] **Step 2: Verify visually**

Run dev server, open settings panel. At 480px width, settings fill normally. Drag wider — settings content stays at max 520px, centered with even margins on both sides.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/settings/SettingsPanel.tsx
git commit -m "feat(responsive): settings panel max-width centering"
```

---

### Task 11: Full integration test — manual verification

- [ ] **Step 1: Start the app in dev mode**

Run: `cd b:/AI-projects/fun-pets && npm run dev`

- [ ] **Step 2: Test expand/collapse cycle**

1. Start in pet mode
2. Click pet to expand — window should appear at default 480×680
3. Verify window edges can be dragged to resize
4. Drag left edge wider → right edge stays at screen right, content adapts
5. Drag top/bottom edges → window stays vertically centered
6. Collapse back to pet → expand again → window should restore to last size

- [ ] **Step 3: Test each panel at various widths**

Test each panel (Planner, Timer, Notes, Settings) at:
- 480px (minimum width)
- ~700px (medium)
- ~1000px (wide)

For each: verify no clipping, no overflow, no broken layouts, text remains readable.

- [ ] **Step 4: Fix any issues found**

If any layout breaks at specific sizes, adjust the grid minmax values or clamp ranges for the affected panel.

- [ ] **Step 5: Final commit if fixes were needed**

```bash
git add -u
git commit -m "fix(responsive): address layout issues from integration test"
```
