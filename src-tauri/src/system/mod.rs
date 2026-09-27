// DeskBuddy native system integration module

pub mod application_monitor;
pub mod network_monitor;

/// Initializes native system monitors (application/process, network, idle).
pub fn init_system_monitors(app_handle: tauri::AppHandle) {
    application_monitor::start_application_monitor(app_handle.clone());
    network_monitor::start_network_monitor(app_handle);
}
