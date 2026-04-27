import { useState } from 'react'
import { X } from 'lucide-react'
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
        style={{ height: '100%', borderTopRightRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}
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
        <div className="mt-auto flex flex-col items-center">
          <div style={{ width: 28, height: 1, background: 'var(--separator)', marginBottom: 8 }} />
          <motion.button
            onClick={() => setWindowMode('pet')}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--accent-pink)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,55,95,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            title="关闭 (ESC)"
          >
            <X size={16} strokeWidth={1.8} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
