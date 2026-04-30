import { useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface ToastItem {
  id: number
  message: string
}

let toastCounter = 0

export function useToast() {
  const [toast, setToast] = useState<ToastItem | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const showToast = useCallback((message: string, duration = 2000) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const id = ++toastCounter
    setToast({ id, message })
    timerRef.current = setTimeout(() => setToast(null), duration)
  }, [])

  const ToastContainer = useCallback(() => (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            zIndex: 10,
            background: 'rgba(44, 44, 46, 0.65)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            border: '0.5px solid rgba(255, 255, 255, 0.10)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            width: 16, height: 16,
            borderRadius: '50%',
            background: 'rgba(48, 209, 88, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <polyline points="2.5 6 5 8.5 9.5 3.5" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{
            font: 'var(--text-caption-2)',
            color: 'rgba(255, 255, 255, 0.75)',
          }}>
            {toast.message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  ), [toast])

  return { showToast, ToastContainer }
}
