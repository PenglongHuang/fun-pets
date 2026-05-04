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

## 设计详情

### 1. 窗口管理层变更

**文件**: `src/main/window.ts`

- expanded 模式：`resizable: true`
- 最小尺寸：480×500
- 窗口锚定行为：
  - 宽度变化：右边缘对齐屏幕右边缘，左边缘移动
  - 高度变化：垂直居中，上下等量扩展/收缩
- expand 操作：恢复用户上次保存的宽高（非固定 480×680）
- collapse 操作：记住当前 expanded 窗口尺寸，存入 electron-store
- 窗口 resize 时：主进程监听 `will-resize` 或 `resize` 事件，重新计算位置保持锚定

**尺寸持久化**:
- 使用现有 electron-store 存储 expanded 模式的 `{ width, height }`
- 首次使用（无存储值）回退到默认 480×680

### 2. 内容区响应式基础

**容器查询上下文**:
- 在 `Sidebar.tsx` 内容区外层设置 `container-type: inline-size`
- 子组件使用 `cqw`（容器宽度百分比）单位做响应式尺寸

**字体缩放规则**:
| 元素 | 当前值 | 响应式值 |
|------|--------|----------|
| 面板标题 | 22px | `clamp(22px, 5cqw, 34px)` |
| 正文 | 15px | 15px（不变） |
| 次要文本/标签 | 12px | `clamp(12px, 3cqw, 14px)` |

**间距缩放规则**:
| 属性 | 当前值 | 响应式值 |
|------|--------|----------|
| GlassPanel 内边距 | 20px | `clamp(16px, 4cqw, 32px)` |
| 卡片间距 | 8px | `clamp(8px, 2cqw, 16px)` |

**多列排列**:
- 使用 `display: grid; grid-template-columns: repeat(auto-fill, minmax(Xpx, 1fr))` 实现自动换行
- 各面板设定不同的卡片最小宽度
- 图标栏（72px）保持固定宽度，不参与缩放

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
- 笔记列表：`grid auto-fill, minmax(180px, 1fr)`
- 笔记编辑区：宽度自然加宽，保持阅读体验
- 标签栏：保持单行横排

#### 设置面板（SettingsPanel）
- 保持单列布局
- 宽度增大时设置项左右等量留白（`max-width` + `margin: auto`）
- 设置项内部可适度拉伸

#### GlassPanel
- 内边距从固定 20px 改为 `clamp(16px, 4cqw, 32px)`

### 4. 过渡动画

- Grid 布局重排：`transition: all 0.3s ease`
- 字体和间距 clamp() 变化：天然连续，无需额外处理
- 不添加 resize 动画延迟，避免拖拽时「跟手慢」

### 5. 技术实现路径

1. **渲染进程**：Sidebar.tsx 内容区加 `container-type: inline-size`，子组件用 cqw 单位
2. **Grid auto-fill**：各面板列表区域使用 CSS Grid auto-fill
3. **主进程**：监听窗口 resize，保持右边缘锚定和垂直居中
4. **尺寸持久化**：electron-store 保存 expanded 模式宽高

### 6. 不引入的技术

- CSS 媒体查询（容器查询更精确）
- JS 响应式 hook（不需要监听宽度）
- 第三方响应式库

## 涉及文件

- `src/main/window.ts` — 窗口 resizable、锚定逻辑、尺寸持久化
- `src/renderer/src/components/sidebar/Sidebar.tsx` — 容器查询上下文
- `src/renderer/src/components/common/GlassPanel.tsx` — 响应式内边距
- `src/renderer/src/components/planner/PlannerPanel.tsx` — 计划卡片 grid
- `src/renderer/src/components/timer/TimerPanel.tsx` — 计时器居中
- `src/renderer/src/components/notes/NotesPanel.tsx` — 笔记卡片 grid
- `src/renderer/src/components/settings/SettingsPanel.tsx` — 单列居中
- `src/renderer/src/styles/global.css` — 响应式 CSS 变量（如需要）
- `src/preload/index.ts` — 新增 IPC 暴露（如需要尺寸存取）
