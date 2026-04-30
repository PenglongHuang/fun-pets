import { type ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
}

export default function GlassPanel({ children }: GlassPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: 20 }}
      >
        {children}
      </div>
    </div>
  )
}
