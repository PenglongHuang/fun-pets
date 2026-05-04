# 苹果风格标题栏 + 灵动岛设计文档

**日期**: 2026-05-04
**状态**: Draft
**范围**: 仅扩展面板模式（expanded）

## 背景

当前扩展面板模式使用完全无边框窗口（`frame: false`），没有任何标题栏或拖拽区域。用户无法移动窗口位置，也无法使用标准窗口控制（最小化/最大化/关闭）。需要设计一个苹果风格的标题栏，集成灵动岛面板指示器，提升窗口操作体验。

## 需求摘要

- 在扩展面板模式顶部添加标题栏，支持拖拽移动窗口
- 标题栏横跨全宽（包括 PanelRouter 和 IconStrip 上方）
- 居中放置灵动岛，显示当前面板信息，悬浮展开可切换面板
- 右侧放置红绿灯按钮（关闭/最小化/最大化）
- 专注计时启动时灵动岛自动切换为倒计时显示
- 倒计时支持暂停和恢复操作
- 移除 IconStrip 顶部宠物头像和底部关闭按钮
- 仅扩展面板模式显示，pet 模式不变

## 不在范围内

- pet 模式的标题栏
- 拖拽灵动岛触发分屏
- 灵动岛长按/右键菜单
- 窗口位置记忆（已有 resize 持久化）

## 设计详情

### 1. 标题栏结构

**位置**: `Sidebar.tsx` 根 div 改为 `flex-col`，标题栏插入在最顶部。

**布局**:
```
Sidebar (flex-col)
├── TitleBar (h-9, flex-none, flex-row, items-center)
│   ├── drag region (flex-1)           — 左侧拖拽区域
│   ├── DynamicIsland (no-drag)        — 居中灵动岛
│   └── TrafficLights (no-drag)        — 右侧红绿灯
└── Content (flex-1, flex-row)         — 现有布局不变
    ├── PanelRouter
    └── IconStrip (无宠物头像, 无关闭按钮)
```

**尺寸**:
- 标题栏高度: 36px (h-9)
- 灵动岛高度: 26px，内嵌在标题栏中
- 红绿灯圆点: 12px 直径，间距 7px
- 底部分隔线: 0.5px solid rgba(255,255,255,0.06)

**拖拽区域**:
- 标题栏容器: `-webkit-app-region: drag`
- 灵动岛: `-webkit-app-region: no-drag`
- 红绿灯: `-webkit-app-region: no-drag`
- 左侧空白区域: 自动成为拖拽区域

**样式**:
- 背景: 与 Sidebar 一致 `rgba(28, 28, 30, 1)`
- 顶部圆角: 16px（继承窗口圆角）
- 无视觉断裂，标题栏是 Sidebar 背景的自然延伸

### 2. 灵动岛 (DynamicIsland)

**默认态（非专注面板或专注空闲）**:

显示当前面板的图标 + 名称 + 4个导航圆点（当前面板对应点高亮）:

```
[图标] [面板名] [● ○ ○ ○]
```

- 背景: `rgba(0, 0, 0, 0.6)`
- 圆角: 18px
- 内边距: 4px 16px
- 当前面板点: `rgba(255,255,255,0.7)`
- 非当前面板点: `rgba(255,255,255,0.2)`

**悬浮展开态**:

鼠标悬浮灵动岛时，展开显示 4 个面板标签（图标 + 名称），当前面板有高亮背景:

```
[📋 计划] [⏱ 专注] [📝 笔记] [⚙ 设置]
```

- 当前面板标签: 背景 `rgba(255,255,255,0.12)`，文字 `rgba(255,255,255,0.85)`，图标 `stroke-width: 2.2`
- 非当前面板标签: 无背景，文字 `rgba(255,255,255,0.4)`，图标较淡
- 标签圆角: 14px
- 标签间距: 2px
- 展开/收起动画: 0.2s cubic-bezier(0.4, 0, 0.2, 1)，宽度平滑过渡

**交互**:
- 点击面板标签 → 调用 `setActivePanel()`，与右侧 IconStrip 双向同步
- 鼠标离开灵动岛 → 收起为默认态
- 面板切换后收起仍显示切换后的面板信息

**面板图标映射**（与 IconStrip 一致）:
| 面板 | 图标 | 名称 |
|------|------|------|
| planner | CalendarDays | 计划 |
| timer | Timer | 专注 |
| notes | FileText | 笔记 |
| settings | Settings | 设置 |

### 3. 灵动岛 — 专注计时状态

当专注面板的计时器启动时，灵动岛内容自动切换，无论当前是否在专注面板。

**计时中**:

```
[●红点] [25:00] [|] [14:32] [⏸]
```

- 红点: 8px，`#ff453a`，带 `box-shadow: 0 0 8px rgba(255,69,58,0.5)` 呼吸效果
- 倒计时: `rgba(255,255,255,0.95)`，13px，font-weight: 700，等宽数字 (tabular-nums)
- 分隔线: 1px，`rgba(255,255,255,0.08)`
- 当前时间: `rgba(255,255,255,0.3)`，10px，等宽数字
- 暂停按钮: 20px 圆形，背景 `rgba(255,255,255,0.1)`，内含暂停图标（两条竖线），始终可见

