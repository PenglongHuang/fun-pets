import { ipcMain, Notification, dialog, screen, app } from 'electron'
import { readFile, writeFile, unlink, readdir, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { getStore } from './store'
import { resizeWindow, getMainWindow, expandToPanelMode, collapseToPetMode } from './window'
import { IPC } from '../shared/ipc-channels'

export function registerIpcHandlers(): void {
  const store = getStore()

  // Store
  ipcMain.handle(IPC.STORE_GET, (_e, key: string) => store.get(key))
  ipcMain.handle(IPC.STORE_SET, (_e, key: string, value: unknown) => store.set(key, value))
  ipcMain.handle(IPC.STORE_DELETE, (_e, key: string) => store.delete(key))

  // Store change listener
  ipcMain.handle(IPC.STORE_ON_DID_CHANGE, (e) => {
    const unsubscribe = store.onDidChange('settings' as any, (newValue, oldValue) => {
      try {
        e.sender.send(IPC.STORE_ON_DID_CHANGE, { key: 'settings', newValue, oldValue })
      } catch { /* window may be closed */ }
    })
    return unsubscribe
  })

  // FS (paths relative to storageDir)
  ipcMain.handle(IPC.FS_READ_FILE, async (_e, filePath: string) => {
    const dir = store.get('settings.storageDir')
    return readFile(join(dir, filePath), 'utf-8')
  })

  ipcMain.handle(IPC.FS_WRITE_FILE, async (_e, filePath: string, content: string) => {
    const dir = store.get('settings.storageDir')
    const fullPath = join(dir, filePath)
    await mkdir(dirname(fullPath), { recursive: true })
    return writeFile(fullPath, content, 'utf-8')
  })

  ipcMain.handle(IPC.FS_DELETE_FILE, async (_e, filePath: string) => {
    const dir = store.get('settings.storageDir')
    return unlink(join(dir, filePath))
  })

  ipcMain.handle(IPC.FS_READ_DIR, async (_e, dirPath: string) => {
    const base = store.get('settings.storageDir')
    const fullDir = join(base, dirPath)
    try {
      const entries = await readdir(fullDir, { withFileTypes: true })
      return entries.filter((e) => e.isFile()).map((e) => e.name)
    } catch {
      return []
    }
  })

  ipcMain.handle(IPC.FS_EXISTS, (_e, filePath: string) => {
    const dir = store.get('settings.storageDir')
    return existsSync(join(dir, filePath))
  })

  ipcMain.handle(IPC.FS_MKDIR, async (_e, dirPath: string) => {
    const base = store.get('settings.storageDir')
    return mkdir(join(base, dirPath), { recursive: true })
  })

  // Window
  ipcMain.handle(IPC.WINDOW_SET_SIZE, (_e, width: number, height: number) => {
    resizeWindow(width, height)
  })

  ipcMain.handle(IPC.WINDOW_SET_POSITION, (_e, x: number, y: number) => {
    getMainWindow()?.setPosition(x, y)
  })

  ipcMain.handle(IPC.WINDOW_GET_DISPLAY, () => {
    const display = screen.getPrimaryDisplay()
    return { width: display.workAreaSize.width, height: display.workAreaSize.height }
  })

  ipcMain.handle(IPC.WINDOW_GET_BOUNDS, (_e) => {
    return getMainWindow()?.getBounds()
  })

  ipcMain.handle(IPC.WINDOW_SET_BOUNDS, (_e, bounds: { x: number; y: number; width: number; height: number }) => {
    getMainWindow()?.setBounds(bounds)
  })

  ipcMain.handle(IPC.WINDOW_SET_IGNORE_MOUSE_EVENTS, (_e, ignore: boolean) => {
    getMainWindow()?.setIgnoreMouseEvents(ignore, { forward: true })
  })

  ipcMain.handle(IPC.WINDOW_MOVE_BY, (_e, dx: number, dy: number) => {
    const win = getMainWindow()
    if (!win) return
    const [x, y] = win.getPosition()
    win.setPosition(x + dx, y + dy)
  })

  ipcMain.handle(IPC.WINDOW_EXPAND_PANEL, (_e, petX?: number, petY?: number) => {
    expandToPanelMode(petX, petY)
  })

  ipcMain.handle(IPC.WINDOW_COLLAPSE_PET, (_e, petX?: number, petY?: number) => {
    collapseToPetMode(petX, petY)
  })

  // Notification
  ipcMain.handle(IPC.NOTIFICATION_SHOW, (_e, title: string, body: string) => {
    new Notification({ title, body }).show()
  })

  // Dialog
  ipcMain.handle(IPC.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  // Auto-launch
  ipcMain.handle(IPC.AUTOLAUNCH_ENABLE, () => {
    app.setLoginItemSettings({ openAtLogin: true })
  })
  ipcMain.handle(IPC.AUTOLAUNCH_DISABLE, () => {
    app.setLoginItemSettings({ openAtLogin: false })
  })
}
