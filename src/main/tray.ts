import { Tray, Menu, app, nativeImage, BrowserWindow } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'

let tray: Tray | null = null

function createFallbackIcon(): Electron.NativeImage {
  // Create a 32x32 RGBA buffer for a simple colored icon
  const size = 32
  const bufferSize = size * size * 4
  const buffer = Buffer.alloc(bufferSize)

  // Dark rounded-square background (#1C1C1E) with a colored circle center
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 1
  const innerR = size / 2 - 6

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= outerR) {
        // Inside rounded square area — dark background
        buffer[idx] = 28     // R
        buffer[idx + 1] = 28 // G
        buffer[idx + 2] = 30 // B
        buffer[idx + 3] = 240 // A

        // Draw gradient circle (pet face)
        if (dist <= innerR) {
          const t = dist / innerR
          // Purple-blue gradient: #667eea → #764ba2
          buffer[idx] = Math.round(102 + (118 - 102) * t)
          buffer[idx + 1] = Math.round(126 + (75 - 126) * t)
          buffer[idx + 2] = Math.round(234 + (162 - 234) * t)
          buffer[idx + 3] = 255
        }

        // Eyes
        const leftEyeX = cx - 5
        const rightEyeX = cx + 5
        const eyeY = cy - 2
        const eyeR = 2.5

        const isLeftEye = Math.sqrt((x - leftEyeX) ** 2 + (y - eyeY) ** 2) <= eyeR
        const isRightEye = Math.sqrt((x - rightEyeX) ** 2 + (y - eyeY) ** 2) <= eyeR

        if ((isLeftEye || isRightEye) && dist <= innerR) {
          buffer[idx] = 30
          buffer[idx + 1] = 30
          buffer[idx + 2] = 30
          buffer[idx + 3] = 220
        }
      } else {
        // Transparent outside
        buffer[idx + 3] = 0
      }
    }
  }

  return nativeImage.createFromBuffer(buffer, { width: size, height: size })
}

function loadIcon(): Electron.NativeImage {
  // Try multiple paths for the SVG/PNG icon
  const candidates = [
    join(__dirname, '../../resources/icon.png'),
    join(__dirname, '../../resources/icon.svg'),
    join(process.resourcesPath || '', 'resources/icon.png'),
    join(process.resourcesPath || '', 'resources/icon.svg'),
  ]

  for (const path of candidates) {
    try {
      const buf = readFileSync(path)
      const img = nativeImage.createFromBuffer(buf)
      if (!img.isEmpty()) return img.resize({ width: 22, height: 22 })
    } catch {
      // Try next candidate
    }
  }

  // Fallback: programmatic icon
  console.warn('Using fallback tray icon')
  return createFallbackIcon().resize({ width: 22, height: 22 })
}

export function createTray(): void {
  const icon = loadIcon()
  tray = new Tray(icon)
  tray.setToolTip('FunPets')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示 FunPets',
      click: () => {
        const win = BrowserWindow.getAllWindows()[0]
        if (win) {
          win.show()
          win.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit(),
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.show()
      win.focus()
    }
  })
}
