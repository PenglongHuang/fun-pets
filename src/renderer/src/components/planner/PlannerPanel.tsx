import { useEffect } from 'react'
import { usePlanStore } from '@/stores/planStore'
import PlanList from './PlanList'
import CalendarView from './CalendarView'
import PlanEditor from './PlanEditor'

export default function PlannerPanel() {
  const load = usePlanStore((s) => s.load)
  const activePlanId = usePlanStore((s) => s.activePlanId)
  const plannerView = usePlanStore((s) => s.plannerView)
  const setPlannerView = usePlanStore((s) => s.setPlannerView)

  useEffect(() => { load() }, [load])

  if (activePlanId) return <PlanEditor planId={activePlanId} />

  if (plannerView === 'calendar') {
    return <CalendarView onSwitchView={(mode) => {
      usePlanStore.getState().setViewMode(mode)
      setPlannerView('list')
    }} />
  }

  return <PlanList onSwitchToCalendar={() => setPlannerView('calendar')} />
}
