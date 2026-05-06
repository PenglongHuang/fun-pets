import { useState } from 'react'
import { windowApi } from '@/lib/ipc'
import { usePetStore } from '@/stores/petStore'

const BUTTONS = [
  { color: '#ff5f57', label: 'close', action: 'close' },
  { color: '#febc2e', label: 'minimize', action: 'minimize' },
  { color: '#28c840', label: 'maximize', action: 'maximize' },
] as const

export default function TrafficLights() {
  const [hovered, setHovered] = useState<string | null>(null)
  const setWindowMode = usePetStore((s) => s.setWindowMode)

  const handleClick = (action: string) => {
    if (action === 'close') {
      windowApi.hide()
    } else if (action === 'minimize') {
      setWindowMode('pet')
    } else if (action === 'maximize') {
      windowApi.maximize()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        WebkitAppRegion: 'no-drag',
        padding: '0 2px',
      }}
      onMouseEnter={() => setHovered('group')}
      onMouseLeave={() => setHovered(null)}
    >
      {BUTTONS.map((btn) => (
        <button
          key={btn.action}
          onClick={() => handleClick(btn.action)}
          onMouseEnter={() => setHovered(btn.action)}
          onMouseLeave={() => setHovered('group')}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: btn.color,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'box-shadow 0.15s ease',
            boxShadow:
              hovered === btn.action
                ? `0 0 0 1.5px ${btn.color}66`
                : 'none',
          }}
        >
          {hovered === 'group' || hovered === btn.action
            ? renderIcon(btn.action, btn.color)
            : null}
        </button>
      ))}
    </div>
  )
}

function renderIcon(action: string, _color: string) {
  const stroke = 'rgba(0,0,0,0.35)'
  switch (action) {
    case 'close':
      return (
        <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
          <line x1="1" y1="1" x2="7" y2="7" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="7" y1="1" x2="1" y2="7" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'minimize':
      return (
        <svg width="7" height="2" viewBox="0 0 8 2" fill="none">
          <line x1="0" y1="1" x2="8" y2="1" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'maximize':
      return (
        <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
          <path d="M1 3 L5 1 L9 3 L9 7 L5 9 L1 7Z" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" fill="none" />
        </svg>
      )
    default:
      return null
  }
}
