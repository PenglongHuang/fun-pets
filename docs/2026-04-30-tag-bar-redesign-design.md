# Tag Bar Redesign — Design Spec

**Date:** 2026-04-30
**Status:** Approved

## Problem

The tag bar across planner and notes panels has information display issues: tags are visually flat with no hierarchy, the single blue color (#0A84FF) provides no visual priority, tags crowd horizontally without management, and planner cards lack tag display while notes cards show them. Additionally, planner cards show raw date strings that are inconsistent with the notes panel.

## Design Decisions

### Approach: Border Chip + Count Badges (Option B)

Selected from three options (compact pills, border chips, minimal underline). Border chips with count badges offer the best information density — each tag shows its item count, helping users quickly assess distribution. The border style is visually lighter than filled pills while still providing clear selected/unselected states.

### Unified Color

Keep a single accent color (#8ab4f8, soft blue) but improve from the current hardcoded #0A84FF. All tags use the same color, differentiated by selected/unselected state rather than per-tag colors.

### Scrolling

Left/right arrow buttons for navigation (visible only when tags overflow), plus mouse wheel horizontal scrolling. No scrollbar.

## Changes by Component

### 1. TagFilterBar (`common/TagFilterBar.tsx`)

**Before:** Horizontal pill bar with single blue color dots, hidden scrollbar, "全部" + tag pills.

**After:**
- Each tag chip: dot icon (SVG circle) + tag name + count badge
- Selected state: blue-tinted background + blue border + blue dot + highlighted count
- Unselected state: transparent background + dark border + muted dot + muted count
- "全部" chip shows total item count
- Left/right arrow buttons appear when content overflows
- Mouse wheel maps to horizontal scroll
- No scrollbar visible
- Right-click context menu (rename/delete) preserved

**Style specs:**
- Unselected: text #888, border 1px solid #333, dot #666, count bg #2a2a3e
- Selected: text #8ab4f8 (w500), border 1px solid rgba(138,180,248,0.25), bg rgba(138,180,248,0.15), dot #8ab4f8, count bg rgba(138,180,248,0.25) text #6a9fd8
- Chip: padding 5px 10px, border-radius 8px, gap 5px
- Count badge: padding 1px 6px, border-radius 6px, font-size 10px
- Arrow buttons: 24x24px, border-radius 6px, border 1px solid #333, bg #252540

**Count logic:** Each chip's count = number of items (plans or notes) with that tag. "全部" count = total items. Cross-store tag operations (rename/delete affecting both stores) preserved.

### 2. Card Tag Display

**Notes cards:** Replace current `getTagColor()` filled pills with border-chip style matching the filter bar. Show dot + tag name, border 1px solid rgba(138,180,248,0.2), text #8ab4f8, font-size 10px, border-radius 6px. Max 3 tags + "+N" overflow preserved.

**Plan cards (PlanList.tsx):** Add tag display matching notes card style. Show up to 3 tags + "+N" overflow. Remove date/time display (the `plan.startDate -> plan.endDate` text). Plan type badge ("日"/"周"/"月") retained.

### 3. TagInput (`common/TagInput.tsx`)

**Before:** Filled background pills with opacity (color + '20'), font-size 10, X button.

**After:**
- Tag chips: dot icon + tag name + × button, border 1px solid rgba(138,180,248,0.3), text #8ab4f8, padding 4px 8px, border-radius 8px, font-size 11px
- Autocomplete dropdown items: dot + tag name, hover highlight, same border style
- Input placeholder: "添加标签..."

### 4. Plan Date Removal

Remove date display from:
- `PlanList.tsx`: Remove the `plan.startDate` and `-> plan.endDate` text from plan cards
- `PlanEditor.tsx`: Remove the date pill section (color dot + startDate -> endDate)

This aligns with NotesPanel behavior where dates are not shown in the detail view.

### 5. tag-utils.ts

Update `getTagColor()` return value from `#0A84FF` to `#8ab4f8` (softer blue that works better with the border-chip style).

## Files to Modify

| File | Change |
|------|--------|
| `common/TagFilterBar.tsx` | Rewrite chip styling, add arrow navigation + wheel scroll, add count badges |
| `common/TagInput.tsx` | Update chip styling to border-chip style with dot icons |
| `lib/tag-utils.ts` | Update accent color to #8ab4f8 |
| `planner/PlanList.tsx` | Add tag chips to plan cards, remove date display |
| `planner/PlanEditor.tsx` | Remove date pill section |
| `notes/NotesPanel.tsx` | Update card tag styling to match new border-chip style |

## Interactions Preserved

- Right-click context menu on filter bar tags (rename / delete)
- Cross-store tag sync (rename/delete propagates to both planStore and noteStore)
- Tag autocomplete in TagInput
- Click-to-filter on TagFilterBar
- planType tab bar in PlannerPanel (unchanged, sits above TagFilterBar)

## Out of Scope

- Per-tag color assignment
- Tag grouping/categorization
- Drag-to-reorder tags
- Tag search/filter within the tag bar
