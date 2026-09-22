pub mod commands;
pub mod events;
pub mod system;

#[tauri::command]
fn get_app_status() -> String {
    "DeskBuddy Core Initialized".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_app_status,
            commands::get_app_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
