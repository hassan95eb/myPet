# DeskBuddy Architecture

## 1. Executive Summary

DeskBuddy is an offline-first desktop companion application designed to live on the user's desktop session. It reacts intelligently to operating system events (such as active application changes, network status changes, and user idle/return detection) while delivering continuous, low-overhead companionship.

Because DeskBuddy is meant to run continuously for long sessions (potentially entire user desktop sessions), **CPU efficiency, memory stability, privacy, and architectural lifecycle boundaries** are treated as first-class core requirements.

---

## 2. High-Level Architecture & Layering

DeskBuddy is built on a clear separation of concerns between the native platform layer (Rust/Tauri) and the application domain/UI layer (React/TypeScript).

```text
+-------------------------------------------------------------+
|                      OPERATING SYSTEM                       |
|           (Process Events, Network, Idle Status)            |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                  RUST NATIVE LAYER (Tauri)                  |
|  - Process Monitoring (Future)  - Native Capabilities       |
|  - Idle Detection (Future)      - Event Emission            |
|  - Network Monitor (Future)     - System Call Abstraction   |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     TAURI IPC BOUNDARY                      |
|                  (Normalized System Events)                 |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                REACT / TYPESCRIPT DOMAIN LAYER               |
|  - App Shell / Dashboard UI     - Pet State                 |
|  - Pet Brain / Event Bus        - Priority / Cooldown       |
|  - Reaction Engine              - Personality Behavior      |
+-------------------------------------------------------------+
```

---

## 3. Core Responsibility Boundary

To maintain predictable maintenance and resource consumption, responsibilities are strictly split:

### Rust / Native Layer owns:
* Native OS API integrations.
* Native system event observation (process changes, network status, idle/return triggers).
* Hardware / platform abstraction answering the question: **"What happened on the operating system?"**

### React / TypeScript Layer owns:
* User Interface & Pet animations / display.
* Pet Brain and Reaction Engine decisions answering the question: **"How should the pet react to it?"**
* Reaction priority, dialogue selection, cooldown management, and personality rules.
* Application state management (Zustand).

### Boundary Violation Guardrails:
* Rust **MUST NOT** decide pet dialogue, emotion, animation state, or reaction priorities.
* React **MUST NOT** perform high-frequency polling or raw OS API querying directly.

---

## 4. Communication & Event-Driven Philosophy

1. **Normalized Events Over Raw Data**: Rust emits structured, normalized events (e.g., `system://idle-changed`, `system://process-focused`) across the Tauri IPC boundary rather than raw OS blobs.
2. **Event-Driven Over Polling**: Polling is strictly minimized or event-driven. Where OS notifications exist (e.g. OS hooks / signals), event callbacks are preferred over timer loops.
3. **Deduplication at Source**: Rust native monitors filter out duplicate or identical system states before sending messages across the IPC bridge to avoid unnecessary React re-renders.

---

## 5. Resource Efficiency & Lifecycle Rules

* **Idle Reduction**: Background monitoring throttles down when the user is idle or when the pet window is hidden.
* **Cleanup Mandate**: Every event listener, timer, or subscription must return an explicit cleanup handler upon unmount or teardown.
* **Unbounded Memory Protection**: In-memory logs, reaction queues, and state histories MUST be capped with max length limits to prevent continuous session memory growth.
* **State Minimization**: Global Zustand state is kept minimal; components subscribe via focused selectors to prevent broad re-renders.

---

## 6. Offline-First & Privacy Principles

* **Offline-First**: DeskBuddy relies on zero remote servers or cloud services. All core features run completely offline.
* **Local Privacy**: System activity, process names, and user idle history remain strictly on the local machine. No analytics, tracking SDKs, or telemetry are included.
* **Local Persistence (Planned)**: State persistence in future phases will use local SQLite databases stored strictly in standard OS app data directories.
