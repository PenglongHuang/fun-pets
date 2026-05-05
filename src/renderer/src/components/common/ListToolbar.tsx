import { useState, useRef, useEffect } from 'react'
import { List, LayoutGrid, Grid3X3 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export type ViewMode = 'list' | 'card' | 'compact'

interface SortOption {
  value: string
  label: string
}

interface ListToolbarProps {
  sortOptions: SortOption[]
  currentSort: string
  onSortChange: (value: string) => void
  currentView: ViewMode
  onViewChange: (mode: ViewMode) => void
}

const VIEW_ICONS: Array<{ mode: ViewMode; icon: typeof List; label: string }> = [
  { mode: 'list', icon: List, label: '列表' },
  { mode: 'card', icon: LayoutGrid, label: '大卡片' },
  { mode: 'compact', icon: Grid3X3, label: '紧凑' },
]

export default function ListToolbar({
  sortOptions,
  currentSort,
  onSortChange,
  currentView,
  onViewChange,
}: ListToolbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLabel = sortOptions.find((o) => o.value === currentSort)?.label ?? ''

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const handleSelect = (value: string) => {
    onSortChange(value)
    setDropdownOpen(false)
  }

  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{ padding: '4px 0', gap: 8 }}
    >
      {/* Left: Sort dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          排序: {currentLabel}
          <span
            style={{
              fontSize: 8,
              transition: 'transform 0.15s ease',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            &#9662;
          </span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: 'rgba(44,44,46,0.98)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                padding: '4px 0',
                minWidth: 120,
                zIndex: 10,
              }}
            >
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 12px',
                    background: opt.value === currentSort ? 'rgba(10,132,255,0.15)' : 'transparent',
                    color:
                      opt.value === currentSort ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    border: 'none',
                    fontSize: 11,
                    textAlign: 'left' as const,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: View mode toggle */}
      <div className="flex items-center" style={{ gap: 2 }}>
        {VIEW_ICONS.map(({ mode, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => onViewChange(mode)}
            title={VIEW_ICONS.find((v) => v.mode === mode)!.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px 6px',
              borderRadius: 'var(--radius-sm)',
              background: currentView === mode ? 'var(--accent-blue)' : 'transparent',
              color: currentView === mode ? '#fff' : 'var(--text-quaternary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            <Icon size={12} />
          </button>
        ))}
      </div>
    </div>
  )
}
