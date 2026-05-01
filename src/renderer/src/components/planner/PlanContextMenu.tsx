import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Timer, FileText, Trash2 } from 'lucide-react'

interface PlanContextMenuProps {
  planTitle: string
  onEdit: () => void
  onDelete: () => void
  onStartFocus: () => void
  onClose: () => void
  anchorRect: DOMRect
}

export default function PlanContextMenu({ planTitle, onEdit, onDelete, onStartFocus, onClose, anchorRect }: PlanContextMenuProps) {
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
    background: 'rgba(58,58,60,0.98)',
    border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 4,
    minWidth: 150,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    zIndex: 200,
  }

  const itemStyle = (color?: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px', borderRadius: 6,
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: color ?? 'rgba(255,255,255,0.7)', fontSize: 12,
    width: '100%', textAlign: 'left',
    transition: 'background 0.15s ease',
  })

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={menuStyle}
      >
        <button
          onClick={() => { onStartFocus(); onClose() }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,159,10,0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          style={itemStyle('#FF9F0A')}
        >
          <Timer size={13} /> 开始专注
        </button>
        <button
          onClick={() => { onEdit(); onClose() }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          style={itemStyle()}
        >
          <FileText size={13} /> 查看详情
        </button>
        <div style={{ height: 0.5, background: 'rgba(255,255,255,0.08)', margin: '2px 8px' }} />
        <button
          onClick={() => { onDelete(); onClose() }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,55,95,0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          style={itemStyle('rgba(255,55,95,0.8)')}
        >
          <Trash2 size={13} /> 删除计划
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
