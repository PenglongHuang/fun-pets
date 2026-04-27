# FunPets 桌面萌宠办公助手

<p align="center">
  <strong>一只住在桌面上的萌宠，陪你专注工作、管理计划、记录灵感</strong>
</p>

<p align="center">
  <a href="#功能特性">功能</a> &bull;
  <a href="#技术栈">技术栈</a> &bull;
  <a href="#快速开始">快速开始</a> &bull;
  <a href="#开发指南">开发</a> &bull;
  <a href="#项目结构">结构</a> &bull;
  <a href="#license">License</a>
</p>

---

## 功能特性

### 萌宠陪伴

- 星星造型宠物，支持多种动画状态（开心、专注、困倦）
- 鼠标悬停互动动画（旋转、弹跳、思考气泡）
- 自动眨眼周期，点击触发状态变化
- 可拖拽定位，常驻桌面右侧

### 番茄钟专注

- SVG 环形进度条显示剩余时间
- 专注 / 短休息 / 长休息三阶段自动切换
- 完成时触发宠物庆祝动画 + 彩纸特效
- 今日统计：完成轮数与累计专注分钟数
- 支持后台运行，跨重启状态自动恢复

### 计划日历

- Markdown 格式计划文档，支持日期范围定义
- 列表视图：计划卡片预览与快速编辑
- 日历视图：彩色圆点标记每日/周/月计划覆盖
- 自动颜色分类（蓝色=日计划、紫色=周计划、琥珀色=月计划）

### Markdown 笔记

- 笔记列表 + 编辑器双栏布局
- 编辑模式与实时预览一键切换
- 自动分配颜色标签，便于视觉区分

### 快速捕获

- 全局快捷键 `Ctrl+Shift+N` 呼出浮动输入框
- 一闪念即可保存为笔记，不打断工作流

### 设置面板

- 存储目录自定义选择
- 番茄钟参数调节（时长、休息间隔、轮次）
- 开机自启动 / 关闭最小化到系统托盘
- 数据导出与清理

