import { getTagColor } from '@/lib/tag-utils'

interface TagBadgeProps {
  tag: string
  variant?: 'border' | 'solid'
}

export function TagBadge({ tag, variant = 'border' }: TagBadgeProps) {
  if (variant === 'solid') {
    const color = getTagColor()
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '1px 5px',
          borderRadius: 9999,
          background: `${color}20`,
          color,
          lineHeight: '16px',
        }}
      >
        {tag}
      </span>
    )
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      fontSize: 10,
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 6,
      color: '#8ab4f8',
      border: '1px solid rgba(138,180,248,0.2)',
    }}>
      <svg width="8" height="8" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="3" fill="#8ab4f8" />
      </svg>
      {tag}
    </span>
  )
}
