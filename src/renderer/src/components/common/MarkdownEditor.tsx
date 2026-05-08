interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onCursorLineChange?: (lineIndex: number | null) => void
  onContextMenu?: (e: React.MouseEvent<HTMLTextAreaElement>) => void
}

export default function MarkdownEditor({ value, onChange, placeholder, onCursorLineChange, onContextMenu }: MarkdownEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()

    const ta = e.currentTarget
    const start = ta.selectionStart

    if (e.shiftKey) {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const leading = value.slice(lineStart, start)
      const spacesToRemove = Math.min(2, leading.length - leading.trimStart().length)
      if (spacesToRemove > 0) {
        ta.selectionStart = lineStart
        ta.selectionEnd = lineStart + spacesToRemove
        document.execCommand('delete', false)
      }
    } else {
      document.execCommand('insertText', false, '  ')
    }
  }

  return (
    <textarea
      className="w-full h-full bg-transparent text-xs text-white/80 font-mono resize-none outline-none placeholder:text-white/20"
      style={{ userSelect: 'text' }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onSelect={() => {
        if (onCursorLineChange) {
          const textarea = document.activeElement as HTMLTextAreaElement
          const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart)
          const lineIndex = textBeforeCursor.split('\n').length - 1
          onCursorLineChange(lineIndex)
        }
      }}
      onContextMenu={(e) => onContextMenu?.(e)}
      placeholder={placeholder}
      spellCheck={false}
    />
  )
}
