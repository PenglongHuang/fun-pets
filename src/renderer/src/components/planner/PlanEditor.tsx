import { useEffect, useState } from 'react'
import { usePlanStore } from '@/stores/planStore'
import MarkdownEditor from '@/components/common/MarkdownEditor'
import MarkdownPreview from '@/components/common/MarkdownPreview'
import { ArrowLeft, Pencil, Eye } from 'lucide-react'
import { motion } from 'motion/react'

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
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => setActivePlan(null)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)', border: 'none',
            color: 'var(--text-tertiary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
        >
          <ArrowLeft size={15} />
        </motion.button>

        <span className="truncate flex-1" style={{ font: 'var(--text-headline)', color: 'var(--text-primary)', fontWeight: 600 }}>
          {plan.title}
        </span>

        {/* Edit / Preview toggle */}
        <div
          className="flex gap-0.5"
          style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            padding: 2,
          }}
        >
          {([['edit', Pencil], ['preview', Eye]] as const).map(([mode, Icon]) => (
            <motion.button
              key={mode}
              onClick={() => setEditMode(mode)}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 28, height: 24, borderRadius: 5,
                background: editMode === mode ? 'var(--accent-blue)' : 'transparent',
                color: editMode === mode ? '#fff' : 'var(--text-quaternary)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
            >
              <Icon size={12} />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Date pill */}
      <span
        style={{
          font: 'var(--text-caption-2)',
          color: 'var(--text-quaternary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: plan.color }} />
        {plan.startDate}{plan.endDate && plan.endDate !== plan.startDate ? ` → ${plan.endDate}` : ''}
      </span>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {editMode === 'edit' ? (
          <MarkdownEditor value={content} onChange={handleSave} placeholder="# 计划内容\n\n- [ ] 待办项 1\n- [ ] 待办项 2" />
        ) : (
          <MarkdownPreview content={content} />
        )}
      </div>
    </div>
  )
}
