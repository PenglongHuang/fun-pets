# Markdown 右键上下文菜单设计规格

**日期**: 2026-05-08
**模块**: 笔记编辑器 (NoteEditor)
**状态**: 已批准

## 1. 目标

在笔记编辑器的所有模式（edit / live / preview）中，支持鼠标左键选中文本 + 鼠标右键弹出 Markdown 快捷操作菜单，提供接近 Obsidian 的操作体验。

**范围**: 仅笔记编辑器（NoteEditor），不包含列表视图、卡片视图、计划模块。

## 2. 当前状态

| 项目 | 现状 |
|------|------|
| 文本选择 | 全局 `user-select: none` 禁止了所有文本选择 |
| 编辑器右键 | `<textarea>` 无 `onContextMenu` 处理器，用户反馈"右键没反应" |
| 菜单系统 | 有可复用的 `ContextMenu.tsx` 组件（动画/定位/危险项分隔线），但不支持子菜单 |
| 编辑器 | 纯 `<textarea>` + `execCommand` 模式，无语法高亮 |

## 3. 架构方案

**方案 A: 增强现有 ContextMenu 组件** — 扩展子菜单能力，新建菜单生成组件和格式化操作库。

### 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| **修改** | `src/renderer/src/components/ui/ContextMenu.tsx` | 增加 submenu / disabled / shortcut 字段支持 |
| **新建** | `src/renderer/src/components/ui/MarkdownContextMenu.tsx` | 编辑器右键菜单组件（生成菜单项） |
| **新建** | `src/renderer/src/hooks/useTextSelection.ts` | textarea 选区检测 hook |
| **新建** | `src/renderer/src/lib/markdown-operations.ts` | 所有 MD 格式化纯函数 |

### 组件关系

```
NoteEditor / PlanEditor
    │
    ├── onContextMenu ──→ MarkdownContextMenu (新建)
    │                        │
    │                        ├──→ ContextMenu (修改: 增加子菜单)
    │                        ├──→ useTextSelection (新建: 选区检测)
    │                        └──→ markdown-operations (新建: 格式化函数)
    │
    └── style={{ userSelect: 'text' }}  ← 覆盖全局 user-select: none
```

## 4. ContextMenu 接口扩展

向后兼容扩展，新增三个可选字段：

```typescript
interface ContextMenuItem {
  // === 原有字段（不变）===
  label: string
  icon?: React.ReactNode
  danger?: boolean
  textColor?: string
  hoverColor?: string
  onClick: () => void

  // === 新增字段 ===
  submenu?: ContextMenuItem[]   // 子菜单项数组
  disabled?: boolean            // 是否禁用（置灰）
  shortcut?: string             // 快捷键展示文本（如 "⌘B"）
}
```

### 子菜单交互行为

- hover 带 `submenu` 的项 → 右侧滑出子菜单（motion 动画，与主菜单一致的入场/退场效果）
- 子菜单定位：父项右侧边缘，垂直对齐父项顶部
- **防溢出**：检测屏幕边界，超出右侧时向左展开；超出底部时向上翻转
- 同时只展开一个子菜单，鼠标移开即关闭
- `disabled` 项：文字颜色变暗（`rgba(255,255,255,0.3)`），不响应 hover/click
- `shortcut` 显示在项的右侧，灰色小字（`font-size: 10px`, `color: #555`）

### 分组标题

菜单项数组中插入特殊项作为分组标题：

```typescript
{ label: '基础编辑', isGroupHeader: true }
// 后续普通项属于该组，组间自动渲染分隔线
```

## 5. 菜单结构

### 5.1 编辑模式（edit / live）— 完整菜单

```
┌─────────────────────────┐
│  基础编辑                │  ← 组标题（灰色小字大写）
├─────────────────────────┤
│ 📋 复制              ⌘C │
│ 📎 粘贴              ⌘V │
│ ✂️ 剪切              ⌘X │
│ 🔄 全选              ⌘A │
├─────────────────────────┤
│  文本格式              ▸ │  ← 子菜单
├─────────────────────────┤
│  段落样式              ▸ │  ← 子菜单
├─────────────────────────┤
│  插入元素              ▸ │  ← 子菜单
└─────────────────────────┘
```

#### 文本格式子菜单

| 项 | 标记符 | 快捷键 | Toggle 规则 |
|----|--------|--------|------------|
| 加粗 | `**text**` | ⌘B | 检测外层 `**`，有则移除，无则添加 |
| 斜体 | `*text*` | ⌘I | 同上 |
| 删除线 | `~~text~~` | — | 同上 |
| 高亮 | `==text==` | — | 同上 |

