use std::time::Duration;
use tauri::Emitter;

pub mod linux;
pub mod windows;

pub const EVENT_NETWORK_ONLINE: &str = "native://network-online";
pub const EVENT_NETWORK_OFFLINE: &str = "native://network-offline";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum NetworkConnectivityState {
    Online,
    Offline,
    Unknown,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum MonitorAction {
    BaselineCaptured(NetworkConnectivityState),
    StateChanged {
        from: NetworkConnectivityState,
        to: NetworkConnectivityState,
    },
    PendingConfirmation,
    NoChange,
}

pub struct NetworkMonitor {
    confirmed_state: Option<NetworkConnectivityState>,
    pending_state: Option<NetworkConnectivityState>,
    pending_count: u32,
    confirmation_threshold: u32,
}

impl NetworkMonitor {
    pub fn new(confirmation_threshold: u32) -> Self {
        Self {
            confirmed_state: None,
            pending_state: None,
            pending_count: 0,
            confirmation_threshold,
        }
    }

    pub fn process_observation(&mut self, observation: NetworkConnectivityState) -> MonitorAction {
        // Step 1: Unknown observations are ignored and retain previous confirmed state
        if observation == NetworkConnectivityState::Unknown {
            self.pending_state = None;
            self.pending_count = 0;
            return MonitorAction::NoChange;
        }

        // Step 2: Startup Baseline Capture
        if self.confirmed_state.is_none() {
            self.confirmed_state = Some(observation);
            self.pending_state = None;
            self.pending_count = 0;
            return MonitorAction::BaselineCaptured(observation);
        }

        let current_confirmed = self.confirmed_state.unwrap();

        // Step 3: Same state as confirmed
        if observation == current_confirmed {
            self.pending_state = None;
            self.pending_count = 0;
            return MonitorAction::NoChange;
        }

        // Step 4: State transition candidate (observation != current_confirmed)
        if self.confirmation_threshold <= 1 {
            self.confirmed_state = Some(observation);
            self.pending_state = None;
            self.pending_count = 0;
            return MonitorAction::StateChanged {
                from: current_confirmed,
                to: observation,
            };
        }

        // Handle debounced confirmation threshold
        if self.pending_state == Some(observation) {
            self.pending_count += 1;
        } else {
            self.pending_state = Some(observation);
            self.pending_count = 1;
        }

        if self.pending_count >= self.confirmation_threshold {
            let old_state = current_confirmed;
            self.confirmed_state = Some(observation);
            self.pending_state = None;
            self.pending_count = 0;
            MonitorAction::StateChanged {
                from: old_state,
                to: observation,
            }
        } else {
            MonitorAction::PendingConfirmation
        }
    }

    pub fn confirmed_state(&self) -> Option<NetworkConnectivityState> {
        self.confirmed_state
    }
}

/// Retrieves the raw OS network connectivity state for the current platform.
pub fn get_current_network_state() -> NetworkConnectivityState {
    #[cfg(target_os = "windows")]
    {
        windows::get_os_network_state()
    }
    #[cfg(target_os = "linux")]
    {
        linux::get_os_network_state()
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        NetworkConnectivityState::Online
    }
}

/// Starts background network connectivity monitor on a non-blocking thread.
pub fn start_network_monitor(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut monitor = NetworkMonitor::new(1);

        loop {
            let obs = get_current_network_state();
            let action = monitor.process_observation(obs);

            match action {
                MonitorAction::StateChanged { to, .. } => {
                    let event_name = match to {
                        NetworkConnectivityState::Online => EVENT_NETWORK_ONLINE,
                        NetworkConnectivityState::Offline => EVENT_NETWORK_OFFLINE,
                        NetworkConnectivityState::Unknown => "",
                    };

                    if !event_name.is_empty() {
                        if let Err(err) = app_handle.emit(event_name, ()) {
                            eprintln!(
                                "[DeskBuddy Network Monitor] Failed to emit {:?}: {:?}",
                                event_name, err
                            );
                        }
                    }
                }
                _ => {}
            }

            std::thread::sleep(Duration::from_secs(5));
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_startup_baseline_capture_online() {
        let mut monitor = NetworkMonitor::new(1);
        let action = monitor.process_observation(NetworkConnectivityState::Online);
        assert_eq!(
            action,
            MonitorAction::BaselineCaptured(NetworkConnectivityState::Online)
        );
        assert_eq!(
            monitor.confirmed_state(),
            Some(NetworkConnectivityState::Online)
        );
    }

    #[test]
    fn test_startup_baseline_capture_offline() {
        let mut monitor = NetworkMonitor::new(1);
        let action = monitor.process_observation(NetworkConnectivityState::Offline);
        assert_eq!(
            action,
            MonitorAction::BaselineCaptured(NetworkConnectivityState::Offline)
        );
        assert_eq!(
            monitor.confirmed_state(),
            Some(NetworkConnectivityState::Offline)
        );
    }

    #[test]
    fn test_stable_online_no_event() {
        let mut monitor = NetworkMonitor::new(1);
        monitor.process_observation(NetworkConnectivityState::Online); // Baseline

        let action2 = monitor.process_observation(NetworkConnectivityState::Online);
        assert_eq!(action2, MonitorAction::NoChange);

        let action3 = monitor.process_observation(NetworkConnectivityState::Online);
        assert_eq!(action3, MonitorAction::NoChange);
    }

    #[test]
    fn test_stable_offline_no_event() {
        let mut monitor = NetworkMonitor::new(1);
        monitor.process_observation(NetworkConnectivityState::Offline); // Baseline

        let action2 = monitor.process_observation(NetworkConnectivityState::Offline);
        assert_eq!(action2, MonitorAction::NoChange);
    }

    #[test]
    fn test_transition_online_to_offline_immediate() {
        let mut monitor = NetworkMonitor::new(1);
        monitor.process_observation(NetworkConnectivityState::Online); // Baseline

        let action = monitor.process_observation(NetworkConnectivityState::Offline);
        assert_eq!(
            action,
            MonitorAction::StateChanged {
                from: NetworkConnectivityState::Online,
                to: NetworkConnectivityState::Offline,
            }
        );
        assert_eq!(
            monitor.confirmed_state(),
            Some(NetworkConnectivityState::Offline)
        );
    }

    #[test]
    fn test_transition_offline_to_online_immediate() {
        let mut monitor = NetworkMonitor::new(1);
        monitor.process_observation(NetworkConnectivityState::Offline); // Baseline

        let action = monitor.process_observation(NetworkConnectivityState::Online);
        assert_eq!(
            action,
            MonitorAction::StateChanged {
                from: NetworkConnectivityState::Offline,
                to: NetworkConnectivityState::Online,
            }
        );
        assert_eq!(
            monitor.confirmed_state(),
            Some(NetworkConnectivityState::Online)
        );
    }

    #[test]
    fn test_unknown_observation_preserves_confirmed_state() {
        let mut monitor = NetworkMonitor::new(1);
        monitor.process_observation(NetworkConnectivityState::Online); // Baseline Online

        let action = monitor.process_observation(NetworkConnectivityState::Unknown);
        assert_eq!(action, MonitorAction::NoChange);
        assert_eq!(
            monitor.confirmed_state(),
            Some(NetworkConnectivityState::Online)
        );
    }

    #[test]
    fn test_confirmation_debouncing() {
        let mut monitor = NetworkMonitor::new(2); // Requires 2 consecutive checks
        monitor.process_observation(NetworkConnectivityState::Online); // Baseline

        // Check 1: Pending
        let action1 = monitor.process_observation(NetworkConnectivityState::Offline);
        assert_eq!(action1, MonitorAction::PendingConfirmation);
        assert_eq!(
            monitor.confirmed_state(),
            Some(NetworkConnectivityState::Online)
        );

        // Check 2: Confirmed transition
        let action2 = monitor.process_observation(NetworkConnectivityState::Offline);
        assert_eq!(
            action2,
            MonitorAction::StateChanged {
                from: NetworkConnectivityState::Online,
                to: NetworkConnectivityState::Offline,
            }
        );
        assert_eq!(
            monitor.confirmed_state(),
            Some(NetworkConnectivityState::Offline)
        );
    }
}
