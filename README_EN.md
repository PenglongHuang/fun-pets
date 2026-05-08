<h1 align="center">FunBuddy</h1>

<p align="center">
  <strong>A tiny star lives on your desktop — and it actually helps you work</strong>
</p>

<p align="center">
  It blinks quietly while you focus, throws confetti when you hit your goals.<br>
  Pomodoro timer, planner, Markdown notes — everything you need in one adorable panel.
</p>

<p align="center">
  <a href="#features">Features</a> &bull;
  <a href="#ai-roadmap">AI Roadmap</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Install</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="README.md">中文</a>
</p>

---

## Features

### A Desktop Pet That's Actually Alive

Not a static icon — a star with moods. Hover and it spins, bounces, or bursts into hearts. When you're deep in focus, it winks to cheer you on. When you finish a session, it throws a full-screen confetti party. It can shrink into a tiny companion in the corner, or expand into a full-featured panel with one click.

### Pomodoro Timer With Ritual

Start a session, pick a plan, and dive in. Three phases auto-cycle (focus → short break → long break → …), and when it's time to rest, your pet nudges you. Every session is logged — look back at how long you focused today, how many minutes per plan, all tracked automatically.

### Planner: Capture Thoughts, See Them on the Calendar

Write plans in Markdown, set a date range, and FunBuddy auto-detects whether it's daily, weekly, or monthly — then marks it with color-coded dots on the calendar. Card view for scanning, compact view for density. Tags, search, sorting — find any plan in under 3 seconds.

### Markdown Notes: Preview While You Write

Write on the left, see it rendered on the right — instant feedback. Toggle the floating table of contents and jump to any heading in long docs. Bold, italic, links — all have keyboard shortcuts. Right-click to format text. Writing notes feels as natural as using Word. Code blocks get beautiful syntax highlighting, so even technical notes look great.

### Quick Capture: Ideas Don't Wait

`Ctrl+Shift+N` — anytime, any app. A floating window pops up, you type, hit Enter, and it's saved as a note with a "Quick Note" tag. Zero workflow interruption. From spark to saved note in 2 seconds.

---

## AI Roadmap

> The pet isn't just a companion — it's becoming your AI work hub.

- **Coding Agent Control Hub** — Orchestrate Claude Code, OpenAI Codex from the panel with visual multi-agent task tracking
- **AI Knowledge Base & Memory** — Give the pet long-term memory so you can find anything you've ever written using plain language
- **Browser & Desktop Automation** — Describe tasks in natural language, the pet operates browsers and apps for you
- **IM Integration** — Connect WeChat, Feishu, Slack with AI summaries and smart reply suggestions

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Electron](https://www.electronjs.org/) 42 | Transparent windows, tray, global hotkeys |
| [React](https://react.dev/) 19 + TypeScript | Component-based UI |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Glassmorphism design system |
| [Motion](https://motion.dev/) | Smooth animations & panel morphing |
| [Zustand](https://zustand.docs.pmnd.rs/) + Immer | Reactive state management |
| [marked](https://marked.js.org/) + [highlight.js](https://highlightjs.org/) | Markdown rendering & code highlighting |
| [electron-vite](https://electron-vite.org/) | Build & HMR |

---

## Getting Started

```bash
git clone https://github.com/PenglongHuang/fun-buddy.git
cd fun-buddy
npm install
npm run dev
```

Requires Node.js >= 18. Windows 10/11 only for now.

---

## License

[Apache License 2.0](LICENSE) &copy; Penglong Huang
