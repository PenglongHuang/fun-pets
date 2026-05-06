import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import TagContextMenu from './TagContextMenu'

interface TagFilterItem {
  name: string
  count: number
}

interface TagFilterBarProps {
  tags: TagFilterItem[]
  activeTag: string | null
  totalItems: number
  onSelect: (tag: string | null) => void
  onRenameTag?: (oldName: string, newName: string) => void
  onDeleteTag?: (tagName: string) => void
}

export default function TagFilterBar({ tags, activeTag, totalItems, onSelect, onRenameTag, onDeleteTag }: TagFilterBarProps) {
  const [contextMenu, setContextMenu] = useState<{ tagName: string; x: number; y: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateScrollState, tags])

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -120 : 120, behavior: 'smooth' })
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const el = scrollRef.current
    if (!el) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      el.scrollLeft += e.deltaY
      updateScrollState()
    }
  }, [updateScrollState])

  const handleContextMenu = (e: React.MouseEvent, tagName: string) => {
    if (!onRenameTag && !onDeleteTag) return
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ tagName, x: e.clientX, y: e.clientY })
  }

  const chipStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: isActive ? 500 : 400,
    background: isActive ? 'rgba(138,180,248,0.15)' : 'rgba(255,255,255,0.04)',
    color: isActive ? '#8ab4f8' : '#888',
    border: isActive ? '0.5px solid rgba(138,180,248,0.25)' : '0.5px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'color 0.2s ease, background 0.2s ease, border-color 0.2s ease',
    flexShrink: 0,
    whiteSpace: 'nowrap' as const,
  })

  const countBadgeStyle = (isActive: boolean): React.CSSProperties => ({
    fontSize: 9,
    opacity: isActive ? 0.7 : 0.5,
  })

  const dotStyle = (isActive: boolean): React.CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: isActive ? '#8ab4f8' : '#888',
    flexShrink: 0,
  })

  const arrowButtonStyle = (visible: boolean): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    color: visible ? '#888' : 'transparent',
    cursor: visible ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'color 0.15s ease',
    padding: 0,
  })

  return (
    <div className="flex items-center" style={{ gap: 4 }}>
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          style={arrowButtonStyle(true)}
        >
          <ChevronLeft size={14} />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        onWheel={handleWheel}
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          flex: 1,
          minWidth: 0,
        }}
      >
        <motion.button
          onClick={() => onSelect(null)}
          whileTap={{ scale: 0.95 }}
          style={chipStyle(activeTag === null)}
        >
          <svg width="8" height="8" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="3" fill={activeTag === null ? '#8ab4f8' : '#888'} />
          </svg>
          全部
          <span style={countBadgeStyle(activeTag === null)}>{totalItems}</span>
        </motion.button>

        {tags.map(({ name, count }) => {
          const isActive = activeTag === name
          return (
            <motion.button
              key={name}
              onClick={() => onSelect(isActive ? null : name)}
              onContextMenu={(e) => handleContextMenu(e, name)}
              whileTap={{ scale: 0.95 }}
              style={chipStyle(isActive)}
            >
              <svg width="8" height="8" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="3" fill={isActive ? '#8ab4f8' : '#888'} />
              </svg>
              <span style={{ maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {name}
              </span>
              <span style={countBadgeStyle(isActive)}>{count}</span>
            </motion.button>
          )
        })}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          style={arrowButtonStyle(true)}
        >
          <ChevronRight size={14} />
        </button>
      )}

      {contextMenu && (
        <TagContextMenu
          tagName={contextMenu.tagName}
          x={contextMenu.x}
          y={contextMenu.y}
          onRename={(oldName, newName) => onRenameTag?.(oldName, newName)}
          onDelete={(tagName) => onDeleteTag?.(tagName)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
