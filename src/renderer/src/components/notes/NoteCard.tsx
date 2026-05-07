import { useState } from 'react'
import type { Note } from '@/types/note'
import { TagBadge, MoreButton } from '@/components/ui'
import { highlightText } from '@/components/common/SearchBar'
import { motion } from 'motion/react'
import { CheckSquare, Square } from 'lucide-react'

// --- Helpers ---

function formatCreateDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `\u{1F4C5} ${month}月${day}日创建`
}

function formatDateCompact(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// --- Props ---

interface NoteCardProps {
  note: Note
  viewMode: 'card' | 'compact'
  isActive: boolean
  isSelected: boolean
  editMode: boolean
  searchQuery?: string
  onMoreClick: (noteId: string, rect: DOMRect) => void
  onClick: (noteId: string) => void
  onToggleSelect: (noteId: string) => void
}

// --- Component ---

export default function NoteCard({
  note,
  viewMode,
  isActive,
  isSelected,
  editMode,
  searchQuery,
  onMoreClick,
  onClick,
  onToggleSelect,
}: NoteCardProps) {
  const [hovered, setHovered] = useState(false)

  // --- Card mode ---
  if (viewMode === 'card') {
    const showActiveStyle = isActive
    const showHoverStyle = hovered && !editMode && !isActive

    const background = showActiveStyle
      ? 'rgba(255,255,255,0.06)'
      : showHoverStyle
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.03)'

    const borderColor = showActiveStyle
      ? 'rgba(255,255,255,0.10)'
      : showHoverStyle
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(255,255,255,0.06)'

    return (
      <motion.div
        onClick={() => {
          if (editMode) onToggleSelect(note.id)
          else onClick(note.id)
        }}
        whileTap={{ scale: 0.98 }}
        className="group"
        style={{
          background,
          border: isSelected
            ? '0.5px solid rgba(10,132,255,0.20)'
            : `0.5px solid ${borderColor}`,
          borderRadius: 12,
          padding: 12,
          cursor: 'pointer',
          transition: 'background 0.2s ease, border-color 0.2s ease',
          position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 3px gradient vertical indicator on left edge */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: 'linear-gradient(180deg, #64D2FF, #0A84FF)',
            borderRadius: '12px 0 0 12px',
          }}
        />

        {/* Edit mode checkbox */}
        {editMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(note.id) }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: isSelected ? 'var(--accent-blue)' : 'var(--text-quaternary)',
              transition: 'color 0.15s ease',
            }}
          >
            {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
          </button>
        )}

        {/* Title row: title + right arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#e5e5e7',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {searchQuery ? highlightText(note.title, searchQuery) : note.title}
          </span>
          {!editMode && (
            <span style={{ color: '#636366', fontSize: 14, flexShrink: 0 }}>{'›'}</span>
          )}
        </div>

        {/* Meta row: creation date + tags */}
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#636366', marginBottom: 6 }}>
          <span>{formatCreateDate(note.createdAt)}</span>
        </div>

        {/* Tags */}
        {(note.tags ?? []).length > 0 && (
          <div style={{ display: 'flex' as const, gap: 4, flexWrap: 'wrap' as const, alignItems: 'center' }}>
            {(note.tags ?? []).slice(0, 3).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {(note.tags ?? []).length > 3 && (
              <span style={{ fontSize: 10, color: '#636366', lineHeight: '18px' }}>
                +{(note.tags ?? []).length - 3}
              </span>
            )}
          </div>
        )}

        {/* Hover actions (non-edit mode): only MoreButton */}
        {!editMode && (
          <div
            className="flex items-center opacity-0 group-hover:opacity-100"
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              transition: 'opacity 0.15s ease',
            }}
          >
            <MoreButton
              onClick={(e) => {
                e.stopPropagation()
                onMoreClick(note.id, e.currentTarget.getBoundingClientRect())
              }}
            />
          </div>
        )}
      </motion.div>
    )
  }

  // --- Compact mode ---
  const showActiveStyle = isActive
  const showHoverStyle = hovered && !editMode && !isActive && !isSelected

  const background = isSelected
    ? 'rgba(10,132,255,0.06)'
    : showActiveStyle
      ? 'rgba(255,255,255,0.06)'
      : showHoverStyle
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.03)'

  const borderColor = showActiveStyle
    ? 'rgba(255,255,255,0.10)'
    : showHoverStyle
      ? 'rgba(255,255,255,0.1)'
      : 'rgba(255,255,255,0.06)'

  return (
    <motion.div
      onClick={() => {
        if (editMode) onToggleSelect(note.id)
        else onClick(note.id)
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        background,
        border: isSelected
          ? '0.5px solid rgba(10,132,255,0.20)'
          : `0.5px solid ${borderColor}`,
        borderRadius: 12,
        padding: 8,
        textAlign: 'center' as const,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 2.5px top color bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2.5,
          background: 'linear-gradient(90deg, #64D2FF, #0A84FF)',
          borderRadius: '12px 12px 0 0',
        }}
      />

      {/* Edit mode checkbox */}
      {editMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(note.id) }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: isSelected ? 'var(--accent-blue)' : 'var(--text-quaternary)',
            transition: 'color 0.15s ease',
          }}
        >
          {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
        </button>
      )}

      <span style={{
        fontSize: 10,
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: '#e5e5e7',
      }}>
        {searchQuery ? highlightText(note.title, searchQuery) : note.title}
      </span>
      <span style={{ fontSize: 10, color: '#636366', marginTop: 2, display: 'block' }}>
        {formatDateCompact(note.createdAt)}
      </span>
    </motion.div>
  )
}
