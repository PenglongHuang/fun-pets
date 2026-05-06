# 响应式布局设计文档

**日期**: 2026-05-04
**状态**: Draft
**方案**: A — 连续流式响应

## 背景

当前面板模式（expanded）窗口固定 480×680，锚定屏幕右侧。用户希望支持自由拖拽调整窗口大小，内容区自动适配，保证字体、样式和交互的美学品质。

## 需求摘要

- 仅面板模式（expanded）支持拖拽调整宽高，pet 模式不变
- 窗口保持右侧锚定：宽度变化时左边缘向左/右移动，右边缘固定；高度变化时垂直居中
- 最小尺寸 480×500，无上限（可拉满屏幕）
- 内容区使用连续流式自适应，无离散断点
- 各面板内容（卡片、列表、编辑区）随宽度自动多列排列
- 字体和间距通过 CSS clamp() 平滑缩放
- 窗口尺寸持久化，下次展开恢复

## 不在范围内

- pet 模式的响应式
- 多面板同时显示（分栏）
- 离散步点切换
- 第三方响应式库引入
- 窗口最大化（不设置 `maximizable`，用户通过拖拽调整尺寸）

## 设计详情

### 1. 窗口管理层变更

**文件**: `src/main/window.ts`

#### resizable 切换

窗口创建时 `resizable: false`（pet 模式）。模式切换时动态修改：

- `expandToPanelMode()`：调用 `mainWindow.setResizable(true)` + `mainWindow.setMinimumSize(480, 500)`
- `collapseToPetMode()`：调用 `mainWindow.setResizable(false)` + 恢复 pet 模式尺寸

#### 窗口锚定行为

用户可以从任意边缘拖拽调整窗口。主进程通过 `resize` 事件后重新定位来保持锚定：

- 监听 `mainWindow.on('resize', ...)` 事件
- resize 回调中：获取当前 bounds，计算屏幕右边缘位置，将窗口 x 设为 `screenRight - width`，y 保持垂直居中（`screenCenterY - height/2`）
- **注意**：这会导致轻微的视觉抖动（用户拖右边缘时窗口先跟手，再被弹回右边缘），属于已知权衡。如果抖动明显，后续可考虑限制只能从左侧和上下边缘拖拽（通过自定义 resize handle 实现）。

#### 尺寸持久化

- 在 `src/shared/store-schema.ts` 的 `StoreSchema` 中新增字段：`window.expandedSize: { width: number, height: number }`
- 保存时机：仅 collapse 时保存（避免拖拽过程中频繁写磁盘）
- 默认值：`{ width: 480, height: 680 }`
- `expandToPanelMode()` 读取存储值恢复尺寸

#### 多显示器

窗口 resize 锚定逻辑使用 `getTargetDisplay()` 获取当前显示器，锚定计算基于当前显示器的 workArea，已在现有代码中处理。

### 2. 内容区响应式基础

#### 容器查询上下文

**位置**：在 `PanelRouter.tsx` 的外层 `div`（当前有 `className="flex-1 overflow-hidden" style={{ minWidth: 280 }}`）上设置 `container-type: inline-size`。

**注意**：不能设在 `Sidebar.tsx` 的根元素上，因为根元素包含 72px 图标栏，会导致 cqw 单位计算不正确。容器查询上下文只应包含面板内容区。

**现有 min-width**：`Sidebar.tsx` 的 `minWidth: 360` 和 `PanelRouter.tsx` 的 `minWidth: 280` 保持不变作为 CSS 安全网。在 480px 最小窗口宽度下，内容区约 407px（480 - 72 - 1），两个 min-width 都不会触发。

#### 字体缩放规则

缩放目标是让标题在大宽度下更有气势，正文保持可读性。

| 元素 | 当前值 | 响应式值 | 说明 |
|------|--------|----------|------|
| 面板标题 | 22px | `clamp(22px, 4.5cqw, 32px)` | 内容区 ~407px 时 ≈18px（clamp 到 22），~1200px 时 ≈54px（clamp 到 32） |
| 正文 | 15px | 15px（不变） | 正文尺寸固定，保证阅读舒适 |
| 次要文本/标签 | 12px | `clamp(12px, 2.5cqw, 15px)` | 轻微增长，大宽度时更易读 |

