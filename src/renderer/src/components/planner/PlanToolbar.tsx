import { useState, useMemo, useCallback } from 'react'
import Dropdown from '@/components/common/Dropdown'
import { getTagsWithCounts } from '@/lib/tag-utils'
import type { Plan } from '@/types/plan'
import type { PlanTypeFilterValue } from '@/components/common/PlanTypeFilter'

interface PlanToolbarProps {
  plans: Plan[]
  planTypeFilter: PlanTypeFilterValue
  onPlanTypeFilterChange: (value: PlanTypeFilterValue) => void
  activeFilterTag: string | null
  onActiveFilterTagChange: (tag: string | null) => void
  sortBy: 'time' | 'name' | 'planDate'
  onSortByChange: (sort: 'time' | 'name' | 'planDate') => void
  viewMode: 'card' | 'compact' | 'calendar'
  onViewModeChange: (mode: 'card' | 'compact' | 'calendar') => void
  editMode: boolean
}

const TYPE_CHIPS: Array<{ value: PlanTypeFilterValue; label: string; color: string }> = [
  { value: 'all', label: '全部', color: '#64D2FF' },
  { value: 'daily', label: '每日', color: '#60a5fa' },
  { value: 'weekly', label: '每周', color: '#c084fc' },
  { value: 'monthly', label: '每月', color: '#fbbf24' },
]

const SORT_OPTIONS: Array<{ value: 'time' | 'name' | 'planDate'; label: string }> = [
  { value: 'time', label: '时间' },
  { value: 'name', label: '名称' },
  { value: 'planDate', label: '计划日期' },
]

const VIEW_MODES: Array<{ value: 'card' | 'compact' | 'calendar'; icon: string }> = [
  { value: 'card', icon: '☰' },
  { value: 'compact', icon: '⊞' },
  { value: 'calendar', icon: '📅' },
]

export default function PlanToolbar({
  plans,
  planTypeFilter,
  onPlanTypeFilterChange,
  activeFilterTag,
  onActiveFilterTagChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  editMode,
}: PlanToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)

  const tagItems = useMemo(() => getTagsWithCounts(plans), [plans])

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? '时间'

  const handleSortSelect = useCallback(
    (value: 'time' | 'name' | 'planDate') => {
      onSortByChange(value)
      setSortOpen(false)
    },
    [onSortByChange],
  )

  const handleTagSelect = useCallback(
    (tag: string) => {
      onActiveFilterTagChange(tag)
      setTagOpen(false)
    },
    [onActiveFilterTagChange],
  )

  const handleClearTag = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onActiveFilterTagChange(null)
    },
    [onActiveFilterTagChange],
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 28,
        gap: 8,
      }}
    >
      {/* Type chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {TYPE_CHIPS.map((chip) => {
          const isActive = planTypeFilter === chip.value
          return (
            <button
              key={chip.value}
              onClick={() => onPlanTypeFilterChange(chip.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 9,
                padding: '3px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                border: '0.5px solid',
                borderColor: isActive
                  ? 'rgba(10,132,255,0.3)'
                  : 'rgba(255,255,255,0.06)',
                background: isActive
                  ? 'rgba(10,132,255,0.15)'
                  : 'transparent',
                color: isActive ? '#64D2FF' : '#8e8e93',
                outline: 'none',
                transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: chip.color,
                  flexShrink: 0,
                }}
              />
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sort, tag, view toggle — hidden in edit mode */}
      {!editMode && (
        <>
          {/* Sort dropdown */}
          <Dropdown
            trigger={
              <button
                onClick={() => setSortOpen((prev) => !prev)}
                style={{
                  fontSize: 9,
                  color: '#8e8e93',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  outline: 'none',
                }}
              >
                ↓ {currentSortLabel} ▾
              </button>
            }
            open={sortOpen}
            onClose={() => setSortOpen(false)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSortSelect(opt.value)}
                  style={{
                    fontSize: 11,
                    color: sortBy === opt.value ? '#64D2FF' : '#ccc',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 6,
                    textAlign: 'left',
                    outline: 'none',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none'
                  }}
                >
                  {sortBy === opt.value ? '✓ ' : ''}
                  {opt.label}
                </button>
              ))}
            </div>
          </Dropdown>

          {/* Tag dropdown */}
          <Dropdown
            trigger={
              activeFilterTag !== null ? (
                <button
                  onClick={() => setTagOpen((prev) => !prev)}
                  style={{
                    fontSize: 9,
                    color: '#64D2FF',
                    background: 'rgba(10,132,255,0.12)',
                    border: '0.5px solid rgba(10,132,255,0.2)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    padding: '3px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    outline: 'none',
                  }}
                >
                  🏷 {activeFilterTag}
                  <span
                    onClick={handleClearTag}
                    style={{
                      cursor: 'pointer',
                      opacity: 0.7,
                      fontSize: 10,
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setTagOpen((prev) => !prev)}
                  style={{
                    fontSize: 9,
                    color: '#8e8e93',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '3px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    outline: 'none',
                  }}
                >
                  🏷 标签 ▾
                </button>
              )
            }
            open={tagOpen}
            onClose={() => setTagOpen(false)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {tagItems.length === 0 && (
                <span style={{ fontSize: 10, color: '#636366', padding: '4px 8px' }}>
                  暂无标签
                </span>
              )}
              {tagItems.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => handleTagSelect(tag.name)}
                  style={{
                    fontSize: 11,
                    color: activeFilterTag === tag.name ? '#64D2FF' : '#ccc',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 6,
                    textAlign: 'left',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none'
                  }}
                >
                  <span>{tag.name}</span>
                  <span style={{ fontSize: 9, color: '#636366', marginLeft: 8 }}>
                    {tag.count}
                  </span>
                </button>
              ))}
            </div>
          </Dropdown>

          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              padding: 2,
            }}
          >
            {VIEW_MODES.map((mode) => {
              const isActive = viewMode === mode.value
              return (
                <button
                  key={mode.value}
                  onClick={() => onViewModeChange(mode.value)}
                  style={{
                    padding: '3px 6px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive
                      ? 'rgba(10,132,255,0.2)'
                      : 'transparent',
                    color: isActive ? '#64D2FF' : '#636366',
                    fontSize: 11,
                    outline: 'none',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                >
                  {mode.icon}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
