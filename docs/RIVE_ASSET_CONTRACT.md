# DeskBuddy — Rive Asset Contract Specification

This document defines the asset and state machine expectations for future `.riv` DeskBuddy pet character assets.

---

## 1. Asset Overview & Location

* **Canonical Runtime Asset Location**: `public/assets/pet/deskbuddy.riv`
* **Runtime Path**: `/assets/pet/deskbuddy.riv`
* **Canvas Boundary**: 1:1 Aspect Ratio (Recommended: 200x200 canvas viewport)
* **Background Requirement**: 100% transparent background (no background artboard fill or solid canvas color).

---

## 2. Supported Domain Pet States

The DeskBuddy domain model defines the following 7 explicit states (`PetState`):

1. `idle`: Default resting animation (light breathing, subtle blinking, non-intrusive).
2. `walking`: Walking/moving animation.
3. `sleeping`: Sleeping/dozing visual state with closed eyes or sleeping indicators.
4. `happy`: Upbeat, cheerful reaction visual.
5. `angry`: Frustrated/annoyed expression.
6. `surprised`: Wide-eyed alert reaction.
7. `listening`: Music/audio-listening state or attentive focus.

---

## 3. Rive State Machine Contract

* **Recommended State Machine Name**: `PetStateMachine`
* **Inputs & Triggers**:
  * The state machine should expose state inputs or triggers corresponding to the 7 domain states (`idle`, `walking`, `sleeping`, `happy`, `angry`, `surprised`, `listening`).
  * The DeskBuddy `RivePetRenderer` adapter maps the application domain `PetState` to the appropriate Rive State Machine input or trigger.

---

## 4. Architectural Boundary

```text
PetState (Domain Model)
        ↓
Zustand Store
        ↓
PetRenderer
        ↓
Rive Adapter (riveAdapter.ts)
        ↓
Rive State Machine (deskbuddy.riv)
```

### Key Principles:
* **Domain Independence**: Rive is strictly a rendering technology. The application domain state (`PetState`) is the single source of truth for pet behavior.
* **No Internal Leaks**: Rive input names, numeric IDs, or animation timelines must remain behind the adapter boundary and never leak into the Zustand store or domain logic.
* **Graceful Fallback**: If the `.riv` asset is missing or fails to load, DeskBuddy seamlessly renders the lightweight static fallback renderer (`StaticPetFallback`) without crashing or altering domain state.
