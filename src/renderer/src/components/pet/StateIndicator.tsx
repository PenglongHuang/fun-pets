import { usePetStore } from '@/stores/petStore'
import type { PetState } from '@/types/pet'

const stateLabels: Record<PetState, string> = {
  smile: '微笑',
  singleWink: '眨眼~',
  doubleWink: '开心',
  sleep: '睡觉',
}

interface StateIndicatorProps {
  compact?: boolean
}

export default function StateIndicator({ compact }: StateIndicatorProps) {
  const state = usePetStore((s) => s.state)
  return (
    <span className={`${compact ? 'text-caption-2' : 'text-[9px]'} text-white/30 mt-1 block text-center`}>
      {stateLabels[state]}
    </span>
  )
}
