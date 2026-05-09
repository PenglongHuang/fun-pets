# Markdown 图片插入功能设计

## 概述

为计划模块（PlanEditor）和笔记模块（NoteEditor）的 Markdown 编辑器添加图片插入支持。用户可通过剪贴板粘贴、拖拽文件、文件选择器三种方式插入图片，图片就近存储在每篇笔记/计划独立的 `assets/` 目录中。

## 需求决策

| 决策点 | 选择 |
|--------|------|
| 图片来源 | 文件选择器 + 剪贴板粘贴 + 拖拽文件 + 截图（通过粘贴） |
| 存储方式 | 就近存储——每篇笔记/计划独立 assets 目录 |
| 图片优化 | 存原图，预览时按需生成缩略图 |
| 编辑器呈现 | 编辑模式纯文本 Markdown 语法，预览模式渲染图片 |
| 清理策略 | 删除笔记时清 assets 目录；编辑中移除图片语法时删除孤立文件 |
| 架构方案 | IPC 主进程处理——新增图片专用 IPC 通道 |

## 架构

### 数据流

以粘贴图片为例：

```
用户 Ctrl+V → MarkdownEditor onPaste → 提取 Blob → ArrayBuffer
→ IPC image:save → 主进程写入 assets/ → 返回 ./assets/xxx.png
→ 插入 ![图片.png](./assets/xxx.png)
```

### 存储结构

```
funbuddy-workspace/
  notes/
    index.json
    abc123-my-note.md
      assets/          ← 新增，与 .md 同级
        v1a2b3c4.png
        x5y6z7w8.jpg
    def456-another.md
      assets/
  plans/
    index.json
    2026-05/
      09/F9Zo2NRv-daily.md
        assets/
```

图片文件以 `{nanoid(8)}.{ext}` 命名，避免文件名冲突和特殊字符问题。

### IPC 通道

| 通道 | 入参 | 返回 | 说明 |
|------|------|------|------|
| `image:save` | `{ mdFilePath, imageData: ArrayBuffer, fileName? }` | `{ relativePath, fileName }` | 从内存数据保存图片到 assets/ |
| `image:saveFromFile` | `{ mdFilePath, sourcePath }` | `{ relativePath, fileName }` | 从本地路径复制图片到 assets/ |
| `image:pickAndSave` | `{ mdFilePath }` | `{ relativePath, fileName } \| null` | 打开文件选择器 + 保存，一步到位 |
| `image:delete` | `{ mdFilePath, imageFileName }` | `void` | 删除单个图片文件 |
| `image:cleanup` | `{ mdFilePath }` | `void` | 删除整个 assets 目录 |
| `image:readAsDataUrl` | `{ mdFilePath, imageFileName, maxWidth? }` | `{ dataUrl, mimeType }` | 读取图片为 Data URL，支持按需缩放 |

## 编辑器集成

### MarkdownEditor.tsx 改动

**新增 Props：**
- `mdFilePath?: string` — 当前编辑文件的路径，用于定位 assets 目录

**新增事件处理：**
- `onPaste` — 检测 `clipboardData.types` 是否包含 `Files`，提取图片文件
- `onDrop` + `onDragOver` — 过滤 `dataTransfer.files` 中的图片类型

**修改的操作：**
- `insertImage` — 从插入 `![alt](url)` 模板改为调用 `image:pickAndSave` + 插入真实路径

**不变的部分：**
- textarea 本身保持纯文本
- 现有快捷键系统不变
- `applyOperationToTextarea` 不变

### 插入入口详细设计

**剪贴板粘贴 (Ctrl+V)：**
1. 监听 textarea 的 `onPaste` 事件
2. 检查 `clipboardData.types` 包含 `'Files'`
3. 取第一个文件，检查 `file.type.startsWith('image/')`
4. 读取为 ArrayBuffer
5. 调用 `image:save` IPC
6. 在光标位置插入 `![{fileName}](./assets/{nanoid}.png)`

**拖拽文件：**
1. 监听 textarea 的 `onDrop` 事件
2. 从 `dataTransfer.files` 过滤图片类型
3. 支持多张图片批量插入
4. 拖入的文件已有本地路径，调用 `image:saveFromFile` IPC 复制到 assets

**文件选择器：**
1. 通过上下文菜单或快捷键 `Ctrl+Shift+I` 触发
2. 调用 `image:pickAndSave` IPC（主进程内部调用 `dialog.showOpenDialog`）
3. filters: PNG, JPG, GIF, WebP, SVG, BMP
4. 返回路径后插入 Markdown 语法

