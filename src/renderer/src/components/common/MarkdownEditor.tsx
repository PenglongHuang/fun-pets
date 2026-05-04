interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()

    const ta = e.currentTarget
    const start = ta.selectionStart
    const end = ta.selectionEnd

    if (e.shiftKey) {
      // Shift+Tab: remove up to 2 leading spaces from current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const leading = value.slice(lineStart, start)
      const spacesToRemove = Math.min(2, leading.length - leading.trimStart().length)
      if (spacesToRemove > 0) {
        onChange(value.slice(0, lineStart) + value.slice(lineStart + spacesToRemove))
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start - spacesToRemove })
      }
    } else {
      // Tab: insert 2 spaces at cursor
      onChange(value.slice(0, start) + '  ' + value.slice(end))
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2 })
    }
  }

  return (
    <textarea
      className="w-full h-full bg-transparent text-xs text-white/80 font-mono resize-none outline-none placeholder:text-white/20"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      spellCheck={false}
    />
  )
}
