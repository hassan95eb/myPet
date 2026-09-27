use super::NetworkConnectivityState;
use std::fs;

#[cfg(target_os = "linux")]
pub fn get_os_network_state() -> NetworkConnectivityState {
    // Check /proc/net/route for active default route (Destination 00000000)
    let route_contents = match fs::read_to_string("/proc/net/route") {
        Ok(c) => c,
        Err(_) => return NetworkConnectivityState::Unknown,
    };

    let mut has_default_route = false;
    let mut default_iface = String::new();

    for line in route_contents.lines().skip(1) {
        let fields: Vec<&str> = line.split_whitespace().collect();
        if fields.len() >= 4 {
            let iface = fields[0];
            let dest = fields[1];
            let flags_hex = fields[3];

            // Ignore loopback and docker virtual interfaces
            if iface.starts_with("lo") || iface.starts_with("docker") {
                continue;
            }

            if dest == "00000000" {
                if let Ok(flags) = u16::from_str_radix(flags_hex, 16) {
                    // RTF_UP flag is 0x0001
                    if (flags & 0x0001) != 0 {
                        has_default_route = true;
                        default_iface = iface.to_string();
                        break;
                    }
                }
            }
        }
    }

    if !has_default_route {
        return NetworkConnectivityState::Offline;
    }

    // Check interface operstate if default interface found
    let operstate_path = format!("/sys/class/net/{}/operstate", default_iface);
    if let Ok(operstate) = fs::read_to_string(&operstate_path) {
        let state_str = operstate.trim().to_lowercase();
        if state_str == "down" {
            return NetworkConnectivityState::Offline;
        }
    }

    NetworkConnectivityState::Online
}

#[cfg(not(target_os = "linux"))]
pub fn get_os_network_state() -> NetworkConnectivityState {
    NetworkConnectivityState::Unknown
}
