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
Pet Brain (Future - Step 05)
      ↓
Reaction Engine (Future)
      ↓
Pet State Store (usePetStore) / UI (PetRenderer)
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
* Pet Brain and Reaction Engine decisions answering the question: **"How should the pet react to it?"**
* Reaction priority, dialogue selection, cooldown management, and personality rules.
* Application state management (Zustand).

### Boundary Violation Guardrails:
* Rust **MUST NOT** decide pet dialogue, emotion, animation state, or reaction priorities.
* React **MUST NOT** perform high-frequency polling or raw OS API querying directly.

---

## 4. Pet State & Rendering Contract

The Pet domain model and renderer are strictly decoupled:

```text
Pet Brain / System Event Triggers (Future)
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

## 5. Domain Event Bus & Communication Architecture

1. **Transport-Independent Domain Events**: Domain events (`DomainEvent`) are strongly typed TypeScript discriminated unions (e.g., `application.opened`, `network.offline`, `user.idle`) decoupled from `@tauri-apps/*` or OS transport mechanisms.
2. **In-Process Domain Event Bus**: A lightweight, synchronous event bus (`createDomainEventBus()`, singleton `domainEventBus`) routes events to matching subscribers.
3. **Strict State & Brain Separation**: The Event Bus communicates facts. It is not application state (Zustand) and does not automatically mutate `PetState`. The future Pet Brain (Step 05) will subscribe to domain events to evaluate pet state transitions.
4. **No History Retention or Polling**: The Event Bus maintains zero event history/logs to avoid memory growth during long desktop sessions, and runs purely synchronously with zero background timers or polling loops.
5. **Deduplication at Source**: Rust native monitors (when introduced in future steps) filter out duplicate system states before sending messages across the IPC bridge.

---

## 6. Resource Efficiency & Lifecycle Rules

* **Idle Reduction**: Background monitoring throttles down when the user is idle or when the pet window is hidden.
* **Cleanup Mandate**: Every event listener, timer, or subscription must return an explicit cleanup handler upon unmount or teardown.
* **Unbounded Memory Protection**: In-memory logs, reaction queues, and state histories MUST be capped with max length limits to prevent continuous session memory growth.
* **State Minimization**: Global Zustand state is kept minimal; components subscribe via focused selectors to prevent broad re-renders.

---

## 7. Offline-First & Privacy Principles

* **Offline-First**: DeskBuddy relies on zero remote servers or cloud services. All core features run completely offline.
* **Local Privacy**: System activity, process names, and user idle history remain strictly on the local machine. No analytics, tracking SDKs, or telemetry are included.
* **Local Persistence (Planned)**: State persistence in future phases will use local SQLite databases stored strictly in standard OS app data directories.
