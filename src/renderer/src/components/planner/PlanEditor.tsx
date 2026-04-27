import { useEffect, useState } from 'react'
import { usePlanStore } from '@/stores/planStore'
import MarkdownEditor from '@/components/common/MarkdownEditor'
import MarkdownPreview from '@/components/common/MarkdownPreview'
import { ArrowLeft } from 'lucide-react'

interface PlanEditorProps {
  planId: string
}

export default function PlanEditor({ planId }: PlanEditorProps) {
  const plan = usePlanStore((s) => s.plans.find((p) => p.id === planId))
  const loadPlanContent = usePlanStore((s) => s.loadPlanContent)
  const savePlanContent = usePlanStore((s) => s.savePlanContent)
  const setActivePlan = usePlanStore((s) => s.setActivePlan)
  const [content, setContent] = useState('')
  const [editMode, setEditMode] = useState<'edit' | 'preview'>('edit')

  useEffect(() => {
    loadPlanContent(planId).then(setContent)
  }, [planId, loadPlanContent])

  if (!plan) return null

  const handleSave = (newContent: string) => {
    setContent(newContent)
    savePlanContent(planId, newContent)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--separator)' }}>
        {/* Back button */}
        <button
          onClick={() => setActivePlan(null)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-tertiary hover:text-secondary hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Title */}
        <span className="text-subhead font-semibold text-primary truncate flex-1 text-center mx-3" style={{ fontSize: 15 }}>
          {plan.title}
        </span>

        {/* Segmented control for edit/preview */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-tertiary)', flexShrink: 0 }}>
          <button
            onClick={() => setEditMode('edit')}
            className={`px-3 py-1.5 rounded-md text-caption-1 font-medium transition-all ${
              editMode === 'edit' ? 'shadow-sm' : ''
            }`}
            style={{
              fontSize: 12,
              ...(editMode === 'edit'
                ? { background: 'var(--bg-base)', color: 'var(--text-primary)' }
                : { color: 'var(--text-tertiary)' }),
            }}
          >
            编辑
          </button>
          <button
            onClick={() => setEditMode('preview')}
            className={`px-3 py-1.5 rounded-md text-caption-1 font-medium transition-all ${
              editMode === 'preview' ? 'shadow-sm' : ''
            }`}
            style={{
              fontSize: 12,
              ...(editMode === 'preview'
                ? { background: 'var(--bg-base)', color: 'var(--text-primary)' }
                : { color: 'var(--text-tertiary)' }),
            }}
          >
            预览
          </button>
        </div>
      </div>

      {/* Date range */}
      <div className="px-4 pt-3 pb-2 text-caption-2" style={{ fontSize: 11, color: plan.color }}>
        {plan.startDate}{plan.endDate && plan.endDate !== plan.startDate ? ` → ${plan.endDate}` : ''}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 px-4 pb-4">
        {editMode === 'edit' ? (
          <div style={{ fontSize: 15, lineHeight: 1.6 }}>
            <MarkdownEditor value={content} onChange={handleSave} placeholder="# 计划内容\n\n- [ ] 待办项 1\n- [ ] 待办项 2" />
          </div>
        ) : (
          <MarkdownPreview content={content} />
        )}
      </div>
    </div>
  )
}
