import DynamicIsland from './DynamicIsland'
import TrafficLights from './TrafficLights'

export default function TitleBar() {
  return (
    <div
      style={{
        height: 36,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        background: 'rgba(28, 28, 30, 1)',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        WebkitAppRegion: 'drag',
        borderRadius: '16px 16px 0 0',
      }}
    >
      {/* Left drag spacer */}
      <div style={{ flex: 1 }} />

      {/* Center: Dynamic Island (no-drag internally) */}
      <DynamicIsland />

      {/* Right drag spacer */}
      <div style={{ flex: 1 }} />

      {/* Traffic lights (no-drag internally) */}
      <TrafficLights />
    </div>
  )
}