注意：clamp 的中间值（cqw 百分比）仅在特定宽度范围内生效，超出范围后被 min/max 截断。这意味着缩放是渐进的、有限的，避免极端尺寸。

#### 间距缩放规则

| 属性 | 当前值 | 响应式值 |
|------|--------|----------|
| GlassPanel 内边距 | 20px | `clamp(16px, 4cqw, 32px)` |
| 卡片间距 | 8px | `clamp(8px, 2cqw, 16px)` |

#### 多列排列

- 使用 `display: grid; grid-template-columns: repeat(auto-fill, minmax(Xpx, 1fr))` 实现自动换行
- 各面板设定不同的卡片最小宽度
- 图标栏（72px）保持固定宽度，不参与缩放。这是有意的设计决策：图标栏始终是极简导航条，即使窗口很宽也保持紧凑，与内容区的扩展形成对比。

### 3. 各面板适配策略

#### 计划面板（PlannerPanel）
- 日期选择器：保持单行横排，日期格子等宽拉伸
- 计划卡片：`grid auto-fill, minmax(200px, 1fr)`，自动换行多列
- 卡片内部布局不变，只影响外部排列

#### 专注面板（TimerPanel）
- 计时器圆环：固定尺寸 ~200px，水平垂直居中
- 宽度增大时圆环两侧自然留白
- 历史记录：如有列表项，同样 grid auto-fill 换行

#### 笔记面板（NotesPanel）
- 当前笔记以纵向列表形式展示（非卡片网格），每项包含标题、内容预览、标签等
- 宽度增大时列表项自然加宽，不强制转为网格卡片（列表形式更适合笔记的快速浏览）
- 如果未来有卡片视图需求，可后续迭代
- 笔记编辑区：宽度自然加宽，保持阅读体验
- 标签栏：保持单行横排

#### 设置面板（SettingsPanel）
- 保持单列布局
- 宽度增大时设置项左右等量留白（`max-width` + `margin: auto`）
- 设置项内部可适度拉伸

#### GlassPanel
- 内边距从固定 20px 改为 `clamp(16px, 4cqw, 32px)`

### 4. 过渡动画

- **不使用** `transition: all 0.3s ease`，因为对 grid 布局重排施加 transition 会导致拖拽过程中严重卡顿
- Grid auto-fill 的列数变化（换行/重排）不添加过渡动画，让浏览器自然重排
- 字体和间距的 clamp() 变化天然连续，无需额外处理
- 如果需要，可为卡片出现/消失添加 `opacity` 过渡（不影响布局性能）

### 5. 技术实现路径

1. **渲染进程**：`PanelRouter.tsx` 外层 div 加 `container-type: inline-size`，子组件用 cqw 单位
2. **Grid auto-fill**：计划面板的列表区域使用 CSS Grid auto-fill（笔记保持列表形式）
3. **主进程**：监听窗口 `resize` 事件，重新计算位置保持锚定和居中
4. **尺寸持久化**：StoreSchema 新增 `window.expandedSize`，collapse 时保存

### 6. 不引入的技术

- CSS 媒体查询（容器查询更精确）
- JS 响应式 hook（不需要监听宽度）
- 第三方响应式库

## 涉及文件

- `src/main/window.ts` — 窗口 resizable 切换、resize 锚定、尺寸持久化
- `src/shared/store-schema.ts` — 新增 `window.expandedSize` 字段
- `src/renderer/src/components/sidebar/PanelRouter.tsx` — 容器查询上下文
- `src/renderer/src/components/common/GlassPanel.tsx` — 响应式内边距
- `src/renderer/src/components/planner/PlannerPanel.tsx` — 计划卡片 grid
- `src/renderer/src/components/timer/TimerPanel.tsx` — 计时器居中
- `src/renderer/src/components/notes/NotesPanel.tsx` — 列表项自适应宽度
- `src/renderer/src/components/settings/SettingsPanel.tsx` — 单列居中 max-width
- `src/renderer/src/styles/global.css` — 响应式 CSS 变量（如需要）
- `src/preload/index.ts` — 新增 IPC 暴露（如需要尺寸存取）
