import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { usePlanStore } from '@/stores/planStore'
import { useTimerStore } from '@/stores/timerStore'

const TYPE_BADGE: Record<string, { bg: string; label: string }> = {
  daily: { bg: 'rgba(96,165,250,0.12)', label: '日' },
  weekly: { bg: 'rgba(192,132,252,0.12)', label: '周' },
  monthly: { bg: 'rgba(251,191,36,0.12)', label: '月' },
  neutral: { bg: 'rgba(148,163,184,0.12)', label: '其他' },
}

interface FocusStartDialogProps {
  onCancel: () => void
}

export default function FocusStartDialog({ onCancel }: FocusStartDialogProps) {
  const plans = usePlanStore((s) => s.plans)
  const lastSelectedPlanId = useTimerStore((s) => s.lastSelectedPlanId)
  const startWithPlan = useTimerStore((s) => s.startWithPlan)
  const start = useTimerStore((s) => s.start)
  const sortedPlans = [...plans].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const defaultPlanId = lastSelectedPlanId ?? sortedPlans[0]?.id ?? null
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(defaultPlanId)

  const handleStart = () => {
    if (selectedPlanId) {
      startWithPlan(selectedPlanId)
    } else {
      start()
    }
    onCancel()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 300,
            background: 'rgba(44, 44, 46, 0.98)',
            borderRadius: 'var(--radius-xl)',
            padding: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <span style={{ font: 'var(--text-headline)', color: 'var(--text-primary)', fontWeight: 600 }}>
              开始专注
            </span>
            <button
              onClick={onCancel}
              style={{
                width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)', border: 'none',
                color: 'var(--text-tertiary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 12 }}>
            选择要专注的任务
          </div>

          {/* Plan list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', marginBottom: 14 }}>
            {sortedPlans.map((plan) => {
              const badge = TYPE_BADGE[plan.planType || 'daily']
              const isSelected = selectedPlanId === plan.id
              return (
                <motion.div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(isSelected ? null : plan.id)}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    background: isSelected ? `${plan.color}12` : 'rgba(255,255,255,0.02)',
                    border: isSelected ? `1px solid ${plan.color}40` : '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: plan.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {plan.title}
                    </span>
                  </div>
                  {badge && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 'var(--radius-full)', background: badge.bg, color: plan.color, flexShrink: 0 }}>
                      {badge.label}
                    </span>
                  )}
                  {isSelected && (
                    <span style={{ color: plan.color, fontSize: 12, flexShrink: 0 }}>✓</span>
                  )}
                </motion.div>
              )
            })}
            {sortedPlans.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-quaternary)', fontSize: 12 }}>
                暂无计划
              </div>
            )}
          </div>

          {/* Button */}
          <button
            onClick={handleStart}
            style={{
              width: '100%', textAlign: 'center', padding: '8px 0', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600, background: 'rgba(10,132,255,0.2)',
              color: '#0A84FF', border: 'none', cursor: 'pointer',
            }}
          >
            开始
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
