import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  danger?: boolean
  textColor?: string
  hoverColor?: string
  onClick: () => void
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  anchorRect: DOMRect
  onClose: () => void
}

const menuContainerStyle: React.CSSProperties = {
  background: 'rgba(58,58,60,0.98)',
  border: '0.5px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: 4,
  minWidth: 150,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  zIndex: 200,
}

function itemStyle(color?: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 6,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: color ?? 'rgba(255,255,255,0.7)',
    fontSize: 12,
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background 0.15s ease',
  }
}

export default function ContextMenu({ items, anchorRect, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: anchorRect.bottom + 4,
    right: window.innerWidth - anchorRect.right,
  }

  let hadDanger = false

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        style={{ ...menuStyle, ...menuContainerStyle }}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        {items.map((item, i) => {
          const showSeparator = item.danger && !hadDanger
          if (item.danger) hadDanger = true

          return (
            <div key={i}>
              {showSeparator && <div style={{ height: 0.5, background: 'rgba(255,255,255,0.08)', margin: '2px 8px' }} />}
              <button
                onClick={() => { item.onClick(); onClose() }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.danger
                    ? 'rgba(255,55,95,0.1)'
                    : item.hoverColor ?? 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                style={itemStyle(item.danger ? 'rgba(255,55,95,0.8)' : item.textColor)}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          )
        })}
      </motion.div>
    </AnimatePresence>
  )
}
