use std::collections::HashSet;
use std::time::Duration;
use serde::Serialize;
use sysinfo::{ProcessesToUpdate, System};
use tauri::Emitter;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationPayload {
    pub application_name: String,
}

pub const EVENT_APPLICATION_OPENED: &str = "native://application-opened";
pub const EVENT_APPLICATION_CLOSED: &str = "native://application-closed";

/// Normalizes raw executable/process names into stable, user-facing application names.
/// Returns `None` for DeskBuddy itself or excluded system processes.
pub fn normalize_application_name(raw_name: &str) -> Option<String> {
    let trimmed = raw_name.trim();
    if trimmed.is_empty() {
        return None;
    }

    // Strip trailing .exe (case-insensitive)
    let base_name = if trimmed.to_lowercase().ends_with(".exe") {
        &trimmed[..trimmed.len() - 4]
    } else {
        trimmed
    };

    let lower = base_name.to_lowercase();

    // Explicit self-filter
    if lower == "deskbuddy" {
        return None;
    }

    // Common system background noise filter
    let ignored_processes = [
        "svchost", "systemd", "init", "kthreadd", "dbus-daemon", "wslservice",
        "conhost", "csrss", "lsass", "services", "smss", "wininit", "explorer",
        "taskhostw", "runtimebroker", "sihost", "ctfmon", "dwrm", "dwm",
    ];
    if ignored_processes.contains(&lower.as_str()) {
        return None;
    }

    // Known dictionary normalization
    let known_name = match lower.as_str() {
        "chrome" => "Google Chrome",
        "code" => "Visual Studio Code",
        "spotify" => "Spotify",
        "firefox" => "Mozilla Firefox",
        "discord" => "Discord",
        "slack" => "Slack",
        "notepad" => "Notepad",
        "calc" | "calculator" | "calculatorapp" => "Calculator",
        "msedge" => "Microsoft Edge",
        "steam" => "Steam",
        _ => "",
    };

    if !known_name.is_empty() {
        return Some(known_name.to_string());
    }

    // Fallback: capitalize first letter of the binary base name
    let mut chars = base_name.chars();
    match chars.next() {
        None => None,
        Some(first) => {
            let capitalized = first.to_uppercase().collect::<String>() + chars.as_str();
            Some(capitalized)
        }
    }
}

/// Returns a set of unique normalized application names currently running.
pub fn get_running_applications(sys: &mut System) -> HashSet<String> {
    sys.refresh_processes(ProcessesToUpdate::All, true);
    let mut active_apps = HashSet::new();

    for (_pid, process) in sys.processes() {
        let raw_name = process.name().to_string_lossy();
        if let Some(normalized) = normalize_application_name(&raw_name) {
            active_apps.insert(normalized);
        }
    }

    active_apps
}

/// Calculates opened and closed applications between two process snapshots.
pub fn diff_snapshots(
    previous: &HashSet<String>,
    current: &HashSet<String>,
) -> (Vec<String>, Vec<String>) {
    let mut opened: Vec<String> = current.difference(previous).cloned().collect();
    let mut closed: Vec<String> = previous.difference(current).cloned().collect();

    opened.sort();
    closed.sort();

    (opened, closed)
}

/// Starts native application monitoring loop in a background OS thread.
pub fn start_application_monitor(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut sys = System::new();

        // Capture initial startup baseline snapshot (no events emitted)
        let mut previous_apps = get_running_applications(&mut sys);

        loop {
            std::thread::sleep(Duration::from_secs(3));

            let current_apps = get_running_applications(&mut sys);
            let (opened, closed) = diff_snapshots(&previous_apps, &current_apps);

            for app_name in opened {
                let payload = ApplicationPayload {
                    application_name: app_name,
                };
                if let Err(err) = app_handle.emit(EVENT_APPLICATION_OPENED, &payload) {
                    eprintln!("[DeskBuddy Native Monitor] Failed to emit application opened event: {:?}", err);
                }
            }

            for app_name in closed {
                let payload = ApplicationPayload {
                    application_name: app_name,
                };
                if let Err(err) = app_handle.emit(EVENT_APPLICATION_CLOSED, &payload) {
                    eprintln!("[DeskBuddy Native Monitor] Failed to emit application closed event: {:?}", err);
                }
            }

            previous_apps = current_apps;
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_application_name_known() {
        assert_eq!(normalize_application_name("chrome.exe"), Some("Google Chrome".to_string()));
        assert_eq!(normalize_application_name("chrome"), Some("Google Chrome".to_string()));
        assert_eq!(normalize_application_name("Code.exe"), Some("Visual Studio Code".to_string()));
        assert_eq!(normalize_application_name("spotify"), Some("Spotify".to_string()));
    }

    #[test]
    fn test_normalize_application_name_self_filter() {
        assert_eq!(normalize_application_name("deskbuddy.exe"), None);
        assert_eq!(normalize_application_name("deskbuddy"), None);
        assert_eq!(normalize_application_name("DeskBuddy"), None);
    }

    #[test]
    fn test_normalize_application_name_fallback() {
        assert_eq!(normalize_application_name("vlc.exe"), Some("Vlc".to_string()));
        assert_eq!(normalize_application_name("customApp"), Some("CustomApp".to_string()));
    }

    #[test]
    fn test_diff_snapshots() {
        let mut previous = HashSet::new();
        previous.insert("Google Chrome".to_string());
        previous.insert("Spotify".to_string());

        let mut current = HashSet::new();
        current.insert("Google Chrome".to_string());
        current.insert("Visual Studio Code".to_string());

        let (opened, closed) = diff_snapshots(&previous, &current);

        assert_eq!(opened, vec!["Visual Studio Code".to_string()]);
        assert_eq!(closed, vec!["Spotify".to_string()]);
    }

    #[test]
    fn test_multi_process_presence_aggregation_diff() {
        // Multiple processes of Chrome produce a single "Google Chrome" in the set.
        let mut previous = HashSet::new();
        previous.insert("Google Chrome".to_string());

        let mut current = HashSet::new();
        current.insert("Google Chrome".to_string());

        let (opened, closed) = diff_snapshots(&previous, &current);

        assert!(opened.is_empty());
        assert!(closed.is_empty());
    }
}
