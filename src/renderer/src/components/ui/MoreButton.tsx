import { MoreVertical } from 'lucide-react'

interface MoreButtonProps {
  onClick: (e: React.MouseEvent) => void
}

export function MoreButton({ onClick }: MoreButtonProps) {
  return (
    <button
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100"
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--text-quaternary)',
        cursor: 'pointer',
        padding: 4,
        borderRadius: 8,
        transition: 'color 0.15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-quaternary)' }}
    >
      <MoreVertical size={14} />
    </button>
  )
}
