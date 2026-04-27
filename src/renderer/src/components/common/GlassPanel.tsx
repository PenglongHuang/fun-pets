import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'

interface GlassPanelProps {
  icon: LucideIcon
  title: string
  children: ReactNode
  action?: ReactNode
}

export default function GlassPanel({ icon: Icon, title, children, action }: GlassPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{ padding: '16px 20px' }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(10, 132, 255, 0.15)',
          }}
        >
          <Icon size={16} className="text-accent-blue" />
        </div>
        <span className="text-headline text-primary" style={{ fontWeight: 600 }}>{title}</span>
        {action && <div className="ml-auto">{action}</div>}
      </div>

      {/* Divider */}
      <div style={{ margin: '0 20px', height: 1, background: 'var(--separator)' }} />

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: 20 }}
      >
        {children}
      </div>
    </div>
  )
}