---

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 桌面框架 | [Electron](https://www.electronjs.org/) 36 | 透明窗口、系统托盘、原生 API |
| 前端框架 | [React](https://react.dev/) 19 + TypeScript | 组件化 UI |
| 样式方案 | [Tailwind CSS](https://tailwindcss.com/) 4 | 毛玻璃风格设计系统 |
| 图标库 | [Lucide React](https://lucide.dev/guides/languages/introduction-to-lucide-react) | 全局统一图标 |
| 动画引擎 | [Motion](https://motion.dev/) (Framer Motion) | 面板形变、弹性过渡 |
| 状态管理 | [Zustand](https://zustand.docs.pmnd.rs/) + [Immer](https://immerjs.github.io/immer/) | 轻量响应式状态 |
| 数据持久化 | [electron-store](https://github.com/sindresorhus/electron-store) | 设置与应用状态 |
| 文件存储 | Node.js fs | 计划与笔记 (.md) |
| Markdown 渲染 | [marked](https://marked.js.org/) | 笔记/计划预览 |
| 构建工具 | [electron-vite](https://electron-vite.org/) | 三进程构建 + HMR |
| 打包分发 | [electron-builder](https://www.electron.build/) | NSIS Windows 安装包 |

---

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9
- Windows 10/11（当前仅支持 Windows）

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/PenglongHuang/fun-pets.git
cd fun-pets

# 安装依赖
npm install

# 启动开发模式
npm run dev

# 构建生产版本
npm run build

# 打包 Windows 安装程序
npm run build:win
```

---

## 开发指南

### 项目架构

FunPets 采用 Electron 三层架构：

```
系统层 (Electron Main Process)
  ├── 窗口管理（透明、无边框、置顶）
  ├── 系统托盘 + 全局快捷键
  ├── IPC 处理器注册
  └── 文件 I/O（plans/*.md, notes/*.md）
       │
IPC Bridge (contextBridge)
       │
UI 层 (React Renderer)
  ├── 侧边栏容器（萌宠 + 图标导航）
  ├── 功能面板（计划、番茄钟、笔记、设置）
  └── 共享组件（GlassPanel、动画、彩纸）
       │
数据层 (Zustand + Storage)
  ├── electron-store JSON（设置、应用状态、计时器）
  └── 文件系统（用户目录下的 plans/, notes/）
```

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（HMR 热更新） |
| `npm run build` | 构建生产版本到 `out/` |
| `npm run preview` | 预览生产构建 |
| `npm run build:win` | 构建 + 打包 Windows 安装程序 |

### 设计规范

- UI 风格参考 Apple HIG (Human Interface Guidelines)
- 毛玻璃效果 (Glassmorphism) 主题
- 深色模式默认配色
- 所有文本为中文界面

---

## 项目结构

```
fun-pets/
├── resources/                  # 应用资源
│   └── icon.svg               # 应用图标
├── src/
│   ├── main/                  # Electron 主进程
│   │   ├── index.ts           # 应用生命周期、单实例锁
│   │   ├── window.ts          # 透明窗口管理
│   │   ├── tray.ts            # 系统托盘
│   │   ├── ipc-handlers.ts    # IPC 处理器注册
│   │   ├── store.ts           # electron-store 初始化
│   │   └── hotkey.ts          # 全局快捷键
│   ├── preload/               # 预加载脚本
│   │   ├── index.ts           # contextBridge API 桥接
│   │   └── index.d.ts         # 类型声明
│   ├── renderer/              # React 渲染进程
│   │   ├── index.html
│   │   └── src/
│   │       ├── App.tsx        # 根组件（含快速捕获）
│   │       ├── main.tsx       # 入口
│   │       ├── styles/global.css  # 设计系统 + 动画
│   │       ├── components/    # UI 组件
│   │       │   ├── pet/       # 萌宠相关
│   │       │   ├── planner/   # 计划面板
│   │       │   ├── timer/     # 番茄钟面板
│   │       │   ├── notes/     # 笔记面板
│   │       │   ├── settings/  # 设置面板
│   │       │   ├── sidebar/   # 侧边栏导航
│   │       │   └── common/    # 共享组件
│   │       ├── stores/        # Zustand 状态管理
│   │       ├── hooks/         # 自定义 Hooks
│   │       ├── lib/           # 工具库
│   │       └── types/         # TypeScript 类型定义
│   └── shared/                # 主进程/渲染进程共享
│       ├── ipc-channels.ts    # IPC 通道常量
│       └── store-schema.ts    # 数据模型定义
├── electron.vite.config.ts    # electron-vite 配置
├── electron-builder.yml       # 打包配置
├── package.json
├── tsconfig.json              # TypeScript 项目引用配置
├── tsconfig.node.json         # 主进程/预加载 TS 配置
├── tsconfig.web.json          # 渲染进程 TS 配置
└── .npmrc                     # npm 镜像配置
```

---

## Contributing

欢迎贡献！请遵循以下流程：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 提交 Pull Request

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

| 类型 | 说明 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | Bug 修复 |
| `docs:` | 文档更新 |
| `style:` | 代码格式调整 |
| `refactor:` | 重构 |
| `chore:` | 构建/工具变更 |

---

## License

本项目采用 [Apache License 2.0](LICENSE) 开源。

```
Copyright 2026 Penglong Huang

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

# FunPets - Desktop Pet Office Assistant

<p align="center">
  <strong>A cute desktop pet that keeps you focused, organized, and inspired</strong>
</p>

<p align="center">
  <a href="#features">Features</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#development">Development</a> &bull;
  <a href="#project-structure">Structure</a> &bull;
  <a href="#license">License</a>
</p>

---

## Features

### Desktop Pet Companion

- Adorable star-shaped pet with multiple animation states (happy, focus, sleepy)
- Hover interaction animations (spin, bounce, thought bubble)
- Auto-blink cycle, click-triggered state changes
- Draggable positioning, always on desktop right edge

### Pomodoro Timer

- SVG circular progress ring with phase display
- Focus / Short Break / Long Break phases with auto-transition
- Pet celebration animation + confetti on completion
- Today's stats: completed rounds & total focus minutes
- Background execution with cross-restart state recovery

### Planner & Calendar

- Markdown plan documents with date range support
- List view with plan card previews and quick editing
- Calendar view with colored dots for daily/weekly/monthly coverage
- Auto color classification (blue=daily, purple=weekly, amber=monthly)

### Markdown Notes

- Note list + editor dual-pane layout
- Toggle between edit mode and live preview
- Auto-assigned color tags for visual distinction

### Quick Capture

- Global hotkey `Ctrl+Shift+N` opens a floating input window
- Capture fleeting thoughts as notes without breaking your workflow

### Settings Panel

- Customizable storage directory
- Adjustable pomodoro parameters (duration, breaks, rounds)
- Auto-start on boot / minimize-to-tray on close
- Data export and cleanup options

---

## Tech Stack

| Layer | Technology | Purpose |
|------|------------|---------|
| Desktop Framework | [Electron](https://www.electronjs.org/) 36 | Transparent windows, tray, native APIs |
| Frontend | [React](https://react.dev/) 19 + TypeScript | Component-based UI |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4 | Glassmorphism design system |
| Icons | [Lucide React](https://lucide.dev/guides/languages/introduction-to-lucide-react) | Unified icon set throughout |
| Animation | [Motion](https://motion.dev/) (Framer Motion) | Panel morphing, spring transitions |
| State Management | [Zustand](https://zustand.docs.pmnd.rs/) + [Immer](https://immerjs.github.io/immer/) | Lightweight reactive state |
| Persistence (JSON) | [electron-store](https://github.com/sindresorhus/electron-store) | Settings, app state, timer |
| Persistence (files) | Node.js fs | Plans and notes as .md files |
| Markdown Rendering | [marked](https://marked.js.org/) | Note/plan preview |
| Build Tool | [electron-vite](https://electron-vite.org/) | Three-process build with HMR |
| Packaging | [electron-builder](https://www.electron.build/) | NSIS Windows installer |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- Windows 10/11 (Windows-only for now)

### Installation

```bash
# Clone the repository
git clone https://github.com/PenglongHuang/fun-pets.git
cd fun-pets

# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Package Windows installer
npm run build:win
```

---

## Development

### Architecture

FunPets uses Electron's three-layer architecture:

```
System Layer (Electron Main Process)
  ├── Window management (transparent, frameless, always-on-top)
  ├── System tray + global hotkeys
  ├── IPC handler registration
  └── File I/O (plans/*.md, notes/*.md)
       │
IPC Bridge (contextBridge)
       │
UI Layer (React Renderer)
  ├── Sidebar container (pet + icon navigation)
  ├── Feature panels (planner, timer, notes, settings)
  └── Shared components (GlassPanel, animations, confetti)
       │
Data Layer (Zustand + Storage)
  ├── electron-store JSON (settings, app state, timer)
  └── File system (user's plans/, notes/)
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build production version to `out/` |
| `npm run preview` | Preview production build |
| `npm run build:win` | Build + package Windows installer |

### Design Language

- Inspired by Apple HIG (Human Interface Guidelines)
- Glassmorphism theme with vibrancy effects
- Dark mode default color palette
- Chinese language UI (primary locale)

---

## Project Structure

```
fun-pets/
├── resources/                  # App resources
│   └── icon.svg               # App icon
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts           # App lifecycle, single instance lock
│   │   ├── window.ts          # Transparent window management
│   │   ├── tray.ts            # System tray
│   │   ├── ipc-handlers.ts    # IPC handler registration
│   │   ├── store.ts           # electron-store initialization
│   │   └── hotkey.ts          # Global hotkeys
│   ├── preload/               # Preload scripts
│   │   ├── index.ts           # contextBridge API bridge
│   │   └── index.d.ts         # Type declarations
│   ├── renderer/              # React renderer process
│   │   ├── index.html
│   │   └── src/
│   │       ├── App.tsx        # Root component (includes quick capture)
│   │       ├── main.tsx       # Entry point
│   │       ├── styles/global.css  # Design system + animations
│   │       ├── components/    # UI components
│   │       │   ├── pet/       # Pet components
│   │       │   ├── planner/   # Planner panel
│   │       │   ├── timer/     # Timer panel
│   │       │   ├── notes/     # Notes panel
│   │       │   ├── settings/  # Settings panel
│   │       │   ├── sidebar/   # Sidebar navigation
│   │       │   └── common/    # Shared components
│   │       ├── stores/        # Zustand state management
│   │       ├── hooks/         # Custom hooks
│   │       ├── lib/           # Utility libraries
│   │       └── types/         # TypeScript type definitions
│   └── shared/                # Shared between processes
│       ├── ipc-channels.ts    # IPC channel constants
│       └── store-schema.ts    # Data model definitions
├── electron.vite.config.ts    # electron-vite configuration
├── electron-builder.yml       # Packaging configuration
├── package.json
├── tsconfig.json              # TypeScript project references
├── tsconfig.node.json         # Main/preload TS config
├── tsconfig.web.json          # Renderer TS config
└── .npmrc                     # npm mirror config (China CDN)
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation update |
| `style:` | Code formatting |
| `refactor:` | Code refactoring |
| `chore:` | Build/tooling changes |

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).

```
Copyright 2026 Penglong Huang

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
