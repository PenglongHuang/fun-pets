import confetti from 'canvas-confetti'

export function fireConfetti(): void {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7, x: 0.8 },
    colors: ['#60a5fa', '#c084fc', '#fbbf24', '#34d399'],
  })
}
