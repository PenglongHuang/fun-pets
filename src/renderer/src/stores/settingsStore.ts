import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { store, autolaunch } from '@/lib/ipc'

interface PomodoroSettings {
  focusDuration: number
  shortBreak: number
  longBreak: number
  roundsBeforeLongBreak: number
}

interface AppSettings {
  autoStart: boolean
  closeToTray: boolean
  quickCaptureHotkey: string
}

interface SettingsState {
  storageDir: string
  pomodoro: PomodoroSettings
  app: AppSettings
  loaded: boolean
  load: () => Promise<void>
  setStorageDir: (dir: string) => Promise<void>
  updatePomodoro: (updates: Partial<PomodoroSettings>) => Promise<void>
  updateApp: (updates: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>()(
  immer((set, get) => ({
    storageDir: '',
    pomodoro: { focusDuration: 25, shortBreak: 5, longBreak: 15, roundsBeforeLongBreak: 4 },
    app: { autoStart: false, closeToTray: true, quickCaptureHotkey: 'Ctrl+Shift+N' },
    loaded: false,

    load: async () => {
      const settings = await store.get<{
        storageDir: string
        pomodoro: PomodoroSettings
        app: AppSettings
      }>('settings')
      if (settings) {
        set((s) => {
          s.storageDir = settings.storageDir || s.storageDir
          if (settings.pomodoro) Object.assign(s.pomodoro, settings.pomodoro)
          if (settings.app) Object.assign(s.app, settings.app)
        })
      }
      set({ loaded: true })
    },

    setStorageDir: async (dir) => {
      set({ storageDir: dir })
      await store.set('settings.storageDir', dir)
    },

    updatePomodoro: async (updates) => {
      set((s) => { Object.assign(s.pomodoro, updates) })
      await store.set('settings.pomodoro', get().pomodoro)
    },

    updateApp: async (updates) => {
      set((s) => { Object.assign(s.app, updates) })
      await store.set('settings.app', get().app)
      if (updates.autoStart !== undefined) {
        await (updates.autoStart ? autolaunch.enable() : autolaunch.disable())
      }
    },
  }))
)
