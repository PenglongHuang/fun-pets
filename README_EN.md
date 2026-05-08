<h1 align="center">FunBuddy - AI Desktop Pet Assistant</h1>

<p align="center">
  <strong>A cute desktop AI pet — your intelligent work companion</strong>
</p>

<p align="center">
  Not just a pet that keeps you focused and organized.<br>
  It will soon control your Coding Agents, build a personal knowledge base,<br>
  automate browser and desktop tasks, and integrate with your messaging apps.
</p>

<p align="center">
  <a href="#current-features-v01x">Features</a> &bull;
  <a href="#ai-roadmap">AI Roadmap</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#development">Development</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="README.md">中文文档</a>
</p>

---

## Current Features (v0.1.x)

### Desktop Pet Companion

- Adorable star-shaped pet with multiple animation states (happy, focus, sleepy)
- Hover interaction animations (spin, bounce, thought bubble, heart)
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
- Tab-based plan list (daily/weekly/monthly/all) with batch management
- List view with plan card previews and quick editing
- Calendar view with colored dots for daily/weekly/monthly coverage
- Auto color classification (blue=daily, purple=weekly, amber=monthly)
- Date picker for creating plans with specific date ranges

### Markdown Notes

- Note list + editor dual-pane layout
- Toggle between edit mode and live preview
- Syntax-highlighted code blocks (highlight.js with Dracula theme)
- Auto-assigned color tags for visual distinction

### Quick Capture

- Global hotkey `Ctrl+Shift+N` opens a floating input window
- Capture fleeting thoughts as notes without breaking your workflow

### Settings Panel

- Customizable storage directory with history picker
- Adjustable pomodoro parameters (duration, breaks, rounds)
- Auto-start on boot / minimize-to-tray on close
- JSON data export with native save dialog
- Clear data with confirmation

---

## AI Roadmap

> FunBuddy aims to become your AI work hub. The pet is not just a companion — it's the bridge between you and AI capabilities.

### 1. Coding Agent Control Hub

Turn FunBuddy into a unified interface for controlling Coding Agents:

- Integrate [Claude Code](https://claude.ai/code), [OpenAI Codex](https://github.com/openai/codex), and other popular Coding Agents
- Visual task orchestration: create, dispatch, and track Agent tasks from the FunBuddy panel
- Multi-agent coordination: dispatch multiple Agents in parallel for different subtasks
- Real-time progress dashboard: code change previews, execution logs, result review

### 2. AI Knowledge Base & Memory

Give the pet long-term memory and make it your "second brain":

- Local-first vector knowledge base, auto-indexing project code, notes, and plans
- Cross-session memory: remembers your preferences, work habits, and project context
- Semantic search: query historical notes and code snippets using natural language
- Smart associations: automatically discover and recommend hidden connections between notes

### 3. Automated Browser & Desktop Operations

Drive automation through visual understanding — let the pet handle repetitive tasks:

- Browser automation via [Midscene.js](https://midscenejs.com/): form filling, data scraping, page operations
- Desktop-level automation: launch apps, manage files, cross-window collaboration
- Natural language driven: describe tasks in plain language, the pet plans and executes automatically
- Operation recording & replay: record a workflow once, replay it with one click

### 4. Instant Messaging Integration

Let the pet become your messaging hub:

- Connect to WeChat, DingTalk, Feishu, Telegram, Slack, and other major IM platforms
- AI-powered message summaries: auto-summarize unread messages and extract key information
- Context-aware reply suggestions: recommend replies based on current tasks and knowledge base
- Message automation: scheduled reminders, conditional triggers, group message filtering and forwarding

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
| Markdown Rendering | [marked](https://marked.js.org/) + [highlight.js](https://highlightjs.org/) | Note/plan preview with syntax highlighting |
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
git clone https://github.com/PenglongHuang/fun-buddy.git
cd fun-buddy

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

FunBuddy uses Electron's three-layer architecture:

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
fun-buddy/
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
└── .npmrc                     # npm mirror config
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
