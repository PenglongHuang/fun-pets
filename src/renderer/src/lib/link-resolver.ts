import { usePlanStore } from '@/stores/planStore'
import { useNoteStore } from '@/stores/noteStore'
import type { ResolvedLink } from './link-parser'

export interface LinkSearchResult {
  id: string
  title: string
  type: 'plan' | 'note'
  tags: string[]
}

async function ensureLoaded() {
  const planStore = usePlanStore.getState()
  const noteStore = useNoteStore.getState()
  const promises: Promise<void>[] = []
  if (!planStore.loaded) promises.push(planStore.load())
  if (!noteStore.loaded) promises.push(noteStore.load())
  if (promises.length > 0) await Promise.all(promises)
}

export async function resolveLinks(ids: string[]): Promise<Map<string, ResolvedLink>> {
  await ensureLoaded()
  const map = new Map<string, ResolvedLink>()
  const plans = usePlanStore.getState().plans
  const notes = useNoteStore.getState().notes

  for (const id of ids) {
    const plan = plans.find(p => p.id === id)
    if (plan) {
      map.set(id, { id, title: plan.title, type: 'plan' })
      continue
    }
    const note = notes.find(n => n.id === id)
    if (note) {
      map.set(id, { id, title: note.title, type: 'note' })
      continue
    }
  }
  return map
}

export async function searchLinks(query: string): Promise<LinkSearchResult[]> {
  await ensureLoaded()
  const q = query.toLowerCase().trim()
  const plans = usePlanStore.getState().plans
  const notes = useNoteStore.getState().notes

  const results: LinkSearchResult[] = []

  for (const p of plans) {
    if (!q || p.title.toLowerCase().includes(q)) {
      results.push({ id: p.id, title: p.title, type: 'plan', tags: p.tags ?? [] })
    }
  }
  for (const n of notes) {
    if (!q || n.title.toLowerCase().includes(q)) {
      results.push({ id: n.id, title: n.title, type: 'note', tags: n.tags ?? [] })
    }
  }

  return results.slice(0, 10)
}
