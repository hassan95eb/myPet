// DeskBuddy IPC commands module
// Native commands exposed to frontend layer live here.

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
