import { create } from 'zustand'

let toastCounter = 0
let toastTimer: ReturnType<typeof setTimeout> | null = null

interface ToastState {
  message: string | null
  _id: number
  show: (message: string, duration?: number) => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  _id: 0,

  show: (message, duration = 2000) => {
    if (toastTimer) clearTimeout(toastTimer)
    const id = ++toastCounter
    set({ message, _id: id })
    toastTimer = setTimeout(() => {
      set((s) => s._id === id ? { message: null, _id: 0 } : s)
    }, duration)
  },
}))
