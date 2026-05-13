import { useEffect } from 'react'
import { usePlanStore } from '@/stores/planStore'
import { useNavigationStore } from '@/stores/navigationStore'
import PlanList from './PlanList'
import CalendarView from './CalendarView'
import PlanEditor from './PlanEditor'
import TabBar from '@/components/common/TabBar'

export default function PlannerPanel() {
  const load = usePlanStore((s) => s.load)
  const tabs = usePlanStore((s) => s.tabs)
  const activeTabId = usePlanStore((s) => s.activeTabId)
  const plannerView = usePlanStore((s) => s.plannerView)
  const setPlannerView = usePlanStore((s) => s.setPlannerView)
  const navPush = useNavigationStore((s) => s.push)

  const openTab = usePlanStore((s) => s.openTab)
  const closeTab = usePlanStore((s) => s.closeTab)
  const switchTab = usePlanStore((s) => s.switchTab)
  const pinTab = usePlanStore((s) => s.pinTab)
  const reorderTabs = usePlanStore((s) => s.reorderTabs)
  const closeOtherTabs = usePlanStore((s) => s.closeOtherTabs)
  const closeUnpinnedTabs = usePlanStore((s) => s.closeUnpinnedTabs)

  useEffect(() => { load() }, [load])

  // Calendar view: no tabs, same as before
  if (!activeTabId && plannerView === 'calendar') {
    return <CalendarView onSwitchView={(mode) => {
      usePlanStore.getState().setViewMode(mode)
      navPush({ panel: 'planner', subView: 'list' })
    }} />
  }

  // Tab bar + editor view
  if (tabs.length > 0 && activeTabId) {
    return (
      <div className="flex flex-col h-full">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelect={switchTab}
          onClose={closeTab}
          onPin={pinTab}
          onReorder={reorderTabs}
          onCloseOthers={closeOtherTabs}
          onCloseUnpinned={closeUnpinnedTabs}
        />
        <PlanEditor planId={activeTabId} />
      </div>
    )
  }

  // Empty state: show list
  return <PlanList />
}
