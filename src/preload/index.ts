import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'

const api = {
  // Store
  storeGet: (key: string) => ipcRenderer.invoke(IPC.STORE_GET, key),
  storeSet: (key: string, value: unknown) => ipcRenderer.invoke(IPC.STORE_SET, key, value),
  storeDelete: (key: string) => ipcRenderer.invoke(IPC.STORE_DELETE, key),
  onStoreDidChange: (callback: (key: string, newValue: unknown, oldValue: unknown) => void) => {
    const handler = (_e: any, data: { key: string; newValue: unknown; oldValue: unknown }) => callback(data.key, data.newValue, data.oldValue)
    ipcRenderer.on(IPC.STORE_ON_DID_CHANGE, handler)
    return () => ipcRenderer.removeListener(IPC.STORE_ON_DID_CHANGE, handler)
  },

  // FS
  fsReadFile: (filePath: string) => ipcRenderer.invoke(IPC.FS_READ_FILE, filePath),
  fsWriteFile: (filePath: string, content: string) => ipcRenderer.invoke(IPC.FS_WRITE_FILE, filePath, content),
  fsDeleteFile: (filePath: string) => ipcRenderer.invoke(IPC.FS_DELETE_FILE, filePath),
  fsReadDir: (dirPath: string) => ipcRenderer.invoke(IPC.FS_READ_DIR, dirPath) as Promise<string[]>,
  fsExists: (filePath: string) => ipcRenderer.invoke(IPC.FS_EXISTS, filePath) as Promise<boolean>,
  fsMkdir: (dirPath: string) => ipcRenderer.invoke(IPC.FS_MKDIR, dirPath),

  // Window
  windowSetSize: (width: number, height: number) => ipcRenderer.invoke(IPC.WINDOW_SET_SIZE, width, height),
  windowSetPosition: (x: number, y: number) => ipcRenderer.invoke(IPC.WINDOW_SET_POSITION, x, y),
  windowGetDisplay: () => ipcRenderer.invoke(IPC.WINDOW_GET_DISPLAY) as Promise<{ width: number; height: number }>,
  windowGetBounds: () => ipcRenderer.invoke(IPC.WINDOW_GET_BOUNDS),
  windowSetBounds: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke(IPC.WINDOW_SET_BOUNDS, bounds),
  windowSetIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.invoke(IPC.WINDOW_SET_IGNORE_MOUSE_EVENTS, ignore),
  windowMoveBy: (dx: number, dy: number) =>
    ipcRenderer.invoke(IPC.WINDOW_MOVE_BY, dx, dy),
  windowExpandPanel: (petX?: number, petY?: number) =>
    ipcRenderer.invoke(IPC.WINDOW_EXPAND_PANEL, petX, petY),
  windowCollapsePet: (petX?: number, petY?: number) =>
    ipcRenderer.invoke(IPC.WINDOW_COLLAPSE_PET, petX, petY),

  // Notification
  notificationShow: (title: string, body: string) => ipcRenderer.invoke(IPC.NOTIFICATION_SHOW, title, body),

  // Dialog
  dialogOpenDirectory: () => ipcRenderer.invoke(IPC.DIALOG_OPEN_DIRECTORY) as Promise<string | null>,

  // Auto-launch
  autolaunchEnable: () => ipcRenderer.invoke(IPC.AUTOLAUNCH_ENABLE),
  autolaunchDisable: () => ipcRenderer.invoke(IPC.AUTOLAUNCH_DISABLE),

  // Hotkey events
  onQuickCapture: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on(IPC.HOTKEY_QUICK_CAPTURE, handler)
    return () => ipcRenderer.removeListener(IPC.HOTKEY_QUICK_CAPTURE, handler)
  },
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  ;(window as any).api = api
}
