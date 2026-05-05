import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNoteStore } from '@/stores/noteStore'
import { Plus, Trash2, CheckSquare, Square, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import TagFilterBar from '@/components/common/TagFilterBar'
import ListToolbar, { type ViewMode } from '@/components/common/ListToolbar'
import { getAllTags, getTagsWithCounts } from '@/lib/tag-utils'
import { fs } from '@/lib/ipc'
import { usePlanStore } from '@/stores/planStore'
import { useToastStore } from '@/stores/toastStore'
import NoteEditor from './NoteEditor'
import { Button, ContextMenu, ConfirmDialog, TagBadge, MoreButton } from '@/components/ui'

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function NotesPanel() {
  const notes = useNoteStore((s) => s.notes)
  const loaded = useNoteStore((s) => s.loaded)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)
  const load = useNoteStore((s) => s.load)
  const createNote = useNoteStore((s) => s.createNote)
  const deleteNote = useNoteStore((s) => s.deleteNote)
  const deleteNotes = useNoteStore((s) => s.deleteNotes)
  const setActiveNote = useNoteStore((s) => s.setActiveNote)
  const renameNoteTag = useNoteStore((s) => s.renameTag)
  const deleteNoteTag = useNoteStore((s) => s.deleteTag)
  const renamePlanTag = usePlanStore((s) => s.renameTag)
  const deletePlanTag = usePlanStore((s) => s.deleteTag)

  const sortBy = useNoteStore((s) => s.sortBy)
  const viewMode = useNoteStore((s) => s.viewMode)
  const setSortBy = useNoteStore((s) => s.setSortBy)
  const setViewMode = useNoteStore((s) => s.setViewMode)

  const [editMode, setEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'batch'; id?: string } | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ noteId: string; rect: DOMRect } | null>(null)

  useEffect(() => { load() }, [load])

  const allTags = useMemo(() => getAllTags(notes), [notes])
  const tagFilterItems = useMemo(() => getTagsWithCounts(notes), [notes])
  const filteredNotes = useMemo(() => {
    if (activeTag === null) return notes
    return notes.filter((n) => (n.tags ?? []).includes(activeTag))
  }, [notes, activeTag])

  const sortedNotes = useMemo(() => {
    const sorted = [...filteredNotes]
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
        break
      default: // 'time'
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }
    return sorted
  }, [filteredNotes, sortBy])

  const [snippets, setSnippets] = useState<Record<string, string>>({})

  useEffect(() => {
    if (viewMode === 'compact') return
    const loadSnippets = async () => {
      const newSnippets: Record<string, string> = {}
      for (const note of filteredNotes) {
        try {
          const content = await fs.readFile(note.filePath)
          const firstLine = content.split('\n').find((l: string) => l.trim().length > 0 && !l.startsWith('#'))?.trim() ?? ''
          if (firstLine) newSnippets[note.id] = firstLine.slice(0, 80)
        } catch { /* ignore */ }
      }
      setSnippets((prev) => {
        const changed = Object.keys(newSnippets).some((k) => newSnippets[k] !== prev[k])
          || Object.keys(prev).some((k) => !(k in newSnippets))
        return changed ? newSnippets : prev
      })
    }
    loadSnippets()
  }, [filteredNotes, viewMode])

  const handleCreate = async () => {
    const note = await createNote('新笔记')
    setActiveNote(note.id)
    useToastStore.getState().show('新建笔记成功')
  }

  const handleRenameTag = useCallback(async (oldName: string, newName: string) => {
    await Promise.all([renameNoteTag(oldName, newName), renamePlanTag(oldName, newName)])
  }, [renameNoteTag, renamePlanTag])

  const handleDeleteTag = useCallback(async (tagName: string) => {
    await Promise.all([deleteNoteTag(tagName), deletePlanTag(tagName)])
  }, [deleteNoteTag, deletePlanTag])

  const visibleIds = useMemo(() => new Set(filteredNotes.map((n) => n.id)), [filteredNotes])
  const allSelected = filteredNotes.length > 0 && filteredNotes.every((n) => selectedIds.has(n.id))

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return
    setDeleteTarget({ type: 'batch' })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'single' && deleteTarget.id) {
      await deleteNote(deleteTarget.id)
      if (activeNoteId === deleteTarget.id) setActiveNote(null)
    } else if (deleteTarget.type === 'batch') {
      await deleteNotes(Array.from(selectedIds))
      if (activeNoteId && selectedIds.has(activeNoteId)) setActiveNote(null)
      setSelectedIds(new Set())
      setEditMode(false)
    }
    setDeleteTarget(null)
  }

  useEffect(() => {
    if (activeTag !== null) {
      const remaining = notes.filter((n) => (n.tags ?? []).includes(activeTag))
      if (remaining.length === 0) setActiveTag(null)
    }
  }, [notes, activeTag])

  const exitEditMode = () => {
    setEditMode(false)
    setSelectedIds(new Set())
  }

  if (!loaded) {
    return (
      <div style={{ font: 'var(--text-caption-1)', color: 'var(--text-quaternary)', textAlign: 'center', padding: '32px 0' }}>
        加载中...
      </div>
    )
  }

  if (activeNoteId) {
    return <NoteEditor />
  }

  return (
    <div className="flex flex-col h-full" style={{ gap: 6 }}>
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        {editMode ? (
          <>
            <button
              onClick={toggleSelectAll}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 'var(--radius-sm)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(10,132,255,0.10)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
              <span style={{ fontSize: 12, fontWeight: 500 }}>全选</span>
            </button>
            <Button variant="secondary" onClick={exitEditMode}>取消</Button>
          </>
        ) : (
          <>
            <span style={{ font: 'var(--text-caption-1)', color: 'var(--text-tertiary)' }}>
              {filteredNotes.length} 条笔记
            </span>
            <div className="flex items-center gap-1">
              {notes.length > 0 && (
                <Button variant="ghost" onClick={() => setEditMode(true)}>管理</Button>
              )}
              <Button
                variant="primary"
                icon={<Plus size={13} strokeWidth={2.5} />}
                motionProps={{ whileTap: { scale: 0.92 }, whileHover: { scale: 1.04 } }}
                onClick={handleCreate}
              >
                新建
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Tag filter bar */}
      {tagFilterItems.length > 0 && (
        <TagFilterBar
          tags={tagFilterItems}
          activeTag={activeTag}
          totalItems={notes.length}
          onSelect={setActiveTag}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
        />
      )}

      {/* Toolbar: sort + view mode */}
      {!editMode && sortedNotes.length > 0 && (
        <ListToolbar
          sortOptions={[
            { value: 'time', label: '时间' },
            { value: 'name', label: '名称' },
          ]}
          currentSort={sortBy}
          onSortChange={(v) => setSortBy(v as 'time' | 'name')}
          currentView={viewMode}
          onViewChange={setViewMode}
        />
      )}

      {/* Note cards + empty state */}
      <div className="flex-1 min-h-0" style={
        viewMode === 'compact'
          ? { display: 'grid' as const, gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, alignContent: 'start' }
          : viewMode === 'card'
            ? { display: 'flex' as const, flexDirection: 'column' as const, gap: 8 }
            : { display: 'flex' as const, flexDirection: 'column' as const, gap: 4 }
      }>
        {sortedNotes.map((note) => {
          const isSelected = selectedIds.has(note.id)

          // Compact view
          if (viewMode === 'compact') {
            return (
              <motion.div
                key={note.id}
                onClick={() => {
                  if (editMode) toggleSelect(note.id)
                  else setActiveNote(note.id)
                }}
                whileTap={{ scale: 0.96 }}
                style={{
                  background: isSelected ? 'rgba(10,132,255,0.06)' : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 8,
                  textAlign: 'center',
                  borderTop: `2px solid ${note.color}`,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                {editMode ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(note.id) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-quaternary)',
                    }}
                  >
                    {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                ) : (
                  <FileText size={16} color={note.color} style={{ marginBottom: 2 }} />
                )}
                <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.title}
                </span>
                <span style={{ fontSize: 8, color: 'var(--text-quaternary)', marginTop: 2, display: 'block' }}>
                  {new Date(note.createdAt).getMonth() + 1}/{new Date(note.createdAt).getDate()} 创建
                </span>
              </motion.div>
            )
          }

          // Card view (large)
          if (viewMode === 'card') {
            return (
              <motion.div
                key={note.id}
                onClick={() => {
                  if (editMode) toggleSelect(note.id)
                  else setActiveNote(note.id)
                }}
                whileTap={{ scale: 0.98 }}
                className="group"
                style={{
                  background: isSelected ? 'rgba(10,132,255,0.06)' : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  border: isSelected ? '0.5px solid rgba(10,132,255,0.20)' : '0.5px solid rgba(255,255,255,0.04)',
                  borderLeft: `3px solid ${note.color}`,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!editMode) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!editMode) {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
                  }
                }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {editMode ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(note.id) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        color: isSelected ? 'var(--accent-blue)' : 'var(--text-quaternary)',
                        flexShrink: 0, transition: 'color 0.15s ease',
                      }}
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  ) : (
                    <FileText size={14} color={note.color} />
                  )}
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{note.title}</span>
                </div>

                {/* Snippet - 2 lines */}
                {snippets[note.id] && (
                  <div style={{
                    fontSize: 10, color: 'var(--text-quaternary)', marginBottom: 6, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {snippets[note.id]}
                  </div>
                )}

                {/* Bottom row: tags + time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(note.tags ?? []).slice(0, 3).map(tag => <TagBadge key={tag} tag={tag} />)}
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-quaternary)' }}>{formatRelativeDate(note.updatedAt)}更新</span>
                </div>

                {/* More button */}
                {!editMode && (
                  <MoreButton onClick={(e) => {
                    e.stopPropagation()
                    const rect = e.currentTarget.getBoundingClientRect()
                    setContextMenu({ noteId: note.id, rect })
                  }} />
                )}
              </motion.div>
            )
          }

          // List view (default)
          return (
            <motion.div
              key={note.id}
              onClick={() => {
                if (editMode) toggleSelect(note.id)
                else setActiveNote(note.id)
              }}
              whileTap={{ scale: 0.98 }}
              className="group"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: isSelected
                  ? 'rgba(10,132,255,0.06)'
                  : 'var(--bg-secondary)',
                border: isSelected
                  ? '0.5px solid rgba(10,132,255,0.20)'
                  : '0.5px solid rgba(255,255,255,0.04)',
                cursor: 'pointer',
                transition: 'background 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!editMode) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (!editMode) {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
                }
              }}
            >
              {/* Left: checkbox or icon */}
              {editMode ? (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(note.id) }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: isSelected ? 'var(--accent-blue)' : 'var(--text-quaternary)',
                    flexShrink: 0,
                    transition: 'color 0.15s ease',
                  }}
                >
                  {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              ) : (
                <div style={{ flexShrink: 0, color: note.color, display: 'flex' }}>
                  <FileText size={14} color={note.color} />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="truncate"
                  style={{
                    font: 'var(--text-caption-1)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                >
                  {note.title}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-quaternary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {snippets[note.id] ?? ''}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {formatRelativeDate(note.updatedAt)}
                </span>
              </div>

              {/* Tags */}
              {(note.tags ?? []).length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {(note.tags ?? []).slice(0, 3).map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                  {(note.tags ?? []).length > 3 && (
                    <span style={{ fontSize: 10, color: 'var(--text-quaternary)' }}>
                      +{(note.tags ?? []).length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* More button */}
              {!editMode && (
                <MoreButton onClick={(e) => {
                  e.stopPropagation()
                  const rect = e.currentTarget.getBoundingClientRect()
                  setContextMenu({ noteId: note.id, rect })
                }} />
              )}
            </motion.div>
          )
        })}
        {/* Empty state */}
        <AnimatePresence mode="wait">
          {sortedNotes.length === 0 && !editMode && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <FileText size={28} style={{ color: 'var(--text-quaternary)', opacity: 0.4 }} strokeWidth={1.2} />
              <span style={{ font: 'var(--text-caption-1)', color: 'var(--text-quaternary)' }}>
                {activeTag ? '该标签下暂无笔记' : '暂无笔记'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Batch delete action bar */}
      <AnimatePresence>
        {editMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '0.5px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}
          >
            <span style={{ font: 'var(--text-caption-1)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              已选 {selectedIds.size} 项
            </span>
            <Button
              variant="danger"
              motionProps={{ whileTap: { scale: 0.95 } }}
              onClick={handleBatchDelete}
            >
              删除
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除"
        message={deleteTarget?.type === 'batch'
          ? `确定要删除选中的 ${selectedIds.size} 条笔记吗？此操作不可撤销。`
          : '确定要删除这条笔记吗？此操作不可撤销。'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {contextMenu && (
        <ContextMenu
          items={[
            { label: '查看详情', icon: <FileText size={13} />, onClick: () => setActiveNote(contextMenu.noteId) },
            { label: '删除笔记', icon: <Trash2 size={13} />, danger: true, onClick: () => setDeleteTarget({ type: 'single', id: contextMenu.noteId }) },
          ]}
          anchorRect={contextMenu.rect}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
