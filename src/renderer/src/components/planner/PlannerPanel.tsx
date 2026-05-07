import { useEffect, useState } from 'react'
import { usePlanStore } from '@/stores/planStore'
import PlanList from './PlanList'
import CalendarView from './CalendarView'
import PlanEditor from './PlanEditor'

export default function PlannerPanel() {
  const load = usePlanStore((s) => s.load)
  const activePlanId = usePlanStore((s) => s.activePlanId)
  const [view, setView] = useState<'list' | 'calendar'>('list')

  useEffect(() => { load() }, [load])

  if (activePlanId) return <PlanEditor planId={activePlanId} />

  if (view === 'calendar') {
    return <CalendarView onBackToList={() => setView('list')} />
  }

  return <PlanList onSwitchToCalendar={() => setView('calendar')} />
}
