import { useState, useRef, useEffect } from 'react'
import { ArrowDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface SortOption {
  value: string
  label: string
  icon: React.ReactNode
}

interface SortDropdownProps {
  sortOptions: SortOption[]
  currentSort: string
  onSortChange: (value: string) => void
}

export default function SortDropdown({
  sortOptions,
  currentSort,
  onSortChange,
}: SortDropdownProps) {
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
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '3px 7px',
          borderRadius: 5,
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          color: 'var(--text-tertiary)',
          fontSize: 10,
          cursor: 'pointer',
        }}
      >
        <ArrowDown size={11} style={{ opacity: 0.6 }} />
        <span>{currentLabel}</span>
        <span style={{ fontSize: 7, opacity: 0.6 }}>
          {dropdownOpen ? '▴' : '▾'}
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
              right: 0,
              marginTop: 4,
              background: 'rgba(44,44,46,0.98)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              padding: '4px 0',
              minWidth: 120,
              zIndex: 20,
            }}
          >
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  padding: '5px 10px',
                  fontSize: 11,
                  background:
                    opt.value === currentSort ? 'rgba(10,132,255,0.15)' : 'transparent',
                  color:
                    opt.value === currentSort
                      ? 'var(--accent-blue)'
                      : 'var(--text-secondary)',
                  border: 'none',
                  textAlign: 'left' as const,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
