# 苹果风格标题栏 + 灵动岛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a macOS-style title bar with a Dynamic Island panel indicator and traffic light window controls to the expanded panel mode.

**Architecture:** Three new components (TitleBar, DynamicIsland, TrafficLights) inserted at the top of Sidebar. TitleBar sets `-webkit-app-region: drag` for window dragging; Dynamic Island and TrafficLights are `no-drag` zones. Two new IPC channels (minimize, maximize) added to the existing IPC pipeline. IconStrip loses its pet avatar and close button.

**Tech Stack:** React inline styles, Zustand stores (petStore, timerStore), Electron BrowserWindow API, Lucide React icons, CSS animations

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `src/shared/ipc-channels.ts` | Add `WINDOW_MINIMIZE`, `WINDOW_MAXIMIZE` channels | Modify |
| `src/main/ipc-handlers.ts` | Register minimize/maximize IPC handlers | Modify |
| `src/preload/index.ts` | Expose `windowMinimize`, `windowMaximize` | Modify |
| `src/renderer/src/lib/ipc.ts` | Add `windowApi.minimize()`, `windowApi.maximize()` | Modify |
| `src/renderer/src/components/sidebar/TrafficLights.tsx` | Red/yellow/green buttons with hover SVG icons | Create |
| `src/renderer/src/components/sidebar/DynamicIsland.tsx` | Panel indicator + timer state + hover expand | Create |
| `src/renderer/src/components/sidebar/TitleBar.tsx` | Title bar container with drag region | Create |
| `src/renderer/src/components/sidebar/Sidebar.tsx` | Root layout to flex-col, insert TitleBar, simplify IconStrip area | Modify |
| `src/renderer/src/components/sidebar/IconStrip.tsx` | No changes (Sidebar removes pet/close, not IconStrip) | Verify only |
| `src/renderer/src/styles/global.css` | Add pulse keyframe animation | Modify |

---

### Task 1: IPC — add minimize and maximize channels

**Files:**
- Modify: `src/shared/ipc-channels.ts`
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/src/lib/ipc.ts`

- [ ] **Step 1: Add IPC channels**

In `src/shared/ipc-channels.ts`, add two new entries to the `IPC` object after `WINDOW_COLLAPSE_PET`:

```typescript
WINDOW_MINIMIZE: 'window:minimize',
WINDOW_MAXIMIZE: 'window:maximize',
```

- [ ] **Step 2: Register IPC handlers**

In `src/main/ipc-handlers.ts`, add after the `WINDOW_COLLAPSE_PET` handler:

```typescript
ipcMain.handle(IPC.WINDOW_MINIMIZE, () => {
  getMainWindow()?.minimize()
})

ipcMain.handle(IPC.WINDOW_MAXIMIZE, () => {
  const win = getMainWindow()
  if (!win) return
  if (win.isMaximized()) {
    win.unmaximize()
  } else {
    win.maximize()
  }
})
```

- [ ] **Step 3: Expose in preload**

In `src/preload/index.ts`, add after `windowCollapsePet`:

```typescript
windowMinimize: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
windowMaximize: () => ipcRenderer.invoke(IPC.WINDOW_MAXIMIZE),
```

- [ ] **Step 4: Add renderer IPC wrappers**

In `src/renderer/src/lib/ipc.ts`, add to `windowApi` object after `collapsePet`:

```typescript
minimize: (): Promise<void> =>
  window.api.windowMinimize(),
maximize: (): Promise<void> =>
  window.api.windowMaximize(),
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd b:/AI-projects/fun-pets && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/shared/ipc-channels.ts src/main/ipc-handlers.ts src/preload/index.ts src/renderer/src/lib/ipc.ts
git commit -m "feat(titlebar): add minimize and maximize IPC channels"
```

---

### Task 2: TrafficLights component

**Files:**
- Create: `src/renderer/src/components/sidebar/TrafficLights.tsx`

- [ ] **Step 1: Create TrafficLights component**

Create `src/renderer/src/components/sidebar/TrafficLights.tsx`:

```tsx
import { usePetStore } from '@/stores/petStore'
import { windowApi } from '@/lib/ipc'

