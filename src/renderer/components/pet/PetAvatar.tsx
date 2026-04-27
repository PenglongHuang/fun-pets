import { usePetStore } from '@/stores/petStore'
import type { PetState } from '@/types/pet'

interface PetAvatarProps {
  size?: number
  onClick?: () => void
  className?: string
}

const GRADIENTS: Record<PetState, string> = {
  idle: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  focus: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  happy: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  sleepy: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
}

const ANIMATIONS: Record<PetState, string> = {
  idle: 'pet-idle 3s ease-in-out infinite',
  focus: 'pet-focus 1.5s ease-in-out infinite',
  happy: 'pet-happy 1.2s ease-in-out 3',
  sleepy: 'pet-sleepy 4s ease-in-out infinite',
}

export default function PetAvatar({ size = 120, onClick, className = '' }: PetAvatarProps) {
  const state = usePetStore((s) => s.state)

  // 根据尺寸计算内部元素相对大小
  const eyeSize = Math.max(4, Math.round(size * 0.09))   // ~10.8px at 120px
  const pupilSize = Math.max(2, Math.round(size * 0.027))  // ~3.2px
  const mouthWidth = Math.max(8, Math.round(size * 0.14))  // ~17px at 120px

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {/* 外层容器：圆形、渐变、动画、阴影 */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: GRADIENTS[state],
          animation: ANIMATIONS[state],
          boxShadow: `
            inset 0 -${Math.round(size * 0.033)}px ${Math.round(size * 0.1)}px rgba(0,0,0,0.15),
            0 ${Math.round(size * 0.05)}px ${Math.round(size * 0.2)}px rgba(0,0,0,0.25),
            0 0 ${Math.round(size * 0.4)}px ${
              state === 'idle' ? 'rgba(102,126,234,0.25)' :
              state === 'focus' ? 'rgba(255,159,10,0.3)' :
              state === 'happy' ? 'rgba(79,172,254,0.35)' :
              'rgba(161,140,209,0.25)'
            }
          `,
          transition: 'transform 0.15s var(--ease-apple), box-shadow 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'visible',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = '' }}
        onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)' }}
        onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)' }}
      >
        {/* Focus indicator dot */}
        {(state === 'focus') && (
          <div style={{
            position: 'absolute',
            top: Math.round(size * 0.06),
            right: Math.round(size * 0.06),
            width: Math.round(size * 0.1),
            height: Math.round(size * 0.1),
            borderRadius: '50%',
            background: '#FF9F0A',
            boxShadow: '0 0 6px rgba(255,159,10,0.6)',
            zIndex: 2,
          }} />
        )}

        {/* Face container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Eyes row */}
          <div style={{
            display: 'flex',
            gap: Math.round(size * 0.18),
            marginBottom: Math.round(size * 0.06),
          }}>
            {/* Left eye */}
            <div style={{
              width: eyeSize,
              height: Math.round(eyeSize * 1.25),
              borderRadius: Math.round(eyeSize * 0.4) + 'px',
              background: 'rgba(30,30,30,0.85)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Pupil */}
              <div style={{
                width: pupilSize,
                height: pupilSize,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.8)',
                position: 'absolute',
                top: '30%',
              }} />
              {/* Highlight */}
              <div style={{
                width: Math.round(pupilSize * 0.6),
                height: Math.round(pupilSize * 0.6),
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.5)',
                position: 'absolute',
                top: '15%',
                left: '55%',
              }} />
            </div>

            {/* Right eye */}
            <div style={{
              width: eyeSize,
              height: Math.round(eyeSize * 1.25),
              borderRadius: Math.round(eyeSize * 0.4) + 'px',
              background: 'rgba(30,30,30,0.85)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: pupilSize,
                height: pupilSize,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.8)',
                position: 'absolute',
                top: '30%',
              }} />
              <div style={{
                width: Math.round(pupilSize * 0.6),
                height: Math.round(pupilSize * 0.6),
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.5)',
                position: 'absolute',
                top: '15%',
                left: '55%',
              }} />
            </div>
          </div>

          {/* Mouth */}
          <div style={{
            width: mouthWidth,
            height: state === 'sleepy' ? Math.round(mouthWidth * 0.5) : Math.round(mouthWidth * 0.25),
            borderBottom: state === 'focus'
              ? '2px solid rgba(30,30,30,0.5)'
              : `${Math.round(size * 0.015)}px solid rgba(30,30,30,${state === 'sleepy' ? '0.4' : '0.6'})`,
            borderLeft: state === 'sleepy' ? `${Math.round(size * 0.015)}px solid rgba(30,30,30,0.4)` : 'none',
            borderRight: state === 'sleepy' ? `${Math.round(size * 0.015)}px solid rgba(30,30,30,0.4)` : 'none',
            borderTop: 'none',
            borderRadius: state === 'sleepy'
              ? `${Math.round(mouthWidth * 0.3)}px`
              : state === 'happy'
                ? `0 0 ${Math.round(mouthWidth * 0.5)}px ${Math.round(mouthWidth * 0.5)}px`
                : `0 0 ${Math.round(mouthWidth * 0.8)}px ${Math.round(mouthWidth * 0.8)}px`,
            marginTop: Math.round(size * 0.03),
          }} />

          {/* Cheek blushes (hidden for focus/sleepy) */}
          {(state === 'idle' || state === 'happy') && (
            <>
              <div style={{
                position: 'absolute',
                left: Math.round(size * 0.1),
                bottom: Math.round(size * 0.28),
                width: Math.round(size * 0.12),
                height: Math.round(size * 0.07),
                borderRadius: '50%',
                background: 'rgba(255,120,140,0.22)',
              }} />
              <div style={{
                position: 'absolute',
                right: Math.round(size * 0.1),
                bottom: Math.round(size * 0.28),
                width: Math.round(size * 0.12),
                height: Math.round(size * 0.07),
                borderRadius: '50%',
                background: 'rgba(255,120,140,0.22)',
              }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
