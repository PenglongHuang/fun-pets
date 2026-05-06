import { useState } from 'react'
import DynamicIsland from './DynamicIsland'
import TrafficLights from './TrafficLights'
import { usePetStore } from '@/stores/petStore'

export default function TitleBar() {
  const setWindowMode = usePetStore((s) => s.setWindowMode)
  const [petHovered, setPetHovered] = useState(false)

  return (
    <div
      style={{
        height: 36,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        background: 'rgba(28, 28, 30, 1)',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        borderRadius: '16px 16px 0 0',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Pet collapse button — click to return to pet mode */}
      <div style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={() => setWindowMode('pet')}
          onMouseEnter={() => setPetHovered(true)}
          onMouseLeave={() => setPetHovered(false)}
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            cursor: 'pointer',
            border: 'none',
            background: petHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
            opacity: petHovered ? 0.7 : 0.35,
            transition: 'opacity 0.15s ease, background 0.15s ease',
            padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      </div>

      {/* Left drag spacer */}
      <div style={{ flex: 1 }} />

      {/* Center: Dynamic Island */}
      <div style={{ WebkitAppRegion: 'no-drag' }}>
        <DynamicIsland />
      </div>

      {/* Right drag spacer */}
      <div style={{ flex: 1 }} />

      {/* Traffic lights */}
      <div style={{ WebkitAppRegion: 'no-drag' }}>
        <TrafficLights />
      </div>
    </div>
  )
}