const BUTTONS = [
  { color: '#ff5f57', label: 'close', action: 'close' },
  { color: '#febc2e', label: 'minimize', action: 'minimize' },
  { color: '#28c840', label: 'maximize', action: 'maximize' },
] as const

export default function TrafficLights() {
  const setWindowMode = usePetStore((s) => s.setWindowMode)
  const [hovered, setHovered] = useState<string | null>(null)

  const handleClick = (action: string) => {
    if (action === 'close') {
      setWindowMode('pet')
    } else if (action === 'minimize') {
      windowApi.minimize()
    } else if (action === 'maximize') {
      windowApi.maximize()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        WebkitAppRegion: 'no-drag',
        padding: '0 2px',
      }}
      onMouseEnter={() => setHovered('group')}
      onMouseLeave={() => setHovered(null)}
    >
      {BUTTONS.map((btn) => (
        <button
          key={btn.action}
          onClick={() => handleClick(btn.action)}
          onMouseEnter={() => setHovered(btn.action)}
          onMouseLeave={() => setHovered('group')}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: btn.color,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'box-shadow 0.15s ease',
            boxShadow:
              hovered === btn.action
                ? `0 0 0 1.5px ${btn.color}66`
                : 'none',
          }}
        >
          {hovered === 'group' || hovered === btn.action
            ? renderIcon(btn.action, btn.color)
            : null}
        </button>
      ))}
    </div>
  )
}

function renderIcon(action: string, _color: string) {
  const stroke = 'rgba(0,0,0,0.35)'
  switch (action) {
    case 'close':
      return (
        <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
          <line x1="1" y1="1" x2="7" y2="7" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="7" y1="1" x2="1" y2="7" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'minimize':
      return (
        <svg width="7" height="2" viewBox="0 0 8 2" fill="none">
          <line x1="0" y1="1" x2="8" y2="1" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'maximize':
      return (
        <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
          <path d="M1 3 L5 1 L9 3 L9 7 L5 9 L1 7Z" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" fill="none" />
        </svg>
      )
    default:
      return null
  }
}
```

Note: Add `import { useState } from 'react'` at top.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd b:/AI-projects/fun-pets && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/sidebar/TrafficLights.tsx
git commit -m "feat(titlebar): add TrafficLights component with hover SVG icons"
```

---

### Task 3: DynamicIsland component

**Files:**
- Create: `src/renderer/src/components/sidebar/DynamicIsland.tsx`
- Modify: `src/renderer/src/styles/global.css`

- [ ] **Step 1: Add pulse animation to global CSS**

In `src/renderer/src/styles/global.css`, add at the end:

```css
@keyframes island-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

- [ ] **Step 2: Create DynamicIsland component**

Create `src/renderer/src/components/sidebar/DynamicIsland.tsx`:

```tsx
import { useState, useEffect, useRef } from 'react'
import { CalendarDays, Timer, FileText, Settings, type LucideIcon } from 'lucide-react'
import { usePetStore } from '@/stores/petStore'
import { useTimerStore } from '@/stores/timerStore'

const PANELS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'planner', label: '计划', icon: CalendarDays },
  { id: 'timer', label: '专注', icon: Timer },
  { id: 'notes', label: '笔记', icon: FileText },
  { id: 'settings', label: '设置', icon: Settings },
]

