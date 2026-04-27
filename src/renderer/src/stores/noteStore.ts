import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import { fs } from '@/lib/ipc'
import type { Note } from '@/types/note'

const COLOR_PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

interface NoteStore {
  notes: Note[]
  loaded: boolean
  activeNoteId: string | null
  load: () => Promise<void>
  createNote: (title: string, content?: string) => Promise<Note>
  deleteNote: (id: string) => Promise<void>
  saveNoteContent: (id: string, content: string) => Promise<void>
  loadNoteContent: (id: string) => Promise<string>
  setActiveNote: (id: string | null) => void
}

export const useNoteStore = create<NoteStore>()(
  immer((set, get) => ({
    notes: [],
    loaded: false,
    activeNoteId: null,

    load: async () => {
      try {
        const raw = await fs.readFile('notes/index.json')
        const notes: Note[] = JSON.parse(raw)
        const validNotes: Note[] = []
        for (const note of notes) {
          const exists = await fs.exists(note.filePath).catch(() => false)
          if (exists) validNotes.push(note)
        }
        if (validNotes.length !== notes.length) {
          await fs.writeFile('notes/index.json', JSON.stringify(validNotes, null, 2))
        }
        set({ notes: validNotes, loaded: true })
      } catch {
        set({ notes: [], loaded: true })
      }
    },

    createNote: async (title, content = '') => {
      const id = nanoid(8)
      const slug = title.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').slice(0, 20)
      const filePath = `notes/${id}-${slug}.md`
      const color = COLOR_PALETTE[get().notes.length % COLOR_PALETTE.length]
      const now = new Date().toISOString()
      const note: Note = { id, title, filePath, color, createdAt: now, updatedAt: now }

      await fs.writeFile(filePath, content || `# ${title}\n\n`)
      set((s) => { s.notes.push(note) })
      await fs.writeFile('notes/index.json', JSON.stringify(get().notes, null, 2))
      return note
    },

    deleteNote: async (id) => {
      const note = get().notes.find((n) => n.id === id)
      if (note) {
        try { await fs.deleteFile(note.filePath) } catch {}
      }
      set((s) => { s.notes = s.notes.filter((n) => n.id !== id) })
      await fs.writeFile('notes/index.json', JSON.stringify(get().notes, null, 2))
    },

    saveNoteContent: async (id, content) => {
      const note = get().notes.find((n) => n.id === id)
      if (!note) return
      await fs.writeFile(note.filePath, content)
    },

    loadNoteContent: async (id) => {
      const note = get().notes.find((n) => n.id === id)
      if (!note) return ''
      return fs.readFile(note.filePath)
    },

    setActiveNote: (id) => set({ activeNoteId: id }),
  }))
)
