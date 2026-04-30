const TAG_COLOR = '#8ab4f8'

export function getTagColor(): string {
  return TAG_COLOR
}

export interface TagWithCount {
  name: string
  count: number
}

export function getTagsWithCounts(items: Array<{ tags?: string[] }>): TagWithCount[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }))
}

export function getAllTags(items: Array<{ tags?: string[] }>): string[] {
  return getTagsWithCounts(items).map(({ name }) => name)
}
