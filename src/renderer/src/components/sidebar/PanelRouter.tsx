import { lazy, Suspense } from 'react'
import GlassPanel from '@/components/common/GlassPanel'
import { ClipboardList, Timer, FileText, Settings, Loader2 } from 'lucide-react'

const PlannerPanel = lazy(() => import('@/components/planner/PlannerPanel'))
const TimerPanel = lazy(() => import('@/components/timer/TimerPanel'))
const NotesPanel = lazy(() => import('@/components/notes/NotesPanel'))
const SettingsPanel = lazy(() => import('@/components/settings/SettingsPanel'))

const panelConfig: Record<string, { title: string; icon: typeof ClipboardList; Component: React.ComponentType }> = {
  planner: { title: '计划', icon: ClipboardList, Component: PlannerPanel },
  timer: { title: '番茄钟', icon: Timer, Component: TimerPanel },
  notes: { title: '笔记', icon: FileText, Component: NotesPanel },
  settings: { title: '设置', icon: Settings, Component: SettingsPanel },
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
        <GlassPanel title={config.title} icon={config.icon}>
          <config.Component />
        </GlassPanel>
      </Suspense>
    </div>
  )
}
