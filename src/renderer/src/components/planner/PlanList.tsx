import { usePlanStore } from '@/stores/planStore'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'motion/react'

export default function PlanList() {
  const plans = usePlanStore((s) => s.plans)
  const createPlan = usePlanStore((s) => s.createPlan)
  const deletePlan = usePlanStore((s) => s.deletePlan)
  const setActivePlan = usePlanStore((s) => s.setActivePlan)
  const activePlanId = usePlanStore((s) => s.activePlanId)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const today = new Date().toISOString().split('T')[0]
    await createPlan(newTitle.trim(), today, null)
    setNewTitle('')
    setShowNew(false)
  }

  return (
    <div className="flex flex-col gap-1">
      {plans.map((plan) => (
        <motion.div
          key={plan.id}
          onClick={() => setActivePlan(plan.id)}
          whileTap={{ scale: 0.98 }}
          className="group cursor-pointer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: activePlanId === plan.id ? 'var(--bg-secondary)' : 'transparent',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (activePlanId !== plan.id) e.currentTarget.style.background = 'var(--bg-tertiary)'
          }}
          onMouseLeave={(e) => {
            if (activePlanId !== plan.id) e.currentTarget.style.background = 'transparent'
          }}
        >
          {/* Color dot */}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: plan.color, flexShrink: 0 }} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div style={{ font: 'var(--text-subhead)', color: 'var(--text-primary)', fontWeight: 500 }} className="truncate">
              {plan.title}
            </div>
            <div style={{ font: 'var(--text-caption-2)', color: 'var(--text-quaternary)', marginTop: 2 }}>
              {plan.startDate}
              {plan.endDate && plan.endDate !== plan.startDate ? ` → ${plan.endDate}` : ''}
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); deletePlan(plan.id) }}
            style={{
              opacity: 0,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-quaternary)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              transition: 'opacity 0.15s ease, color 0.15s ease',
            }}
            className="group-hover:opacity-100"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-pink)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-quaternary)' }}
          >
            <Trash2 size={14} />
          </button>
        </motion.div>
      ))}

      {/* New plan */}
      {showNew ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
          }}
        >
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="计划标题"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              font: 'var(--text-body)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              font: 'var(--text-caption-1)',
              fontWeight: 600,
              color: 'var(--accent-blue)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            确定
          </button>
          <button
            onClick={() => setShowNew(false)}
            style={{
              font: 'var(--text-caption-1)',
              color: 'var(--text-quaternary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            取消
          </button>
        </div>
      ) : (
        <motion.button
          onClick={() => setShowNew(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 0',
            font: 'var(--text-caption-1)',
            fontWeight: 500,
            color: 'var(--text-quaternary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
            transition: 'color 0.2s ease, background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-blue)'
            e.currentTarget.style.background = 'rgba(10,132,255,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-quaternary)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Plus size={14} /> 新建计划
        </motion.button>
      )}
    </div>
  )
}
