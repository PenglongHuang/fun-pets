import { useEffect, useRef } from 'react'
import { usePetStore } from '@/stores/petStore'

const SLEEPY_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export function usePetAnimation() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (window.location.hash === '#quick-capture') return

    const check = () => {
      const { lastInteraction, setState, state } = usePetStore.getState()
      if (state !== 'singleWink' && state !== 'sleep' && Date.now() - lastInteraction > SLEEPY_TIMEOUT) {
        setState('sleep')
      }
    }
    timerRef.current = setInterval(check, 30000)
    return () => clearInterval(timerRef.current)
  }, [])
}
