import { useRef } from 'react'
import { usePetStore } from '@/stores/petStore'
import PetAvatar from './PetAvatar'
import StateIndicator from './StateIndicator'
import { usePetDrag } from '@/hooks/usePetDrag'

export default function PetModeView() {
  const setWindowMode = usePetStore((s) => s.setWindowMode)
  const setPetPosition = usePetStore((s) => s.setPetPosition)
  const petRef = useRef<HTMLDivElement>(null)

  const handleExpand = async () => {
    // Save current position via bounds from main process is done by usePanelMorph
    setWindowMode('expanded')
  }

  const { handleMouseDown } = usePetDrag(petRef, {
    isPetMode: true,
    onClick: handleExpand,
  })

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div ref={petRef} onMouseDown={handleMouseDown}>
        <PetAvatar size={100} />
      </div>
      <div style={{ marginTop: 4 }}>
        <StateIndicator compact />
      </div>
    </div>
  )
}
