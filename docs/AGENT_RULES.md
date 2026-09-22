# AGENT_RULES.md — Guidelines for AI Agents Working on DeskBuddy

Welcome! As an AI agent working on DeskBuddy, you MUST adhere strictly to the following architectural guidelines, engineering standards, and scope boundaries.

---

## 1. Scope and Pre-flight Inspection

Before writing or modifying any code:
1. Read `docs/ROADMAP.md` to confirm the scope of the task.
2. Read `docs/ARCHITECTURE.md` to understand system boundaries.
3. Read `docs/DECISIONS.md` to ensure your proposed changes do not violate existing Architectural Decision Records.
4. **Work ONLY on the requested phase/step.** Do not implement speculative or future roadmap features.
5. Do not replace locked technologies (Tauri 2, React, TypeScript, Vite, Tailwind CSS v4, Zustand, Rust).

---

## 2. Architectural Boundary Mandate

Maintain the strict layer hierarchy:

```text
Operating System
      ↓
Rust native layer (src-tauri)
      ↓
Normalized events across IPC
      ↓
React / Domain layer (src)
      ↓
Pet Brain & Reaction Engine
```

* **Rust native layer answers**: *"What happened on the operating system?"*
* **React domain layer answers**: *"How should the pet react to it?"*
* **NEVER**: Add dialogue, pet mood, animation triggers, or reaction logic inside Rust code.
* **NEVER**: Query OS APIs or execute shell commands directly from React.

---

## 3. Dependency Controls

Before introducing ANY new npm package or Rust crate:
1. Verify if platform/language built-ins or standard libraries can solve the problem.
2. Check bundle size impact and runtime memory overhead.
3. Prefer lightweight, maintained solutions over massive frameworks.
4. Document the justification for the dependency in the commit message or PR notes.

---

## 4. Resource Efficiency & Performance Rules

DeskBuddy is designed to run continuously for multi-hour sessions:
* **CPU Target**: ~0% when idle; <1% during normal background operation.
* **Memory Target**: <100MB idle memory. Continuous memory growth is considered a critical bug.
* **No Busy Wait Loops**: Never write busy-wait loops or unthrottled `setInterval` loops.
* **Cleanup Mandate**: Every event subscription, timer, and native listener MUST have explicit cleanup on component unmount or module teardown.
* **Bounded Queues**: All in-memory event queues, activity logs, or reaction histories MUST have hard maximum capacities.
* **Selector Usage**: Always use focused Zustand selectors (e.g. `useStore(s => s.value)`) rather than subscribing components to whole store objects.

---

## 5. Security & Privacy Rules

* **Local-First Privacy**: System activity, process names, and user status MUST remain on the local machine.
* **No Telemetry**: Do NOT add analytics, remote logging, tracking, or cloud endpoints.
* **Minimal Tauri Capabilities**: Keep Tauri IPC permissions minimal. Do not enable dangerous full-filesystem capabilities unless explicitly required.

---

## 6. Code Quality & Pre-commit Verification

Before marking any task as complete, you MUST execute and pass:
* `pnpm lint` (ESLint v9)
* `pnpm typecheck` (TypeScript)
* `pnpm test` (Vitest)
* `cargo check` / `cargo clippy` (Rust native checks)
* `pnpm build` (Frontend build verification)

Avoid using `any` types in TypeScript or unhandled `unwrap()` calls in Rust production paths.
