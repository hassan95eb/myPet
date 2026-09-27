// DeskBuddy native system integration module

pub mod application_monitor;

/// Initializes native system monitors (application/process, network, idle).
pub fn init_system_monitors(app_handle: tauri::AppHandle) {
    application_monitor::start_application_monitor(app_handle);
}
