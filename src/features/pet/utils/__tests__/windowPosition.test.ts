import { describe, it, expect, vi, beforeEach } from 'vitest';
import { positionWindowBottomRight } from '../windowPosition';

const mockSetPosition = vi.fn().mockResolvedValue(undefined);
const mockOuterSize = vi.fn().mockResolvedValue({ width: 200, height: 200 });

interface MockMonitor {
  scaleFactor: number;
  size: { width: number; height: number };
  position: { x: number; y: number };
  workArea: {
    size: { width: number; height: number };
    position: { x: number; y: number };
  };
}

let mockMonitor: MockMonitor | null = null;

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    setPosition: mockSetPosition,
    outerSize: mockOuterSize,
  }),
  primaryMonitor: () => Promise.resolve(mockMonitor),
  PhysicalPosition: class PhysicalPosition {
    x: number;
    y: number;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  },
}));

describe('windowPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates correct bottom-right position using work area bounds', async () => {
    mockMonitor = {
      scaleFactor: 1,
      size: { width: 1920, height: 1080 },
      position: { x: 0, y: 0 },
      workArea: {
        size: { width: 1920, height: 1040 }, // e.g. 40px taskbar
        position: { x: 0, y: 0 },
      },
    };

    await positionWindowBottomRight(16);

    // Expected x = 0 + 1920 - 200 - 16 = 1704
    // Expected y = 0 + 1040 - 200 - 16 = 824
    expect(mockSetPosition).toHaveBeenCalledWith({ x: 1704, y: 824 });
  });

  it('handles scaling factor correctly', async () => {
    mockMonitor = {
      scaleFactor: 1.5,
      size: { width: 2880, height: 1620 },
      position: { x: 0, y: 0 },
      workArea: {
        size: { width: 2880, height: 1560 },
        position: { x: 0, y: 0 },
      },
    };

    await positionWindowBottomRight(10);

    // Padding physical = Math.round(10 * 1.5) = 15
    // x = 0 + 2880 - 200 - 15 = 2665
    // y = 0 + 1560 - 200 - 15 = 1345
    expect(mockSetPosition).toHaveBeenCalledWith({ x: 2665, y: 1345 });
  });

  it('handles null primary monitor gracefully without throwing', async () => {
    mockMonitor = null;
    await expect(positionWindowBottomRight(16)).resolves.not.toThrow();
    expect(mockSetPosition).not.toHaveBeenCalled();
  });
});
