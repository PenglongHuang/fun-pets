import { lazy, Suspense } from 'react'
import GlassPanel from '@/components/common/GlassPanel'
import { Loader2 } from 'lucide-react'

const PlannerPanel = lazy(() => import('@/components/planner/PlannerPanel'))
const TimerPanel = lazy(() => import('@/components/timer/TimerPanel'))
const NotesPanel = lazy(() => import('@/components/notes/NotesPanel'))
const SettingsPanel = lazy(() => import('@/components/settings/SettingsPanel'))

const panelConfig: Record<string, { Component: React.ComponentType }> = {
  planner: { Component: PlannerPanel },
  timer: { Component: TimerPanel },
  notes: { Component: NotesPanel },
  settings: { Component: SettingsPanel },
}

interface PanelRouterProps {
  activePanel: string | null
}

export default function PanelRouter({ activePanel }: PanelRouterProps) {
  if (!activePanel) return null

  const config = panelConfig[activePanel]
  if (!config) return null

  return (
    <div className="flex-1 min-w-0 overflow-hidden">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 size={16} className="text-white/30 animate-spin" />
        </div>
      }>
        <GlassPanel>
          <config.Component />
        </GlassPanel>
      </Suspense>
    </div>
  )
}
