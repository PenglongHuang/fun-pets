import { useSettingsStore } from '@/stores/settingsStore'
import { dialog } from '@/lib/ipc'
import { FolderOpen, Timer, Zap, Database } from 'lucide-react'
import { useState } from 'react'

/* ============================================
   iOS/macOS-style Toggle Switch
   ============================================ */
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--separator)' }}>
      <span className="text-body" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="relative"
        style={{
          width: 51,
          height: 31,
          borderRadius: 'var(--radius-full)',
          background: value ? 'var(--accent-blue)' : 'rgba(120,120,128,0.24)',
          transition: 'background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          border: 'none',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            width: 27,
            height: 27,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: value ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
}

/* ============================================
   Settings Group Card Container
   ============================================ */
function SettingsGroup({
  icon,
  title,
  iconColor,
  children,
}: {
  icon: React.ReactNode
  title: string
  iconColor: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: 20,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        marginBottom: 16,
      }}
    >
      {/* Group header */}
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <div style={{ color: iconColor }}>{icon}</div>
        <span className="text-footnote font-semibold tracking-wide" style={{ color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
          {title}
        </span>
      </div>

      {/* Group content */}
      {children}
    </div>
  )
}

/* ============================================
   Number Input Row
   ============================================ */
function NumberInputRow({
  label,
  value,
  unit,
  onChange,
}: {
  label: string
  value: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--separator)' }}>
      <span className="text-body" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <div className="flex items-center">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={undefined}
          style={{
            width: 64,
            height: 32,
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 15,
            textAlign: 'center',
            border: '1px solid transparent',
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)' }}
          onBlur={(e) => { e.target.style.borderColor = 'transparent' }}
        />
        <span className="text-caption-1 ml-1.5" style={{ color: 'var(--text-tertiary)' }}>{unit}</span>
      </div>
    </div>
  )
}

/* ============================================
   Action Button Styles
   ============================================ */
const btnPrimary: React.CSSProperties = {
  background: 'var(--accent-blue)',
  color: 'white',
  padding: '0 16px',
  height: 36,
  borderRadius: 'var(--radius-sm)',
  fontSize: 12,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease',
}

const btnDestructive: React.CSSProperties = {
  background: 'rgba(255,55,95,0.10)',
  color: 'var(--accent-pink)',
  padding: '0 14px',
  height: 36,
  borderRadius: 'var(--radius-sm)',
  fontSize: 12,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
}

const btnGhost: React.CSSProperties = {
  color: 'var(--accent-blue)',
  background: 'transparent',
  padding: '0 12px',
  height: 36,
  borderRadius: 'var(--radius-sm)',
  fontSize: 12,
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
}

/* ============================================
   Main Settings Panel
   ============================================ */
export default function SettingsPanel() {
  const storageDir = useSettingsStore((s) => s.storageDir)
  const pomodoro = useSettingsStore((s) => s.pomodoro)
  const app = useSettingsStore((s) => s.app)
  const setStorageDir = useSettingsStore((s) => s.setStorageDir)
  const updatePomodoro = useSettingsStore((s) => s.updatePomodoro)
  const updateApp = useSettingsStore((s) => s.updateApp)
  const [saved, setSaved] = useState(false)

  const flashSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handlePickDir = async () => {
    const dir = await dialog.openDirectory()
    if (dir) {
      await setStorageDir(dir)
      flashSave()
    }
  }

  return (
    <div className="flex flex-col">
      {/* Save indicator toast */}
      {saved && (
        <div
          className="flex items-center justify-center mb-3"
          style={{
            padding: '6px 16px',
            background: 'rgba(48,209,88,0.12)',
            borderRadius: 'var(--radius-full)',
            alignSelf: 'center',
          }}
        >
          <span className="text-caption-1 font-medium" style={{ color: 'var(--accent-green)' }}>已保存</span>
        </div>
      )}

      {/* ===== Storage Group ===== */}
      <SettingsGroup
        icon={<FolderOpen size={16} />}
        title="存储"
        iconColor="var(--accent-green)"
      >
        <div className="" style={{ paddingBottom: 4 }}>
          <div
            className="flex items-center gap-2"
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              marginBottom: 10,
            }}
          >
            <span
              className="text-caption-1 font-mono truncate block"
              style={{ color: 'var(--text-secondary)', flex: 1 }}
            >
              {storageDir}
            </span>
          </div>
          <button onClick={handlePickDir} className="" style={btnPrimary}>
            选择目录
          </button>
        </div>
      </SettingsGroup>

      {/* ===== Pomodoro Group ===== */}
      <SettingsGroup
        icon={<Timer size={16} />}
        title="番茄钟"
        iconColor="var(--accent-orange)"
      >
        <NumberInputRow
          label="专注时长"
          value={pomodoro.focusDuration}
          unit="分钟"
          onChange={(v) => { updatePomodoro({ focusDuration: v }); flashSave() }}
        />
        <NumberInputRow
          label="短休息"
          value={pomodoro.shortBreak}
          unit="分钟"
          onChange={(v) => { updatePomodoro({ shortBreak: v }); flashSave() }}
        />
        <NumberInputRow
          label="长休息"
          value={pomodoro.longBreak}
          unit="分钟"
          onChange={(v) => { updatePomodoro({ longBreak: v }); flashSave() }}
        />
        <div className="flex items-center justify-between" style={{ paddingTop: 10 }}>
          <span className="text-body" style={{ color: 'var(--text-primary)' }}>轮次</span>
          <div className="flex items-center">
            <input
              type="number"
              value={pomodoro.roundsBeforeLongBreak}
              onChange={(e) => { updatePomodoro({ roundsBeforeLongBreak: Number(e.target.value) }); flashSave() }}
              className={undefined}
              style={{
                width: 64,
                height: 32,
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 15,
                textAlign: 'center',
                border: '1px solid transparent',
                outline: 'none',
              }}
            />
            <span className="text-caption-1 ml-1.5" style={{ color: 'var(--text-tertiary)' }}>轮后长休息</span>
          </div>
        </div>
      </SettingsGroup>

      {/* ===== App Behavior Group ===== */}
      <SettingsGroup
        icon={<Zap size={16} />}
        title="应用行为"
        iconColor="var(--accent-blue)"
      >
        <ToggleRow
          label="开机自启动"
          value={app.autoStart}
          onChange={(v) => { updateApp({ autoStart: v }); flashSave() }}
        />
        <ToggleRow
          label="关闭时最小化到托盘"
          value={app.closeToTray}
          onChange={(v) => { updateApp({ closeToTray: v }); flashSave() }}
        />
        <div className="flex items-center justify-between" style={{ padding: '10px 0' }}>
          <span className="text-body" style={{ color: 'var(--text-primary)' }}>快速捕获快捷键</span>
          <span
            className="font-mono text-caption-1 px-2 py-1 inline-block"
            style={{
              color: 'var(--text-secondary)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {app.quickCaptureHotkey}
          </span>
        </div>
      </SettingsGroup>

      {/* ===== Data Management Group ===== */}
      <SettingsGroup
        icon={<Database size={16} />}
        title="数据管理"
        iconColor="var(--accent-purple)"
      >
        <div className="flex gap-2" style={{ paddingTop: 4 }}>
          <button style={btnGhost}>导出 JSON</button>
          <button style={btnGhost}>导出 Markdown</button>
          <button style={btnDestructive}>清空数据</button>
        </div>
      </SettingsGroup>
    </div>
  )
}
