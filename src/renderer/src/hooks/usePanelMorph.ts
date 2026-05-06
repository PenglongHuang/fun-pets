import { useEffect, useRef } from 'react'
import { usePetStore } from '@/stores/petStore'
import { windowApi } from '@/lib/ipc'

export function usePanelMorph() {
  const windowMode = usePetStore((s) => s.windowMode)
  const mounted = useRef(false)

  useEffect(() => {
    // Quick capture window must never manage main window mode
    if (window.location.hash === '#quick-capture') return

    // Skip initial mount — main process already set up the window correctly
    if (!mounted.current) {
      mounted.current = true
      return
    }

    if (windowMode === 'expanded') {
      // expandToPanelMode returns the pre-expansion position atomically,
      // so there's no race between saving position and moving the window.
      windowApi.expandPanel().then((savedPos) => {
        usePetStore.getState().setPetPosition(savedPos)
      }).catch(() => {})
      windowApi.setIgnoreMouseEvents(false).catch(() => {})
    } else if (windowMode === 'pet') {
      // Restore to saved pet position
      const pos = usePetStore.getState().petPosition
      windowApi.collapsePet(pos?.x, pos?.y).catch(() => {})
      windowApi.setIgnoreMouseEvents(true).catch(() => {})
      windowApi.invalidate().catch(() => {})
    }
  }, [windowMode])

  return { windowMode }
}