export default function DynamicIsland() {
  const activePanel = usePetStore((s) => s.activePanel)
  const setActivePanel = usePetStore((s) => s.setActivePanel)
  const timerStatus = useTimerStore((s) => s.status)
  const remainingMs = useTimerStore((s) => s.remainingMs)
  const timerPause = useTimerStore((s) => s.pause)
  const timerResume = useTimerStore((s) => s.resume)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Update clock
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      )
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])

  const isTimerActive = timerStatus === 'running' || timerStatus === 'paused'

  const handleMouseEnter = () => {
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current)
    setIsExpanded(true)
  }

  const handleMouseLeave = () => {
    expandTimeoutRef.current = setTimeout(() => setIsExpanded(false), 150)
  }

  const handlePanelClick = (panelId: string) => {
    setActivePanel(panelId as any)
    // Keep expanded briefly so user sees the switch
    expandTimeoutRef.current = setTimeout(() => setIsExpanded(false), 300)
  }

  const handleToggleTimer = () => {
    if (activePanel !== 'timer') {
      setActivePanel('timer')
    }
    if (timerStatus === 'running') {
      timerPause()
    } else if (timerStatus === 'paused') {
      timerResume()
    }
  }

  const formatTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Timer active state
  if (isTimerActive) {
    const isRunning = timerStatus === 'running'
    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          WebkitAppRegion: 'no-drag',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 18,
          padding: '4px 10px 4px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 26,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isRunning ? '#ff453a' : '#ff9f0a',
            boxShadow: isRunning ? '0 0 8px rgba(255,69,58,0.5)' : 'none',
            animation: isRunning ? 'island-pulse 1.5s ease-in-out infinite' : 'none',
            opacity: isRunning ? 1 : 0.7,
            flexShrink: 0,
          }}
        />
        {/* Countdown */}
        <span
          style={{
            color: isRunning ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
            fontSize: 13,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 0.5,
          }}
        >
          {formatTime(remainingMs)}
        </span>
        {/* Divider */}
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        {/* Current time */}
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
          {currentTime}
        </span>
        {/* Pause/play button */}
        <button
          onClick={handleToggleTimer}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: 0,
          }}
        >
          {isRunning ? (
            <svg width="8" height="8" viewBox="0 0 12 12" fill="rgba(255,255,255,0.6)">
              <rect x="2" y="1" width="2.5" height="10" rx="0.8" />
              <rect x="7.5" y="1" width="2.5" height="10" rx="0.8" />
            </svg>
          ) : (
            <svg width="8" height="8" viewBox="0 0 12 12" fill="rgba(255,255,255,0.6)">
              <path d="M3 1.5 L10 6 L3 10.5Z" />
            </svg>
          )}
        </button>
      </div>
    )
  }

  // Expanded state — show all panel tabs
  if (isExpanded) {
    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          WebkitAppRegion: 'no-drag',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 18,
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          height: 26,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {PANELS.map((panel) => {
          const isActive = activePanel === panel.id
          const Icon = panel.icon
          return (
            <button
              key={panel.id}
              onClick={() => handlePanelClick(panel.id)}
              style={{
                borderRadius: 14,
                padding: '2px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                border: 'none',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'background 0.15s ease',
                height: 18,
              }}
            >
              <Icon
                size={12}
                strokeWidth={isActive ? 2.2 : 1.7}
                style={{ color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                {panel.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  // Default compact state — current panel + 4 dots
  const currentPanel = PANELS.find((p) => p.id === activePanel) ?? PANELS[0]
  const CurrentIcon = currentPanel.icon
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        WebkitAppRegion: 'no-drag',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: 18,
        padding: '4px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 26,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
      }}
    >
      <CurrentIcon size={13} strokeWidth={1.7} style={{ color: 'rgba(255,255,255,0.65)' }} />
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600 }}>
        {currentPanel.label}
      </span>
      <div style={{ display: 'flex', gap: 3 }}>
        {PANELS.map((panel) => (
          <div
            key={panel.id}
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: activePanel === panel.id ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd b:/AI-projects/fun-pets && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/sidebar/DynamicIsland.tsx src/renderer/src/styles/global.css
git commit -m "feat(titlebar): add DynamicIsland with panel indicator and timer state"
```

---

### Task 4: TitleBar container component

**Files:**
- Create: `src/renderer/src/components/sidebar/TitleBar.tsx`

- [ ] **Step 1: Create TitleBar component**

Create `src/renderer/src/components/sidebar/TitleBar.tsx`:

```tsx
import DynamicIsland from './DynamicIsland'
import TrafficLights from './TrafficLights'

export default function TitleBar() {
  return (
    <div
      style={{
        height: 36,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        background: 'rgba(28, 28, 30, 1)',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        WebkitAppRegion: 'drag',
        // Top corners match window border-radius
        borderRadius: '16px 16px 0 0',
      }}
    >
      {/* Left drag spacer */}
      <div style={{ flex: 1 }} />

      {/* Center: Dynamic Island (no-drag internally) */}
      <DynamicIsland />

      {/* Right drag spacer */}
      <div style={{ flex: 1 }} />

      {/* Traffic lights (no-drag internally) */}
      <TrafficLights />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd b:/AI-projects/fun-pets && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/sidebar/TitleBar.tsx
git commit -m "feat(titlebar): add TitleBar container with drag region"
```

---

### Task 5: Integrate TitleBar into Sidebar + simplify IconStrip area

**Files:**
- Modify: `src/renderer/src/components/sidebar/Sidebar.tsx`

- [ ] **Step 1: Refactor Sidebar layout**

Replace the entire content of `src/renderer/src/components/sidebar/Sidebar.tsx`:

```tsx
import PanelRouter from './PanelRouter'
import IconStrip from './IconStrip'
import TitleBar from './TitleBar'
import { usePetStore } from '@/stores/petStore'
import GlobalToast from '@/components/common/GlobalToast'

export default function Sidebar() {
  const activePanel = usePetStore((s) => s.activePanel)
  const setActivePanel = usePetStore((s) => s.setActivePanel)

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        background: 'rgba(28, 28, 30, 1)',
        border: '0.5px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 0.5px 0 rgba(255,255,255,0.06)',
        minWidth: 360,
      }}
    >
      {/* Title bar */}
      <TitleBar />

      {/* Content area: PanelRouter + IconStrip */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Panel content */}
        <PanelRouter activePanel={activePanel} />

        {/* Divider */}
        <div style={{ width: 1, background: 'var(--separator)', flexShrink: 0 }} />

        {/* Right: icon rail (no pet avatar, no close button) */}
        <div
          className="w-[72px] shrink-0 flex flex-col items-center py-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          {/* Nav only */}
          <IconStrip activePanel={activePanel} onToggle={setActivePanel} />
        </div>
      </div>

      <GlobalToast />
    </div>
  )
}
```

Key changes:
- Root div: `h-full flex` → `flex flex-col overflow-hidden` (column layout)
- Removed `PetAvatar` import and usage
- Removed close button (motion.button with X icon)
- Removed `setWindowMode` from store (TitleBar's TrafficLights handles collapse)
- Wrapped PanelRouter + Divider + IconStrip in a `flex flex-1 min-h-0` row container
- Removed `import { X } from 'lucide-react'` and `import { motion } from 'motion/react'`

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd b:/AI-projects/fun-pets && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Verify build passes**

Run: `cd b:/AI-projects/fun-pets && npx electron-vite build 2>&1 | tail -10`
Expected: Build successful

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/sidebar/Sidebar.tsx
git commit -m "feat(titlebar): integrate TitleBar into Sidebar, remove pet avatar and close button"
```

---

### Task 6: Build verification + manual smoke test

- [ ] **Step 1: Start dev server**

Run: `cd b:/AI-projects/fun-pets && npm run dev`

- [ ] **Step 2: Verify title bar appears in expanded mode**

1. Start in pet mode → click pet to expand
2. Verify 36px title bar appears at top with Dynamic Island (center) and traffic lights (right)
3. Verify title bar background matches Sidebar — no visual gap
4. Verify window can be dragged by clicking and dragging the title bar area (left/right of island)

- [ ] **Step 3: Verify Dynamic Island interactions**

1. Default: shows "计划" with 4 dots, first dot highlighted
2. Hover: expands to show all 4 panel tabs, current one highlighted
3. Click a different tab → panel switches, IconStrip syncs
4. Mouse leave → collapses back to compact view

- [ ] **Step 4: Verify traffic lights**

1. Hover group → all 3 buttons show SVG icons (×, −, hexagon)
2. Hover single button → box-shadow glow
3. Click red → collapses to pet mode
4. Click yellow → window minimizes
5. Click green → window maximizes; click again → unmaximizes

- [ ] **Step 5: Verify timer state**

1. Switch to Timer panel, start a focus session
2. Dynamic Island changes to: red pulsing dot + countdown + current time + pause button
3. Click pause → dot turns yellow, button changes to play icon
4. Click play → resumes, dot turns red again
5. Switch to a different panel (e.g. Notes) while timer running → island still shows countdown
6. When timer completes → island returns to panel indicator mode

- [ ] **Step 6: Verify pet mode unchanged**

1. Collapse to pet mode → no title bar, no traffic lights
2. Pet mode looks exactly as before

- [ ] **Step 7: Fix any issues and commit if needed**

```bash
git add -u
git commit -m "fix(titlebar): address issues from smoke test"
```