#### 段落样式子菜单

| 项 | 标记规则 | 特殊行为 |
|----|---------|---------|
| 标题 1 | 行首 `# ` | 循环升级：无 → H1 → H2 → ... → H6 → 无 |
| 标题 2 | 行首 `## ` | 同上 |
| 标题 3 | 行首 `### ` | 同上 |
| 标题 4 | 行首 `#### ` | 同上 |
| 标题 5 | 行首 `##### ` | 同上 |
| 标题 6 | 行首 `###### ` | 同上 |
| 引用块 | 行首 `> ` | toggle：有则移除行首 `> `，无则添加 |
| 无序列表 | 行首 `- ` | toggle |
| 有序列表 | 行首 `1. ` | toggle |
| 任务列表 | 行首 `- [ ] ` | toggle |

#### 插入元素子菜单

| 项 | 插入内容 | 说明 |
|----|---------|------|
| 超链接 | `[selected](url)` | 选中文字包裹为链接；未选中则插入 `[text](url)` 并选中 `text` |
| 表格 | `\| col \| \|\n\| --- \| \|\n\|   \| \|` | 在光标处插入表格模板 |
| 分割线 | `\n---\n` | 新建一行插入分割线 |
| 图片 | `![alt](url)` | 插入图片语法并选中 `alt` |
| 代码块 | ```\n```\ncode\n```\n``` | 选中内容包裹为代码块；未选中则插入空代码块模板 |

### 5.2 预览模式（preview）— 只读精简菜单

```
┌───────────────────────┐
│ 📋 复制               │
│ 📄 复制为 Markdown     │
│ </> 复制 HTML          │
└───────────────────────┘
```

- **复制**: 使用 `window.getSelection()` + `clipboard.writeText()`
- **复制为 Markdown**: 从 store 获取原始 markdown 内容，复制到剪贴板
- **复制 HTML**: 从渲染后的 DOM 获取选中内容的 `innerHTML`

## 6. 智能上下文规则

根据当前状态动态调整菜单项可用性：

| 条件 | 效果 |
|------|------|
| 无选中文本 | "粘贴" 可用（如果剪贴板非空）；格式化/插入操作禁用 |
| 有选中文本 | 所有操作可用；"复制"/"剪切" 高亮 |
| 选中内容是链接 `[text](url)` | "超链接" → "编辑链接"，自动提取 URL 到输入框 |
| 选中内容在代码块内 | 优先显示代码相关操作 |
| 剪贴板为空 | "粘贴" 禁用 |
| 光标在空行 | 段落样式操作仍可用（作用于当前行） |

## 7. useTextSelection Hook

```typescript
interface TextSelectionState {
  selectedText: string        // 当前选中内容
  selection: { start: number; end: number }  // textarea 选区位置
  hasSelection: boolean       // 是否有选中
  currentLine: string         // 光标所在行完整文本
  lineIndex: number           // 行号（从 0 开始）
}

function useTextSelection(textareaRef: RefObject<HTMLTextAreaElement>): TextSelectionState
```

**实现细节**:
- 监听事件: `select`, `keyup`, `mouseup`, `focus`
- 使用 `requestAnimationFrame` 节流更新（避免高频触发）
- 通过 `textarea.selectionStart/End` 获取选区
- 通过 `value.substring(lineStart, lineEnd)` 获取当前行
- 组件卸载时自动清理所有监听器

## 8. markdown-operations 格式化函数

所有操作都是**纯函数**，接收文本和选区，返回新文本和新选区：

```typescript
interface OperationResult {
  text: string       // 操作后的完整文本
  start: number      // 新选区起始位置
  end: number        // 新选区结束位置
}

type MarkdownOperation = (text: string, start: number, end: number) => OperationResult
```

### 三种操作类型

**类型 A: 包裹型（wrap）** — 加粗、斜体、删除线、高亮、行内代码

Toggle 逻辑：
1. 检查选区前后是否已有对应标记符
2. 有 → 移除标记符（取消格式化）
3. 无 → 添加标记符（应用格式化）
4. 操作后选区保持在原始文本上（不含标记符）

**类型 B: 行首插入（linePrefix）** — H1-H6、引用、有序/无序/任务列表

- 定位当前行的起始位置
- 检测行首是否已有该前缀 → toggle 移除/添加
- 标题特殊处理：循环升级级别（无 → # → ## → ... → ###### → 无）

**类型 C: 块级插入（block）** — 代码块、表格、分割线、图片、链接

