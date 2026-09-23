# DeskBuddy Architecture Decision Records (ADRs)

### ADR-001: Tauri 2 Over Electron
* **Status**: Accepted
* **Context**: DeskBuddy is expected to run continuously for long user desktop sessions with minimal resource footprint.
* **Decision**: Adopt Tauri 2 as the desktop application framework instead of Electron.
* **Consequences**: Significantly reduced idle memory footprint (<100MB target achievable), smaller installer binary size, native OS performance with Rust backend, and strict cap on webview resource usage.

---

### ADR-002: React 19 + TypeScript for Domain Logic and UI
* **Status**: Accepted
* **Context**: Interactive UI, pet animation orchestration, state management, and reaction logic require strong typing and component modularity.
* **Decision**: Use React 19 and TypeScript for frontend UI and domain behavior.
* **Consequences**: Strong type safety for domain events and pet brain rules; familiar reactive state model for UI components.

---

### ADR-003: Strict Rust vs React Responsibility Boundary
* **Status**: Accepted
* **Context**: Mixing system querying with domain pet behaviors creates spaghetti code and potential resource leaks.
* **Decision**: Rust strictly owns native OS querying and event generation ("What happened on the OS?"). React strictly owns domain reactions, dialogue, mood state, and UI rendering ("How should the pet react?").
* **Consequences**: Clear maintainability boundaries and capability isolation. Rust code contains zero pet dialogue or decision logic.

---

### ADR-004: Offline-First Architecture
* **Status**: Accepted
* **Context**: DeskBuddy must remain functional in air-gapped or offline desktop environments without depending on cloud availability.
* **Decision**: Build DeskBuddy as a 100% offline-first application with zero mandatory backend server dependencies.
* **Consequences**: Maximum reliability, zero cloud infrastructure cost, and complete functionality regardless of network state.

---

### ADR-005: Local-First Privacy Principle
* **Status**: Accepted
* **Context**: Observing user process changes, idle times, and system activity requires absolute user trust.
* **Decision**: Keep all observed system activity, logs, and statistics stored locally on the user's machine. Do not collect telemetry or analytics.
* **Consequences**: Fosters user trust and guarantees compliance with privacy expectations.

---

### ADR-006: Event-Driven System Monitoring
* **Status**: Accepted
* **Context**: Constant polling loops burn CPU cycles and drain battery life on laptop devices.
* **Decision**: Prefer native event listeners / OS hooks in Rust over high-frequency polling.
* **Consequences**: Achieves target CPU usage (<1% when idle) and prevents unnecessary background compute work.

---

### ADR-007: SQLite Planned for Local Storage (Future Phases)
* **Status**: Accepted
* **Context**: Local history, persistent pet mood, and user configuration require structured local storage.
* **Decision**: Plan SQLite as the persistence store when state persistence is introduced in later phases.
* **Consequences**: Fast, robust, structured local storage with zero server dependencies.

---

### ADR-008: Rive Planned for Pet Animations (Future Phases)
* **Status**: Accepted
* **Context**: Desktop pet animations require state machines, smooth transitions, and lightweight vector rendering.
* **Decision**: Plan Rive for pet state machine animation in Phase 1/2.
* **Consequences**: High-performance 60fps vector animations with built-in state machine support and low memory overhead.

---

### ADR-009: Rive React Integration Boundary (Step 03)
* **Status**: Accepted
* **Context**: Rive rendering must be integrated into DeskBuddy without coupling application state or domain `PetState` to Rive runtime internals.
* **Decision**: Adopt `@rive-app/react-canvas` (v4.34+) wrapped in a thin adapter layer (`riveAdapter.ts` + `RivePetRenderer`) behind the stable `PetRenderer` component interface. If the asset is missing or fails, render `StaticPetFallback`.
* **Consequences**: Application domain (`PetState` in Zustand) remains 100% independent from Rive; asset loading failure never crashes the application; future `.riv` assets can be swapped cleanly.

---

### ADR-010: In-Process Strongly Typed Domain Event Bus (Step 04)
* **Status**: Accepted
* **Context**: Future system monitors (Rust/Tauri) and internal domain triggers need to communicate system signals to the Pet Brain without coupling to UI components, Zustand state, or transport mechanisms.
* **Decision**: Implement a lightweight, strongly typed in-process Domain Event Bus (`createDomainEventBus()`) using TypeScript discriminated unions (`DomainEvent`). The bus is synchronous, transport-agnostic, retains zero event history, and operates with zero background polling or timers.
* **Consequences**: Transport independence ensures events can originate from Rust IPC, frontend controls, or tests seamlessly; memory leaks are prevented by clean unsubscription functions and zero log retention; application state (`PetState`) remains separate from event transportation.

---

### ADR-011: Pet Brain & Reaction Intent Boundary (Step 05)
* **Status**: Accepted
* **Context**: Domain events emitted across the bus must be evaluated for pet reactions without directly mutating application state (`PetState`) or controlling Rive rendering.
* **Decision**: Implement the Pet Brain as a pure domain function (`evaluatePetEvent`) mapping `DomainEvent` to transient `ReactionIntent` objects (`notice`, `curious`, `pleased`, `concerned`, `sleepy`, `attentive`). Connect it via `initPetBrainRuntime()` and `onReactionIntent()` without modifying Zustand `PetState` or Rive adapters.
* **Consequences**: Complete decoupling between event evaluation (Pet Brain), execution rules (Reaction Engine - Step 06), and visual state (Zustand/Rive); 100% deterministic domain logic easily testable in plain TypeScript; zero background timers or polling overhead.

---

### ADR-012: First Production Reaction Engine (Step 06)
* **Status**: Accepted
* **Context**: Transient `ReactionIntent` objects produced by Pet Brain need an execution policy engine to determine whether/when they execute, how long they stay active, priority interruption rules, per-intent cooldowns, and resetting temporary states to `idle`.
* **Decision**: Implement `createReactionEngine()` with explicit reaction definitions (`REACTION_DEFINITIONS`), simple numeric priorities (1=low, 2=normal, 3=high), bounded completion durations (null for persistent sleep), per-intent cooldown timestamps (recorded only on acceptance), and stale completion timer protection via unique reaction tokens. No reaction queue is used in V1 (unexecutable reactions are dropped).
* **Consequences**: Deterministic reaction execution pipeline; Reaction Engine mutates `PetState` store without Pet Brain or Rive knowing execution details; strictly at most one active completion timer; zero background polling or continuous CPU consumption.
