const TAG_COLOR = '#0A84FF'

export function getTagColor(): string {
  return TAG_COLOR
}

export function getAllTags(items: Array<{ tags?: string[] }>): string[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name)
}
