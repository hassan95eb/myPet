# DeskBuddy Roadmap

This document outlines the phased development roadmap for DeskBuddy.

---

## Phase 0: Foundation & Architecture
* [x] Tauri 2 + React + TypeScript + Vite foundation.
* [x] Tailwind CSS v4 setup with `@tailwindcss/vite`.
* [x] Zustand installation & clean project structure setup.
* [x] ESLint v9, Vitest, and TypeScript configuration.
* [x] Rust application structure (`src-tauri`).
* [x] Architectural, roadmap, decision, and AI agent guidelines documentation.

---

## Phase 1: Desktop Pet Shell
* [x] Transparent, frameless, always-on-top window setup.
* [x] Draggable pet window shell with native drag regions.
* [x] Basic pet render container & lightweight placeholder visual.
* [x] Primary monitor work-area positioning and skip-taskbar setup.
* [x] Pet State Model & Rendering Foundation (Step 02: typed PetState, Zustand Pet store, static PetRenderer, dev state controls).
* [ ] Initial Rive animation player integration (Step 03).
* [ ] Basic pet placement and desktop boundary management.

---

## Phase 2: Pet Brain & Reaction Engine
* Event Bus architecture in TypeScript.
* Reaction Engine with reaction queueing and priority levels.
* Cooldown management and interruption rules.
* Dialogue system and basic pet mood state machine.

---

## Phase 3: System Awareness
* Rust native process monitoring (application start/stop/focused).
* Rust network connectivity monitor.
* Native user idle / return event detection.
* Normalized Rust → Frontend event broadcasting over Tauri IPC bridge.

---

## Later Phases (High Level)
* **Personality System**: Selectable/customizable pet personalities affecting dialogue and reaction rules.
* **Music Player**: Local audio file player with pet reactions to music playback.
* **Local Persistence**: SQLite integration for activity logging, settings storage, and pet relationship history.
* **Deeper OS Integration**: Native system notifications, battery status monitoring.
* **Activity Dashboard**: Non-intrusive companion dashboard for user activity stats and settings.
* **Pet Life & Achievements**: Pet growth system, mood persistence, and fun desktop easter eggs.
* **Release & Optimization**: Profiling CPU/memory, final binary packaging, auto-update mechanism.
