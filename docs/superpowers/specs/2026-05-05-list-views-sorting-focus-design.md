# List Views, Sorting & Focus Redesign

Date: 2026-05-05

## Overview

Three changes to improve the plan/notes list experience and focus workflow:
1. Redesign plan list card content (replace day/week/month badges with date + focus stats)
2. Add "no plan" option to focus start dialog
3. Add sorting and view switching to both plan and note lists

## Design Decisions

- **Unified component architecture**: Plans and notes share the same toolbar, view switching, and sorting infrastructure. Data differences are handled via config/props.
- **Three view modes**: List, Large Card, Compact Small Card — consistent across plans and notes.
- **Focus "no plan" option** lives in the plan selection dialog triggered when starting focus, not in the TimerPanel itself.

## A. Plan List Card Redesign

### Remove
- Day/week/month type badge (`日`/`周`/`月`)

### Add
- Plan date range (start date - end date)
- Cumulative focus time for the plan

### Card content per view

| Element | List View | Large Card | Compact Small Card |
|---------|-----------|------------|---------------------|
| Icon (colored by plan) | ✓ | ✓ | ✓ |
| Title | ✓ | ✓ | ✓ |
| Date range | `5/1 - 5/5` | `🗓 5月1日 - 5月5日` | `5/1 - 5/5` |
| Focus time | `⏱ 2h 30m` | `⏱ 2小时30分` | — |
| Tags (up to 3 + overflow) | ✓ | ✓ | — |
| Top color bar | — | ✓ (left border) | ✓ |

### Focus time calculation
- Aggregate all `TimerHistoryEntry` records where `planId` matches the plan.
- Display as: `Xh Xm` (hours + minutes), `Xm` (minutes only), or `0m` (no focus yet, dimmed color).

### Date range display
- Same start and end: show single date (`5/6`)
- Different: show range (`5/1 - 5/31`)
- Short format in list/compact views, full format in large card view.

## B. Focus "No Plan" Option

### Trigger
When the user starts a focus session (from TimerPanel or from plan card play button), a plan selection dialog appears.

### Dialog content
1. **"自由专注" option** at the top — highlighted with dashed border, distinct from plan items.
   - Icon: 🎯
   - Label: "自由专注"
   - Subtitle: "不关联任何计划"
2. **Plan list** below — each plan shows title, date range, and focus stats.
3. **Cancel** button at bottom.

### After selection
- If "自由专注" selected: TimerPanel shows gray ring + "🎯 自由专注" label.
- If a plan selected: existing behavior (colored ring + plan name label).
- Focus session is recorded without `planId` when "自由专注" is selected.

### Default behavior
- When starting from a plan card's play button: pre-select that plan in the dialog (or skip dialog and start directly, depending on current behavior).
- When starting from TimerPanel without a pending plan: show the dialog with "自由专注" as default selection.

## C. Sorting & View Switching

### Toolbar
Fixed at top of list content area, below the panel header.

```
[排序: 时间 ▾]                    [☰] [◻] [▪]
```

- Left: Sort dropdown selector
- Right: View mode toggle (3 icon buttons, active one highlighted)

### Sort options

**Plans:**
- 时间排序 (by updatedAt, default)
- 名称排序 (by title, alphabetical)
- 计划日期排序 (by startDate)

**Notes:**
- 时间排序 (by updatedAt, default)
- 名称排序 (by title, alphabetical)

Sort preference persisted per panel (plan/note) so users don't have to re-select.

### View modes

**Plans:**

| Element | List | Large Card | Compact |
|---------|------|------------|---------|
| Icon | ✓ | ✓ | ✓ |
| Title | ✓ | ✓ | ✓ |
| Date range | short | full | short |
| Focus time | short | full | — |
| Tags | ✓ | ✓ | — |
| Color indicator | — | left border | top border |

**Notes:**

| Element | List | Large Card | Compact |
|---------|------|------------|---------|
| Icon (colored by note) | ✓ | ✓ | ✓ |
| Title | ✓ | ✓ | ✓ |
| Content snippet | truncated | 2 lines | — |
| Update time | relative (`2天前`) | full (`2天前更新`) | — |
| Creation time | — | — | `5/3 创建` |
| Tags | ✓ | ✓ | — |
| Color indicator | — | left border | top border |

### Content snippet for notes
- Extract first non-empty text line from the markdown file.
- List view: single line, truncated with ellipsis, max ~100px.
- Large card view: 2 lines with `-webkit-line-clamp: 2`.
- Compact view: not shown (only title + creation time).

### View preference
Persisted per panel so users don't have to re-select after switching panels.

## Architecture

### New/Modified Components

1. **`ListToolbar`** — shared toolbar component with sort dropdown + view toggle.
   - Props: `sortOptions`, `currentSort`, `onSortChange`, `currentView`, `onViewChange`
   - Used by both PlanList and NotesPanel.

2. **`PlanCard`** refactored to support 3 view variants.
   - `variant: 'list' | 'card' | 'compact'`
   - Computes focus time from timer history on render.

3. **`NoteCard`** refactored to support 3 view variants.
   - `variant: 'list' | 'card' | 'compact'`
   - Reads first line of markdown for content snippet.

4. **`PlanSelectionDialog`** — new dialog for focus start.
   - Shows "自由专注" + all plans with date/focus info.
   - Returns selected planId or `null` for free focus.

5. **Sort/view state** added to `planStore` and `noteStore`.
   - `sortBy: string`, `viewMode: 'list' | 'card' | 'compact'`
   - Persisted to local storage.

### Data Flow
- Focus time: `timerStore.history` filtered by `planId`, aggregated in component.
- Content snippet: read from markdown file content, cached in note store or computed on demand.
- Sort/view prefs: stored in respective stores, persisted via existing persistence mechanism.
