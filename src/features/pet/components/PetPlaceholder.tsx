import React, { useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function PetPlaceholder(): React.ReactElement {
  const handleClose = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (err) {
      console.warn('Failed to close window via Tauri API (standalone web mode?):', err);
    }
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 group">
      {/* Dev Close Control - appears on hover, outside drag region */}
      <button
        type="button"
        onClick={handleClose}
        title="Close DeskBuddy (Dev Escape Hatch)"
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md cursor-pointer z-50 pointer-events-auto"
        aria-label="Close DeskBuddy"
      >
        ×
      </button>

      {/* Pet Character Drag Shell */}
      <div
        data-tauri-drag-region
        className="w-36 h-36 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-2xl flex flex-col items-center justify-between cursor-grab active:cursor-grabbing border border-white/20 select-none"
      >
        {/* Inner Card Content */}
        <div
          data-tauri-drag-region
          className="w-full h-full bg-slate-900/90 rounded-[20px] p-3 flex flex-col items-center justify-center text-center backdrop-blur-sm pointer-events-none"
        >
          {/* Face Expression */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>

          <div className="w-6 h-1.5 rounded-full bg-slate-300/80 mb-3" />

          {/* Label */}
          <span className="text-[11px] font-semibold tracking-wider text-slate-200 uppercase">
            DeskBuddy
          </span>
          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
            Step 01 Shell
          </span>
        </div>
      </div>
    </div>
  );
}