- 在光标位置或选区周围插入块级结构
- 代码块/表格等需要多行模板
- 图片/链接使用选中文字作为显示文本

### 函数导出列表

```typescript
// 包裹型
export const wrapBold: MarkdownOperation
export const wrapItalic: MarkdownOperation
export const wrapStrikethrough: MarkdownOperation
export const wrapHighlight: MarkdownOperation
export const wrapInlineCode: MarkdownOperation

// 行首插入型
export const toggleHeading: (level: 1|2|3|4|5|6) => MarkdownOperation
export const toggleBlockquote: MarkdownOperation
export const toggleUnorderedList: MarkdownOperation
export const toggleOrderedList: MarkdownOperation
export const toggleTaskList: MarkdownOperation

// 块级插入型
export const insertLink: MarkdownOperation
export const insertTable: MarkdownOperation
export const insertHorizontalRule: MarkdownOperation
export const insertImage: MarkdownOperation
export const insertCodeBlock: MarkdownOperation

// 基础编辑
export const copyToClipboard: (text: string) => Promise<void>
export const pasteFromClipboard: () => Promise<string>
```

## 9. 编辑器集成

### 9.1 MarkdownEditor.tsx 改动

```tsx
<textarea
  // 现有 props 不变...
  onContextMenu={(e) => {
    e.preventDefault()
    showMarkdownContextMenu(e, { /* menu config */ })
  }}
  style={{ userSelect: 'text' }}  // 覆盖全局 user-select: none
/>
```

- `onContextMenu`: 阻止浏览器默认菜单，显示自定义 MarkdownContextMenu
- `userSelect: 'text'`: 允许在 textarea 内选中文本
- 菜单通过 Portal 渲染到 body 层级，避免被 overflow 裁剪

### 9.2 NoteEditor.tsx 改动

**edit/live 模式**: MarkdownEditor 自带右键菜单，无需额外改动。

**preview 模式**: 在 MarkdownPreview 外层容器添加：
```tsx
<div
  onContextMenu={(e) => {
    e.preventDefault()
    showPreviewContextMenu(e)
  }}
  style={{ userSelect: 'text' }}
>
  <MarkdownPreview content={content} />
</div>
```

### 9.3 执行流程

```
用户右键 textarea
    ↓
onContextMenu(e) → e.preventDefault()
    ↓
useTextSelection 获取当前选区状态
    ↓
根据模式(edit/live/preview)和选区状态生成菜单项
    ↓
ContextMenu 渲染（Portal 到 body）
    ↓
用户点击菜单项
    ↓
markdown-operations.xxx(text, start, end) → { newText, newStart, newEnd }
    ↓
document.execCommand('selectAll')  // 选中全部
document.execCommand('insertText', false, newText)  // 替换（保留 undo 栈）
textarea.setSelectionRange(newStart, newEnd)  // 恢复选区
onChange 触发 → 内容更新 → 自动保存
```

## 10. 边界情况

### 必须处理

| 场景 | 处理方式 |
|------|---------|
| 菜单超出屏幕右边缘 | 子菜单向左展开 |
| 菜单超出屏幕底边缘 | 菜单向上翻转（锚点改为上方） |
| textarea 失焦时菜单消失 | 使用 Portal 渲染到 body；mousedown 关闭判断排除菜单自身 |
| 多行选中时行首操作 | 对选区内的每一行应用行首前缀 |
| 已有标记符嵌套 | 检测最外层标记符，避免 `**bold**text**` 类错误 |
| 选中文本跨多个段落 | 包裹型操作正常工作；行首操作作用于涉及的所有行 |
| execCommand 不可用降级 | 直接设置 `textarea.value` + 手动触发 onChange |

### 明确不做（后续迭代）

- 键盘方向键导航菜单项
- 菜单项搜索/过滤
- 自定义快捷键绑定面板
- 撤销/重做栈管理（依赖浏览器原生 undo 栈 via execCommand）
- 列表视图 / 卡片视图 / 日历视图的右键菜单
- 计划模块 PlanEditor 的集成（后续复用相同组件）

## 11. 设计约束

- **风格一致性**: 菜单必须匹配现有玻璃态暗色设计（`rgba(58,58,60,0.98)` 背景 + `backdrop-filter` + motion 动画）
- **性能**: 格式化操作必须在 16ms 内完成（纯函数保证）
- **无外部依赖**: 不引入新的 npm 包，复用现有 lucide-react 图标
- **向后兼容**: ContextMenu 扩展不破坏现有使用者（PlanCard、NoteCard、TagFilterBar 的菜单不受影响）
