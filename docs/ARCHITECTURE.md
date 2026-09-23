# DeskBuddy Architecture

## 1. Executive Summary

DeskBuddy is an offline-first desktop companion application designed to live on the user's desktop session. It reacts intelligently to operating system events (such as active application changes, network status changes, and user idle/return detection) while delivering continuous, low-overhead companionship.

Because DeskBuddy is meant to run continuously for long sessions (potentially entire user desktop sessions), **CPU efficiency, memory stability, privacy, and architectural lifecycle boundaries** are treated as first-class core requirements.

---

## 2. High-Level Architecture & Layering

DeskBuddy is built on a clear separation of concerns between the native platform layer (Rust/Tauri) and the application domain/UI layer (React/TypeScript).

```text
Operating System (Future)
      ↓
Rust native monitors (Future)
      ↓
Normalized native/system events
      ↓
Tauri IPC transport (Future)
      ↓
Frontend transport adapter (Future)
      ↓
Domain Event Bus (Step 04)
      ↓
Pet Brain (Step 05)
      ↓
Reaction Intent
      ↓
Reaction Engine (Step 06)
      ↓
Pet State Store (usePetStore) / UI (PetRenderer)
      ↓
Rive Adapter
```

---

## 3. Core Responsibility Boundary

To maintain predictable maintenance and resource consumption, responsibilities are strictly split:

### Rust / Native Layer owns:
* Native OS API integrations.
* Native system event observation (process changes, network status, idle/return triggers).
* Hardware / platform abstraction answering the question: **"What happened on the operating system?"**

### React / TypeScript Layer owns:
* User Interface & Pet animations / display (`PetRenderer`).
* Domain Pet State (`PetState` / `usePetStore`).
* Pet Brain and Reaction Engine decisions answering the question: **"How and when should the pet react to it?"**
* Reaction priority, dialogue selection, cooldown management, and personality rules.
* Application state management (Zustand).

### Boundary Violation Guardrails:
* Rust **MUST NOT** decide pet dialogue, emotion, animation state, or reaction priorities.
* React **MUST NOT** perform high-frequency polling or raw OS API querying directly.

---

## 4. Pet State & Rendering Contract

The Pet domain model and renderer are strictly decoupled:

```text
Pet Brain / Reaction Engine (Step 06)
                  │
                  ▼
          usePetStore (PetState)
                  │
            Current State
                  │
                  ▼
             PetRenderer
                  │
            Rive Adapter
                  │
         ┌────────┴────────┐
         │                 │
     Rive Runtime     Static Fallback
  (deskbuddy.riv)    (StaticPetFallback)
```

* **Pet Store (`usePetStore`)**: Holds domain state (`PetState`) and state setter (`setState`).
* **Pet Renderer (`PetRenderer`)**: Subscribes to `PetState` via focused selector and delegates rendering to the Rive adapter (`RivePetRenderer`).
* **Rive Adapter**: Translates domain `PetState` into Rive state machine configurations while maintaining complete separation between application state and Rive runtime internals.
* **Static Fallback (`StaticPetFallback`)**: Ensures DeskBuddy remains fully functional and visual if the `.riv` asset is missing or fails to initialize.

---

## 5. Domain Event Bus, Pet Brain, & Reaction Engine Pipeline

1. **Transport-Independent Domain Events**: Domain events (`DomainEvent`) are strongly typed TypeScript discriminated unions (e.g., `application.opened`, `network.offline`, `user.idle`) decoupled from `@tauri-apps/*` or OS transport mechanisms.
2. **In-Process Domain Event Bus**: A lightweight, synchronous event bus (`createDomainEventBus()`, singleton `domainEventBus`) routes events to matching subscribers.
3. **Pure Pet Brain Evaluation**: The Pet Brain (`evaluatePetEvent`) interprets domain events and produces transient `ReactionIntent` objects (`notice`, `curious`, `pleased`, `concerned`, `sleepy`, `attentive`). The Pet Brain does NOT mutate `PetState` or control Rive directly.
4. **Deterministic Reaction Engine**: The Reaction Engine (`createReactionEngine()`) evaluates `ReactionIntent` against explicit `ReactionDefinition` rules:
   - **Priorities**: Numeric levels (1 = low, 2 = normal, 3 = high). Higher-priority incoming reactions interrupt lower-priority active reactions; equal/lower priority incoming reactions are rejected.
   - **Durations**: Bounded durations for temporary reactions (e.g., 1200ms–2000ms) returning `PetState` to `idle` upon completion; persistent reactions (`sleepy` → `sleeping`, `durationMs: null`) remain active until interrupted by a higher-priority reaction.
   - **Cooldowns**: Per-intent cooldown timestamps prevent rapid re-triggering. Cooldowns are recorded only when a reaction is accepted.
   - **Timer Safety**: At most one completion timer exists; old timers are cleared on interruption, and reaction token IDs guard against stale timer completion callbacks.
5. **No History Retention or Polling**: The Event Bus and Reaction Engine maintain zero event history to avoid memory growth during long desktop sessions, and run purely on event dispatches with zero background polling loops.

---

## 6. Resource Efficiency & Lifecycle Rules

* **Idle Reduction**: Background monitoring throttles down when the user is idle or when the pet window is hidden.
* **Cleanup Mandate**: Every event listener, timer, or subscription must return an explicit cleanup handler upon unmount or teardown.
* **Unbounded Memory Protection**: In-memory logs, reaction queues, and state histories MUST be capped with max length limits to prevent continuous session memory growth. In V1, no reaction queue is used (rejected intents are dropped).
* **State Minimization**: Global Zustand state is kept minimal; components subscribe via focused selectors to prevent broad re-renders.

---

## 7. Offline-First & Privacy Principles

* **Offline-First**: DeskBuddy relies on zero remote servers or cloud services. All core features run completely offline.
* **Local Privacy**: System activity, process names, and user idle history remain strictly on the local machine. No analytics, tracking SDKs, or telemetry are included.
* **Local Persistence (Planned)**: State persistence in future phases will use local SQLite databases stored strictly in standard OS app data directories.
