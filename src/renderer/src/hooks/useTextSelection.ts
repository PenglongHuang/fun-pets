import { useRef, useState, useCallback, useEffect } from 'react'

export interface TextSelectionState {
  selectedText: string
  selection: { start: number; end: number }
  hasSelection: boolean
  currentLine: string
  lineIndex: number
}

export default function useTextSelection(
  textareaEl: HTMLTextAreaElement | null
): TextSelectionState {
  const [state, setState] = useState<TextSelectionState>({
    selectedText: '',
    selection: { start: 0, end: 0 },
    hasSelection: false,
    currentLine: '',
    lineIndex: 0,
  })

  const rafRef = useRef<number>(0)

  const updateSelection = useCallback(() => {
    const ta = textareaEl
    if (!ta) return

    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selectedText = ta.value.substring(start, end)

    const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1
    const lineEnd = ta.value.indexOf('\n', start)
    const currentLine = ta.value.substring(lineStart, lineEnd === -1 ? undefined : lineEnd)
    const lineIndex = ta.value.substring(0, lineStart).split('\n').length - 1

    setState({
      selectedText,
      selection: { start, end },
      hasSelection: start !== end,
      currentLine,
      lineIndex,
    })
  }, [textareaEl])

  useEffect(() => {
    const ta = textareaEl
    if (!ta) return

    const events = ['select', 'keyup', 'mouseup', 'focus', 'contextmenu'] as const
    const handler = (eventName: string) => {
      cancelAnimationFrame(rafRef.current)
      if (eventName === 'contextmenu') {
        updateSelection()
      } else {
        rafRef.current = requestAnimationFrame(updateSelection)
      }
    }

    events.forEach((e) => ta.addEventListener(e, (ev: Event) => handler(ev.type)))
    updateSelection()

    return () => {
      cancelAnimationFrame(rafRef.current)
      events.forEach((e) => ta.removeEventListener(e, (ev: Event) => handler(ev.type)))
    }
  }, [textareaEl, updateSelection])

  return state
}