**已暂停**:

```
[●黄点] [18:42] [|] [14:41] [▶]
```

- 黄点: 8px，`#ff9f0a`，opacity: 0.7（无呼吸效果）
- 倒计时: `rgba(255,255,255,0.7)`（略暗于计时中）
- 播放按钮: 20px 圆形，背景 `rgba(255,255,255,0.1)`，内含三角播放图标

**交互**:
- 点击暂停/播放按钮 → 调用 timerStore 的 toggle 方法
- 如果当前不在专注面板 → 切换到专注面板并执行暂停/播放
- 倒计时和时间从 timerStore 实时读取
- 计时结束后恢复为默认面板指示器模式

### 4. 红绿灯按钮 (TrafficLights)

**位置**: 标题栏最右侧

**按钮顺序**（从左到右）: 关闭(红) → 最小化(黄) → 最大化(绿)

**默认态**: 纯色圆点，无图标
- 关闭: `#ff5f57`，12px
- 最小化: `#febc2e`，12px
- 最大化: `#28c840`，12px
- 间距: 7px

**悬浮态**: 显示细线条 SVG 图标（A 方案）
- 关闭: × 形（两条对角细线），`stroke: rgba(0,0,0,0.35)`，`stroke-width: 1.2`，`stroke-linecap: round`
- 最小化: 水平短线，`stroke: rgba(0,0,0,0.35)`，`stroke-width: 1.2`，`stroke-linecap: round`
- 最大化: 六边形轮廓，`stroke: rgba(0,0,0,0.3)`，`stroke-width: 0.8`，无填充

**单个按钮 hover**: 额外加 `box-shadow: 0 0 0 1.5px rgba(color, 0.4)` 外圈光晕

**行为**:
- 关闭(红): 调用 IPC `window:close` → `mainWindow.close()`
- 最小化(黄): 调用 IPC `window:minimize` → `mainWindow.minimize()`
- 最大化(绿): 调用 IPC `window:maximize` → `mainWindow.maximize()`，全屏最大化

### 5. IconStrip 变更

**移除**:
- 顶部 PetAvatar 组件
- 底部 CloseButton 组件

**保留**:
- 4 个导航图标按钮（Planner / Timer / Notes / Settings）
- active 指示器（蓝色小圆点）
- 分隔线

### 6. 新增组件

| 组件 | 职责 |
|------|------|
| `TitleBar.tsx` | 标题栏容器，布局 drag/no-drag 区域 |
| `DynamicIsland.tsx` | 灵动岛，面板指示器 + 悬浮展开 + 计时状态 |
| `TrafficLights.tsx` | 红绿灯按钮，hover 效果，IPC 调用 |

### 7. 新增 IPC 通道

| 通道 | 方向 | 用途 |
|------|------|------|
| `window:minimize` | renderer → main | 最小化窗口 |
| `window:maximize` | renderer → main | 最大化/还原窗口 |
| `window:close` | renderer → main | 关闭窗口（如果不用 `window.close()`） |

### 8. 涉及文件

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/renderer/src/components/sidebar/TitleBar.tsx` | 新建 | 标题栏容器 |
| `src/renderer/src/components/sidebar/DynamicIsland.tsx` | 新建 | 灵动岛组件 |
| `src/renderer/src/components/sidebar/TrafficLights.tsx` | 新建 | 红绿灯按钮 |
| `src/renderer/src/components/sidebar/Sidebar.tsx` | 修改 | 根布局改为 flex-col，插入 TitleBar |
| `src/renderer/src/components/sidebar/IconStrip.tsx` | 修改 | 移除 PetAvatar 和 CloseButton |
| `src/shared/ipc-channels.ts` | 修改 | 新增 minimize/maximize/close 通道 |
| `src/main/ipc-handlers.ts` | 修改 | 注册新 IPC 处理函数 |
| `src/preload/index.ts` | 修改 | 暴露新 IPC 方法 |
| `src/renderer/src/lib/ipc.ts` | 修改 | 添加类型定义 |
| `src/renderer/src/styles/global.css` | 修改 | 添加标题栏相关 CSS |

### 9. 状态依赖

| 状态 | 来源 | 用途 |
|------|------|------|
| `activePanel` | 现有 store | 灵动岛面板指示器 |
| `isRunning` | timerStore | 判断是否显示计时状态 |
| `timeRemaining` | timerStore | 倒计时显示 |
| `isPaused` | timerStore | 暂停/播放图标切换 |

### 10. 动画与过渡

- 灵动岛展开/收起: `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- 红绿灯图标显示: `transition: opacity 0.15s ease`
- 面板标签高亮: `transition: background 0.15s ease`
- 计时红点呼吸: CSS animation `pulse`，`animation: pulse 1.5s ease-in-out infinite`
- 不使用 layout transition（避免拖拽时性能问题）