### 上下文菜单更新

在 MarkdownContextMenu 的 "插入元素" 组中，现有 "图片" 菜单项从插入 `![alt](url)` 模板改为触发文件选择器流程。

### 预览模式图片渲染

`marked` 已原生支持 `![alt](src)` 渲染为 `<img>`。需要：
1. 在 MarkdownPreview 的自定义 marked renderer 中拦截 `image` 方法
2. 将相对路径 `./assets/xxx.png` 通过 `image:readAsDataUrl` IPC 转换为 Data URL
3. 使用 Data URL 而非 `file://` 协议，避免 Electron 安全策略问题

现有 CSS `.markdown-body img { max-width: 100%; border-radius }` 无需改动。

## NoteEditor / PlanEditor 集成

两个编辑器组件需要：
1. 将当前笔记/计划的 `filePath` 作为 `mdFilePath` 传递给 MarkdownEditor
2. 在 SplitPaneLiveEditor 中同样传递（用于 NoteEditor 的 live 模式）

## 图片生命周期管理

### 清理场景

**场景 A：删除笔记/计划**
- 在 noteStore / planStore 的 delete 操作中，调用 `image:cleanup` 删除整个 assets 目录
- 时机：用户确认删除后，与 .md 文件一同清理

**场景 B：编辑中移除图片语法**
- 保存内容时（auto-save 或 Ctrl+S），对比保存前后的图片引用
- 清理检测逻辑：
  1. 用正则 `!/!\[.*?\]\(\.\/assets\/([^)]+)\)/g` 提取 .md 中所有图片引用
  2. 列出 assets/ 目录中的所有文件
  3. 差集 = 目录中有但 .md 中未引用的
  4. 调用 `image:delete` 删除孤立文件

### 缩略图策略

不预存缩略图文件，预览渲染时按需生成：
- `image:readAsDataUrl` 接受 `maxWidth` 参数（默认 800px）
- 使用 `sharp`（Node.js 原生图片处理库）在主进程内存中缩放
- 图片本身小于 maxWidth 时直接返回原图 Data URL
- 需新增依赖：`sharp`

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 图片超过 10MB | Toast 提示 "图片过大，请选择 10MB 以内的图片" |
| 不支持的格式 | 仅接受 `image/*` MIME，非图片类型的粘贴/拖拽静默忽略 |
| assets 目录创建失败 | IPC 返回错误，Toast 提示 "保存图片失败" |
| 图片文件丢失（手动删除） | 预览中显示占位符 + "图片未找到" 文字提示 |
| 磁盘空间不足 | IPC 返回错误，Toast 提示 "磁盘空间不足，无法保存图片" |

## 新增依赖

- `sharp` — Node.js 图片处理库，用于按需缩放生成缩略图

## 涉及文件

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/shared/ipc-channels.ts` | 修改 | 新增 6 个图片 IPC 通道常量 |
| `src/main/ipc-handlers.ts` | 修改 | 新增 6 个 IPC handler 实现 |
| `src/preload/index.ts` | 修改 | 桥接新 IPC 通道 |
| `src/renderer/src/lib/ipc.ts` | 修改 | 新增图片 IPC 调用封装 |
| `src/renderer/src/components/common/MarkdownEditor.tsx` | 修改 | 新增 onPaste/onDrop，mdFilePath prop |
| `src/renderer/src/components/common/MarkdownPreview.tsx` | 修改 | 图片路径 Data URL 转换 |
| `src/renderer/src/components/common/SplitPaneLiveEditor.tsx` | 修改 | 透传 mdFilePath |
| `src/renderer/src/components/ui/MarkdownContextMenu.tsx` | 修改 | 图片菜单项改为触发文件选择器 |
| `src/renderer/src/lib/markdown-operations.ts` | 修改 | insertImage 操作支持真实路径 |
| `src/renderer/src/components/notes/NoteEditor.tsx` | 修改 | 传递 mdFilePath |
| `src/renderer/src/components/planner/PlanEditor.tsx` | 修改 | 传递 mdFilePath |
| `src/renderer/src/stores/noteStore.ts` | 修改 | 删除笔记时调用 image:cleanup |
| `src/renderer/src/stores/planStore.ts` | 修改 | 删除计划时调用 image:cleanup |
| `package.json` | 修改 | 新增 sharp 依赖 |
