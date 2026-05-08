<h1 align="center">FunBuddy</h1>

<p align="center">
  <strong>你桌面上住着一只会陪你工作的星星</strong>
</p>

<p align="center">
  它会在你专注时安静地眨眼，在你完成目标时为你放一场烟花。<br>
  番茄钟、计划管理、Markdown 笔记 — 所有你需要的，都在一个可爱的面板里。
</p>

<p align="center">
  <a href="#核心功能">功能</a> &bull;
  <a href="#ai-路线图">AI 路线图</a> &bull;
  <a href="#技术栈">技术栈</a> &bull;
  <a href="#快速开始">安装</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="README_EN.md">English</a>
</p>

---

## 核心功能

### 一只活着的桌面萌宠

不是静态图标 — 是一只有情绪的星星。悬停时它会旋转、弹跳、冒爱心；专注时它单眼眨巴为你加油；完成目标时它双眼弯弯、满屏彩纸庆祝。它可以缩成桌面角落的小宠物，也可以一键展开为功能完整的面板。

### 番茄钟：让专注有仪式感

开始一个番茄钟，选一个计划，然后沉下去。三阶段自动轮转（专注 → 短休 → 长休 → …），到了该休息的时候，萌宠会提醒你。每个番茄钟都有记录 — 你可以回溯今天专注了多久、每个计划花了多少分钟。

### 计划管理：想到就记，日历上见

用 Markdown 写计划，设定日期范围，FunBuddy 自动识别它是日计划、周计划还是月计划，并用不同颜色标记在日历上。卡片视图一目了然，紧凑视图塞进更多信息。标签、搜索、排序 — 找到任何一个计划不超过 3 秒。

### Markdown 笔记：写的时候就在预览

左边写字，右边实时预览 — 所见即所得。一键打开目录导航，长文档也能瞬间跳到任意章节。加粗、斜体、链接都有快捷键，右键就能格式化 — 写笔记像用 Word 一样顺手。代码块自动高亮，技术笔记也赏心悦目。

### 快速捕获：灵感不过夜

`Ctrl+Shift+N`，任何时候、任何应用。一个浮动小窗弹出来，打完字回车就保存为笔记，自动打上"快捷笔记"标签。零打断，灵感落地只要 2 秒。

---

## AI 路线图

> 萌宠不只是陪伴 — 它正在成为你的 AI 办公中枢。

- **Coding Agent 控制中枢** — 在面板里调度 Claude Code、OpenAI Codex，可视化追踪多 Agent 任务
- **AI 知识库与记忆** — 让萌宠拥有长期记忆，用自然语言搜到你写过的任何东西
- **浏览器与桌面自动化** — 用自然语言描述任务，萌宠自动操作浏览器和桌面应用
- **即时通讯集成** — 接入微信、飞书、Slack，AI 摘要 + 智能回复建议

---

## 技术栈

| 技术 | 用途 |
|------|------|
| [Electron](https://www.electronjs.org/) 42 | 透明窗口、系统托盘、全局快捷键 |
| [React](https://react.dev/) 19 + TypeScript | 组件化 UI |
| [Tailwind CSS](https://tailwindcss.com/) 4 | 毛玻璃设计系统 |
| [Motion](https://motion.dev/) | 流畅动画与面板形变 |
| [Zustand](https://zustand.docs.pmnd.rs/) + Immer | 响应式状态管理 |
| [marked](https://marked.js.org/) + [highlight.js](https://highlightjs.org/) | Markdown 渲染与代码高亮 |
| [electron-vite](https://electron-vite.org/) | 构建与热更新 |

---

## 快速开始

```bash
git clone https://github.com/PenglongHuang/fun-buddy.git
cd fun-buddy
npm install
npm run dev
```

需要 Node.js >= 18，当前仅支持 Windows 10/11。

---

## License

[Apache License 2.0](LICENSE) &copy; Penglong Huang
