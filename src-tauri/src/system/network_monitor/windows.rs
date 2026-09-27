use super::NetworkConnectivityState;

#[cfg(target_os = "windows")]
pub fn get_os_network_state() -> NetworkConnectivityState {
    use windows_sys::Win32::Networking::WinSock::GetIsNetworkAvailable;

    unsafe {
        if GetIsNetworkAvailable() != 0 {
            NetworkConnectivityState::Online
        } else {
            NetworkConnectivityState::Offline
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn get_os_network_state() -> NetworkConnectivityState {
    NetworkConnectivityState::Unknown
}
