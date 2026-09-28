use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::Emitter;

pub const USER_IDLE_THRESHOLD: Duration = Duration::from_secs(5 * 60);
pub const USER_IDLE_POLL_INTERVAL: Duration = Duration::from_secs(5);

pub const EVENT_USER_IDLE: &str = "native://user-idle";
pub const EVENT_USER_ACTIVE: &str = "native://user-active";

/// Confirmed user activity state.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UserState {
    Active,
    Idle,
}

/// Result of querying the OS for user idle duration.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IdleObservation {
    Duration(Duration),
    Unknown,
}

/// Action to perform based on state transition evaluation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransitionAction {
    /// User state changed to Idle; emit `native://user-idle`
    TransitionToIdle,
    /// User state changed to Active; emit `native://user-active`
    TransitionToActive,
    /// State unchanged or observation unavailable; emit no event
    NoChange,
}

/// Queries system elapsed idle time since last user input on Windows.
/// On non-Windows/unsupported platforms, returns `IdleObservation::Unknown`.
#[cfg(windows)]
pub fn get_os_idle_duration() -> IdleObservation {
    use std::mem::size_of;
    use windows_sys::Win32::System::SystemInformation::GetTickCount64;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

    let mut last_input = LASTINPUTINFO {
        cbSize: size_of::<LASTINPUTINFO>() as u32,
        dwTime: 0,
    };

    // SAFETY: Passing valid pointer to initialized LASTINPUTINFO with cbSize set as required by Win32 API.
    let success = unsafe { GetLastInputInfo(&mut last_input) };
    if success == 0 {
        return IdleObservation::Unknown;
    }

    let _current_tick_64 = unsafe { GetTickCount64() };
    // GetLastInputInfo dwTime is a 32-bit millisecond tick count.
    // Calculate 32-bit wrapping difference against GetTickCount64 truncated to u32:
    let current_tick_32 = _current_tick_64 as u32;
    let elapsed_ms = current_tick_32.wrapping_sub(last_input.dwTime) as u64;

    IdleObservation::Duration(Duration::from_millis(elapsed_ms))
}

/// Fallback OS idle query for non-Windows platforms.
#[cfg(not(windows))]
pub fn get_os_idle_duration() -> IdleObservation {
    IdleObservation::Unknown
}

/// Pure deterministic state transition evaluator.
/// Compares `observation` against `current_state` and `threshold`.
/// Returns updated state and corresponding `TransitionAction`.
pub fn evaluate_transition(
    current_state: UserState,
    observation: IdleObservation,
    threshold: Duration,
) -> (UserState, TransitionAction) {
    match observation {
        IdleObservation::Unknown => (current_state, TransitionAction::NoChange),
        IdleObservation::Duration(idle_duration) => match current_state {
            UserState::Active => {
                if idle_duration >= threshold {
                    (UserState::Idle, TransitionAction::TransitionToIdle)
                } else {
                    (UserState::Active, TransitionAction::NoChange)
                }
            }
            UserState::Idle => {
                if idle_duration < threshold {
                    (UserState::Active, TransitionAction::TransitionToActive)
                } else {
                    (UserState::Idle, TransitionAction::NoChange)
                }
            }
        },
    }
}

/// Derives the startup baseline user state from an initial observation.
pub fn derive_baseline_state(observation: IdleObservation, threshold: Duration) -> UserState {
    match observation {
        IdleObservation::Duration(idle_duration) => {
            if idle_duration >= threshold {
                UserState::Idle
            } else {
                UserState::Active
            }
        }
        IdleObservation::Unknown => UserState::Active,
    }
}

