import { useState } from 'react'
import PanelRouter from './PanelRouter'
import IconStrip from './IconStrip'
import PetAvatar from '@/components/pet/PetAvatar'
import StateIndicator from '@/components/pet/StateIndicator'
import { usePetStore } from '@/stores/petStore'
import { motion } from 'motion/react'

export default function Sidebar() {
  const [activePanel, setActivePanel] = useState<'planner' | 'timer' | 'notes' | 'settings'>('planner')
  const setWindowMode = usePetStore((s) => s.setWindowMode)

  return (
    <div className="h-full flex overflow-hidden glass-surface" style={{ borderRadius: 'var(--radius-xl)' }}>
      {/* Left: Panel content */}
      <PanelRouter activePanel={activePanel} />

      {/* Right: 72px icon rail */}
      <div
        className="w-[72px] shrink-0 flex flex-col items-center py-3 glass-surface-lighter"
        style={{ borderTopRightRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}
      >
        {/* Pet */}
        <div className="flex flex-col items-center" style={{ marginBottom: 6 }}>
          <PetAvatar size={52} onClick={() => setWindowMode('pet')} />
          <div style={{ marginTop: 3 }}>
            <StateIndicator />
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: 28, height: 1, background: 'var(--separator)', margin: '6px 0' }} />

        {/* Nav */}
        <IconStrip activePanel={activePanel} onToggle={setActivePanel} />

        {/* Bottom: collapse */}
        <div className="mt-auto pt-2 flex flex-col items-center gap-1">
          <motion.button
            onClick={() => setWindowMode('pet')}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--text-quaternary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)'
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-quaternary)'
            }}
            title="收起 (ESC)"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
