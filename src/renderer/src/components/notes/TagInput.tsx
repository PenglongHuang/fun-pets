import { useState } from 'react'
import { X, Tag } from 'lucide-react'
import { getTagColor } from '@/lib/tag-utils'

interface TagInputProps {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
}

const MAX_TAG_LENGTH = 20

export default function TagInput({ tags, onAdd, onRemove }: TagInputProps) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const value = input.trim().slice(0, MAX_TAG_LENGTH)
    if (!value || tags.includes(value)) return
    onAdd(value)
    setInput('')
  }

  return (
    <div
      className="flex flex-wrap shrink-0"
      style={{
        alignItems: 'center',
        gap: 4,
        padding: '6px 0',
        borderBottom: '0.5px solid var(--separator)',
      }}
    >
      <Tag size={12} style={{ color: 'var(--text-quaternary)', flexShrink: 0 }} />
      {tags.map((tag) => {
        const color = getTagColor()
        return (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 4px 2px 7px',
              borderRadius: 'var(--radius-full)',
              fontSize: 10,
              fontWeight: 500,
              background: `${color}22`,
              color,
              maxWidth: 80,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{tag}</span>
            <button
              onClick={() => onRemove(tag)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: `${color}88`,
                display: 'flex',
                lineHeight: 1,
              }}
            >
              <X size={10} />
            </button>
          </span>
        )
      })}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="添加标签..."
        style={{
          fontSize: 11,
          color: 'var(--text-primary)',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          minWidth: 60,
          maxWidth: 120,
          flex: '1 1 60px',
        }}
      />
    </div>
  )
}
