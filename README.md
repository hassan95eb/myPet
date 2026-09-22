# DeskBuddy 🐾

**DeskBuddy** is a lightweight, offline-first desktop companion application designed to live on your desktop session. Built with **Tauri 2**, **React 19**, **TypeScript**, and **Tailwind CSS v4**, DeskBuddy delivers continuous companionship with minimal resource footprint (<1% idle CPU, <100MB RAM).

---

## ✨ Features (Step 01 Shell)

- 🪟 **Transparent & Frameless Shell**: A compact 200×200 transparent window with native window decorations disabled.
- 📌 **Always on Top**: Stays subtly visible above normal application windows without stealing keyboard focus.
- 🖐️ **Native Window Dragging**: Drag DeskBuddy freely around your desktop using Tauri 2's native drag regions (`data-tauri-drag-region`).
- 🎯 **Smart Work-Area Positioning**: Automatically positions near the bottom-right corner of your primary monitor's available work area on startup, avoiding taskbar overlap.
- 🙈 **Skip Taskbar**: Configured to run as a desktop companion rather than cluttering your OS taskbar.
- ❌ **Dev Close Hatch**: An unobtrusive close control (`×`) that appears on hover for convenient development testing.

---

## 🛠️ Tech Stack & Architecture

- **Desktop Framework**: [Tauri 2](https://tauri.app/) (Rust backend + Webview frontend)
- **Frontend UI**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Tooling & Quality**: [Vite](https://vitejs.dev/), [ESLint v9](https://eslint.org/), [Vitest](https://vitest.dev/), `pnpm`

### System Boundaries

```text
Operating System (Process Events, Network, Idle Status)
                        │
                        ▼
           Rust Native Layer (src-tauri)
                        │
                        ▼
            Tauri 2 IPC Event Boundary
                        │
                        ▼
          React / TypeScript Domain Layer (src)
            (Pet Brain, UI, Reaction Engine)
```

- **Rust Native Layer**: Answers *"What happened on the operating system?"*
- **React / TS Layer**: Answers *"How should the pet react?"*

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20+ recommended
- **pnpm**: v10+ (`npm install -g pnpm`)
- **Rust**: Latest stable toolchain (`rustup update`)
- **System Dependencies** (Linux only): `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/deskbuddy.git
cd deskbuddy

# Install frontend dependencies
pnpm install
```

### Development Commands

```bash
# Start Vite development server & Tauri native desktop shell
pnpm tauri dev

# Run frontend-only development server
pnpm dev

# Run code quality checks
pnpm lint        # Run ESLint v9 checks
pnpm typecheck   # Run TypeScript strict type checks
pnpm test        # Run Vitest unit tests

# Build production bundle
pnpm build       # Build frontend distribution assets
pnpm tauri build # Build native production binary
```

---

## 📁 Project Structure

```text
├── docs/                 # Architectural Decision Records, Roadmap & Architecture docs
├── src/
│   ├── app/              # Global styles and application providers
│   ├── features/
│   │   └── pet/          # Pet placeholder component and window utilities
│   ├── shared/           # Shared constants, types, and helpers
│   ├── App.tsx           # Main application shell
│   └── main.tsx          # React DOM entrypoint
└── src-tauri/
    ├── capabilities/     # Tauri permission capabilities
    ├── src/              # Rust native backend modules (commands, events, system)
    └── tauri.conf.json   # Tauri application & window configuration
```

---

## 🔒 Privacy & Resource Mandate

- **100% Local & Offline**: DeskBuddy operates with zero remote servers, cloud endpoints, or external network dependencies.
- **Zero Telemetry**: No analytics, tracking, or remote error logging.
- **Resource Efficiency**: Zero busy-wait loops, throttled idle updates, and strictly cleaned-up event listeners.

---

## 📜 License

[MIT License](LICENSE)
