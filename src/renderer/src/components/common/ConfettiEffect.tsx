import { useEffect } from 'react'
import { fireConfetti } from '@/lib/confetti'

interface ConfettiEffectProps {
  trigger: boolean
  onDone?: () => void
}

export default function ConfettiEffect({ trigger, onDone }: ConfettiEffectProps) {
  useEffect(() => {
    if (trigger) {
      fireConfetti()
      setTimeout(() => onDone?.(), 1000)
    }
  }, [trigger, onDone])

  return null
}
