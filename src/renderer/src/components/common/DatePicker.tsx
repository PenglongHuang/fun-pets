import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  mode?: 'date' | 'month'
}

export default function DatePicker({ value, onChange, mode = 'date' }: DatePickerProps) {
  const parsed = value.split('-')
  const [year, setYear] = useState(() => (mode === 'month' ? parseInt(parsed[0]) : parseInt(parsed[0])))
  const [month, setMonth] = useState(() => (mode === 'month' ? parseInt(parsed[1]) - 1 : parseInt(parsed[1]) - 1))

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  if (mode === 'month') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="flex items-center justify-between">
          <button onClick={() => setYear(year - 1)} style={navBtnStyle}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ font: 'var(--text-subhead)', color: 'var(--text-primary)', fontWeight: 600 }}>
            {year}年
          </span>
          <button onClick={() => setYear(year + 1)} style={navBtnStyle}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTH_LABELS.map((label, i) => {
            const monthStr = formatMonth(year, i)
            const isSelected = value === monthStr
            return (
              <button
                key={label}
                onClick={() => onChange(monthStr)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  background: isSelected ? 'rgba(10,132,255,0.16)' : 'transparent',
                  color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const today = new Date()
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  const cells: Array<{ day: number | null; dateStr: string }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: formatDate(year, month, d) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} style={navBtnStyle}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ font: 'var(--text-subhead)', color: 'var(--text-primary)', fontWeight: 600 }}>
          {year}年{month + 1}月
        </span>
        <button onClick={nextMonth} style={navBtnStyle}>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} style={{ font: 'var(--text-caption-2)', color: 'var(--text-quaternary)', paddingBottom: 4 }}>
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 justify-items-center">
        {cells.map((cell, i) => {
          if (!cell.day) return <div key={`e${i}`} style={{ width: 28, height: 28 }} />
          const isToday = cell.dateStr === todayStr
          const isSelected = value === cell.dateStr
          return (
            <button
              key={cell.dateStr}
              onClick={() => onChange(cell.dateStr)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isToday || isSelected ? 600 : 400,
                background: isSelected
                  ? 'rgba(10,132,255,0.20)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--accent-blue)'
                  : isToday
                    ? 'var(--accent-blue)'
                    : 'var(--text-tertiary)',
                border: 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-tertiary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
