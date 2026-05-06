import { type ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
}

export default function GlassPanel({ children }: GlassPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: 'clamp(18px, 4.5cqw, 32px)' }}
      >
        {children}
      </div>
    </div>
  )
}