/// Starts background native user idle monitoring thread.
/// Returns an `Arc<AtomicBool>` handle to trigger clean thread shutdown.
pub fn start_user_idle_monitor(app_handle: tauri::AppHandle) -> Arc<AtomicBool> {
    let running = Arc::new(AtomicBool::new(true));
    let running_clone = Arc::clone(&running);

    std::thread::spawn(move || {
        // Establish initial startup baseline without emitting events
        let initial_obs = get_os_idle_duration();
        let mut current_state = derive_baseline_state(initial_obs, USER_IDLE_THRESHOLD);

        while running_clone.load(Ordering::Relaxed) {
            std::thread::sleep(USER_IDLE_POLL_INTERVAL);

            if !running_clone.load(Ordering::Relaxed) {
                break;
            }

            let observation = get_os_idle_duration();
            let (next_state, action) =
                evaluate_transition(current_state, observation, USER_IDLE_THRESHOLD);
            current_state = next_state;

            match action {
                TransitionAction::TransitionToIdle => {
                    if let Err(err) = app_handle.emit(EVENT_USER_IDLE, ()) {
                        eprintln!(
                            "[DeskBuddy Native Monitor] Failed to emit user idle event: {:?}",
                            err
                        );
                    }
                }
                TransitionAction::TransitionToActive => {
                    if let Err(err) = app_handle.emit(EVENT_USER_ACTIVE, ()) {
                        eprintln!(
                            "[DeskBuddy Native Monitor] Failed to emit user active event: {:?}",
                            err
                        );
                    }
                }
                TransitionAction::NoChange => {}
            }
        }
    });

    running
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_THRESHOLD: Duration = Duration::from_secs(300); // 5 minutes

    #[test]
    fn test_baseline_active_when_idle_below_threshold() {
        let obs = IdleObservation::Duration(Duration::from_secs(30));
        let baseline = derive_baseline_state(obs, TEST_THRESHOLD);
        assert_eq!(baseline, UserState::Active);
    }

    #[test]
    fn test_baseline_idle_when_idle_at_or_above_threshold() {
        let obs = IdleObservation::Duration(Duration::from_secs(300));
        let baseline = derive_baseline_state(obs, TEST_THRESHOLD);
        assert_eq!(baseline, UserState::Idle);

        let obs_over = IdleObservation::Duration(Duration::from_secs(500));
        let baseline_over = derive_baseline_state(obs_over, TEST_THRESHOLD);
        assert_eq!(baseline_over, UserState::Idle);
    }

    #[test]
    fn test_baseline_active_when_unknown() {
        let obs = IdleObservation::Unknown;
        let baseline = derive_baseline_state(obs, TEST_THRESHOLD);
        assert_eq!(baseline, UserState::Active);
    }

    #[test]
    fn test_active_remains_active_if_duration_under_threshold() {
        let obs = IdleObservation::Duration(Duration::from_secs(299));
        let (next_state, action) = evaluate_transition(UserState::Active, obs, TEST_THRESHOLD);
        assert_eq!(next_state, UserState::Active);
        assert_eq!(action, TransitionAction::NoChange);
    }

    #[test]
    fn test_active_transitions_to_idle_when_duration_reaches_threshold() {
        let obs = IdleObservation::Duration(Duration::from_secs(300));
        let (next_state, action) = evaluate_transition(UserState::Active, obs, TEST_THRESHOLD);
        assert_eq!(next_state, UserState::Idle);
        assert_eq!(action, TransitionAction::TransitionToIdle);
    }

    #[test]
    fn test_idle_remains_idle_when_duration_at_or_above_threshold() {
        let obs = IdleObservation::Duration(Duration::from_secs(350));
        let (next_state, action) = evaluate_transition(UserState::Idle, obs, TEST_THRESHOLD);
        assert_eq!(next_state, UserState::Idle);
        assert_eq!(action, TransitionAction::NoChange);
    }

    #[test]
    fn test_idle_transitions_to_active_when_duration_resets_below_threshold() {
        let obs = IdleObservation::Duration(Duration::from_secs(2));
        let (next_state, action) = evaluate_transition(UserState::Idle, obs, TEST_THRESHOLD);
        assert_eq!(next_state, UserState::Active);
        assert_eq!(action, TransitionAction::TransitionToActive);
    }

    #[test]
    fn test_unknown_observation_retains_active_state_without_events() {
        let obs = IdleObservation::Unknown;
        let (next_state, action) = evaluate_transition(UserState::Active, obs, TEST_THRESHOLD);
        assert_eq!(next_state, UserState::Active);
        assert_eq!(action, TransitionAction::NoChange);
    }

    #[test]
    fn test_unknown_observation_retains_idle_state_without_events() {
        let obs = IdleObservation::Unknown;
        let (next_state, action) = evaluate_transition(UserState::Idle, obs, TEST_THRESHOLD);
        assert_eq!(next_state, UserState::Idle);
        assert_eq!(action, TransitionAction::NoChange);
    }

    #[test]
    fn test_repeated_active_observations_produce_no_duplicate_events() {
        let mut state = UserState::Active;

        for secs in [10, 20, 30, 40, 50] {
            let obs = IdleObservation::Duration(Duration::from_secs(secs));
            let (next_state, action) = evaluate_transition(state, obs, TEST_THRESHOLD);
            assert_eq!(next_state, UserState::Active);
            assert_eq!(action, TransitionAction::NoChange);
            state = next_state;
        }
    }

    #[test]
    fn test_repeated_idle_observations_produce_single_transition() {
        let mut state = UserState::Active;

        // First transition to Idle
        let obs_300 = IdleObservation::Duration(Duration::from_secs(300));
        let (state_1, action_1) = evaluate_transition(state, obs_300, TEST_THRESHOLD);
        assert_eq!(state_1, UserState::Idle);
        assert_eq!(action_1, TransitionAction::TransitionToIdle);
        state = state_1;

        // Subsequent idle observations produce no additional events
        for secs in [305, 310, 315, 400] {
            let obs = IdleObservation::Duration(Duration::from_secs(secs));
            let (next_state, action) = evaluate_transition(state, obs, TEST_THRESHOLD);
            assert_eq!(next_state, UserState::Idle);
            assert_eq!(action, TransitionAction::NoChange);
            state = next_state;
        }
    }

    #[test]
    fn test_full_cycle_active_to_idle_to_active() {
        let mut state = UserState::Active;

        // Active state
        let (s1, a1) = evaluate_transition(state, IdleObservation::Duration(Duration::from_secs(100)), TEST_THRESHOLD);
        assert_eq!(s1, UserState::Active);
        assert_eq!(a1, TransitionAction::NoChange);
        state = s1;

        // Becomes Idle
        let (s2, a2) = evaluate_transition(state, IdleObservation::Duration(Duration::from_secs(300)), TEST_THRESHOLD);
        assert_eq!(s2, UserState::Idle);
        assert_eq!(a2, TransitionAction::TransitionToIdle);
        state = s2;

        // Remains Idle
        let (s3, a3) = evaluate_transition(state, IdleObservation::Duration(Duration::from_secs(305)), TEST_THRESHOLD);
        assert_eq!(s3, UserState::Idle);
        assert_eq!(a3, TransitionAction::NoChange);
        state = s3;

        // Returns to Active
        let (s4, a4) = evaluate_transition(state, IdleObservation::Duration(Duration::from_secs(1)), TEST_THRESHOLD);
        assert_eq!(s4, UserState::Active);
        assert_eq!(a4, TransitionAction::TransitionToActive);
        state = s4;

        // Remains Active
        let (s5, a5) = evaluate_transition(state, IdleObservation::Duration(Duration::from_secs(5)), TEST_THRESHOLD);
        assert_eq!(s5, UserState::Active);
        assert_eq!(a5, TransitionAction::NoChange);
    }
}
