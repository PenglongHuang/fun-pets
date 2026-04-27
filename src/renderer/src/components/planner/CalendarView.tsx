import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePlanStore } from '@/stores/planStore'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function CalendarView() {
  const plans = usePlanStore((s) => s.plans)
  const getPlansForDate = usePlanStore((s) => s.getPlansForDate)
  const setActivePlan = usePlanStore((s) => s.setActivePlan)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const datePlans = useMemo(() => {
    if (!selectedDate) return []
    return getPlansForDate(selectedDate)
  }, [selectedDate, plans, getPlansForDate])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const cells: Array<{ day: number | null; dateStr: string }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr })
  }

  return (
    <div className="flex flex-col">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-tertiary hover:text-secondary hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold" style={{ fontSize: 17, color: 'var(--text-primary)' }}>
          {year}年{month + 1}月
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-tertiary hover:text-secondary hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mb-4">
        {[{ color: '#60a5fa', label: '日计划' }, { color: '#c084fc', label: '周计划' }, { color: '#fbbf24', label: '月计划' }].map((l) => (
          <div key={l.color} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-caption-2" style={{ fontSize: 11, color: 'var(--text-quaternary)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-2" style={{ fontSize: 11, color: 'var(--text-quaternary)' }}>{w}</span>
        ))}
        {cells.map((cell, i) => {
          if (!cell.day) return <div key={`e${i}`} style={{ width: 32, height: 32 }} />
          const isToday = cell.dateStr === todayStr
          const isSelected = selectedDate === cell.dateStr
          const dayPlans = getPlansForDate(cell.dateStr)
          const uniqueColors = [...new Set(dayPlans.map((p) => p.color))]
          return (
            <div
              key={cell.dateStr}
              onClick={() => setSelectedDate(cell.dateStr)}
              className="cursor-pointer rounded-md transition-colors flex flex-col items-center justify-center"
              style={{
                width: 32,
                height: 32,
                background: isToday
                  ? 'rgba(10,132,255,0.15)'
                  : isSelected
                    ? 'var(--bg-secondary)'
                    : undefined,
                color: isToday ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                fontWeight: isToday ? 600 : undefined,
              }}
            >
              <span style={{ fontSize: 12 }}>{cell.day}</span>
              {uniqueColors.length > 0 && (
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {uniqueColors.slice(0, 3).map((c) => (
                    <div key={c} className="w-1 h-1 rounded-full" style={{ background: c }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected date plans */}
      {selectedDate && datePlans.length > 0 && (
        <div className="mt-4 rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <div className="px-4 pt-3 pb-1 text-caption-2" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {selectedDate} 的计划
          </div>
          {datePlans.map((p) => (
            <div
              key={p.id}
              onClick={() => setActivePlan(p.id)}
              className="group flex items-center gap-3 cursor-pointer transition-colors"
              style={{
                minHeight: 48,
                padding: '10px 16px',
                borderBottom: '1px solid var(--separator)',
              }}
            >
              <div style={{ width: 3, height: 24, borderRadius: 2, background: p.color, flexShrink: 0 }} />
              <span className="text-subhead font-medium text-primary truncate flex-1" style={{ fontSize: 13 }}>
                {p.title}
              </span>
              <span className="text-caption-2 text-quaternary" style={{ fontSize: 11 }}>
                {p.startDate}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
