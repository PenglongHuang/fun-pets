import { useEffect, useRef, useCallback } from 'react'
import { usePetStore } from '@/stores/petStore'
import { windowApi } from '@/lib/ipc'

const CLICK_THRESHOLD = 5

// SVG circle center and radius in viewBox coords (0 0 256 256)
const SVG_CX_RATIO = 128 / 256
const SVG_CY_RATIO = 120 / 256
const SVG_R_RATIO = 80 / 256
const HIT_PADDING = 8

function isInsidePetCircle(clientX: number, clientY: number, el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width * SVG_CX_RATIO
  const cy = rect.top + rect.height * SVG_CY_RATIO
  const r = rect.width * SVG_R_RATIO + HIT_PADDING
  const dx = clientX - cx
  const dy = clientY - cy
  return dx * dx + dy * dy <= r * r
}

export function usePetDrag(
  petRef: React.RefObject<HTMLElement | null>,
  options: { isPetMode: boolean; onClick?: () => void }
) {
  const { isPetMode, onClick } = options
  const dragging = useRef(false)
  const startScreen = useRef({ x: 0, y: 0 })
  const moved = useRef(false)
  const ignoreState = useRef(true)

  // Initialize: set ignore mouse events on mount
  useEffect(() => {
    if (!isPetMode) return
    windowApi.setIgnoreMouseEvents(true).catch(() => {})
    ignoreState.current = true
  }, [isPetMode])

  // Forward-mode hit testing: toggle ignore based on mouse position
  useEffect(() => {
    if (!isPetMode) return

    const handleMove = (e: MouseEvent) => {
      const el = petRef.current
      if (!el) return

      // When ignoring, events are forwarded — use them for hit-testing
      // When not ignoring, normal mousemove — use for hit-testing too
      const inside = isInsidePetCircle(e.clientX, e.clientY, el)

      if (inside && ignoreState.current) {
        ignoreState.current = false
        windowApi.setIgnoreMouseEvents(false).catch(() => {})
      } else if (!inside && !ignoreState.current && !dragging.current) {
        ignoreState.current = true
        windowApi.setIgnoreMouseEvents(true).catch(() => {})
      }
    }

    window.addEventListener('mousemove', handleMove, true)
    return () => window.removeEventListener('mousemove', handleMove, true)
  }, [isPetMode, petRef])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPetMode) return
    e.preventDefault()
    dragging.current = true
    moved.current = false
    startScreen.current = { x: e.screenX, y: e.screenY }
  }, [isPetMode])

  useEffect(() => {
    if (!isPetMode) return

    const handleGlobalMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.screenX - startScreen.current.x
      const dy = e.screenY - startScreen.current.y
      if (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD) {
        moved.current = true
      }
      if (moved.current) {
        windowApi.moveBy(dx, dy).catch(() => {})
        startScreen.current = { x: e.screenX, y: e.screenY }
      }
    }

    const handleGlobalUp = (_e: MouseEvent) => {
      if (!dragging.current) return
      dragging.current = false
      if (!moved.current) {
        onClick?.()
      }
    }

    window.addEventListener('mousemove', handleGlobalMove)
    window.addEventListener('mouseup', handleGlobalUp)
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove)
      window.removeEventListener('mouseup', handleGlobalUp)
    }
  }, [isPetMode, onClick])

  return { handleMouseDown }
}
