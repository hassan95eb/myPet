import { getCurrentWindow, primaryMonitor, PhysicalPosition } from '@tauri-apps/api/window';

/**
 * Positions the DeskBuddy window in the bottom-right corner of the primary monitor's
 * available work area with padding.
 *
 * Runs once at startup. Falls back gracefully to default window placement if monitor or
 * window dimensions are unavailable/unusable.
 */
export async function positionWindowBottomRight(padding = 16): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    const monitor = await primaryMonitor();

    if (!monitor) {
      console.warn('Primary monitor info not available; using default window position.');
      return;
    }

    const scaleFactor = monitor.scaleFactor || 1;
    const workAreaSize = monitor.workArea?.size || monitor.size;
    const workAreaPosition = monitor.workArea?.position || monitor.position;

    const outerSize = await appWindow.outerSize();

    if (!outerSize || outerSize.width <= 0 || outerSize.height <= 0) {
      console.warn('Invalid window size retrieved; skipping position adjustment.');
      return;
    }

    // Convert padding from logical to physical pixels based on monitor scale factor
    const physicalPadding = Math.round(padding * scaleFactor);

    // Calculate bottom-right position within available work area
    const x = workAreaPosition.x + workAreaSize.width - outerSize.width - physicalPadding;
    const y = workAreaPosition.y + workAreaSize.height - outerSize.height - physicalPadding;

    // Ensure coordinates are non-negative relative to top-left bounds
    const safeX = Math.max(workAreaPosition.x, x);
    const safeY = Math.max(workAreaPosition.y, y);

    await appWindow.setPosition(new PhysicalPosition(safeX, safeY));
  } catch (err) {
    console.warn('Failed to position DeskBuddy window at bottom-right (fallback active):', err);
  }
}
