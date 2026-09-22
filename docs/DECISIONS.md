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
