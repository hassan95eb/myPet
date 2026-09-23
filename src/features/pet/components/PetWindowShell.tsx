import React, { useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { PetRenderer } from './PetRenderer';
import { PetDevControls } from './PetDevControls';
import { EventSimulatorDevControl } from '../../dev/components/EventSimulatorDevControl';
import { initPetBrainRuntime, onReactionIntent } from '../brain/pet-brain-runtime';
import { reactionEngine } from '../reactions/reaction-engine.instance';

export function PetWindowShell(): React.ReactElement {
  useEffect(() => {
    // Initialize Pet Brain runtime on application shell mount
    const cleanupBrain = initPetBrainRuntime();

    // Wire Reaction Engine to receive ReactionIntents from Pet Brain
    const unsubIntent = onReactionIntent((intent) => {
      reactionEngine.handle(intent);
    });

    return () => {
      unsubIntent();
      cleanupBrain();
      reactionEngine.dispose();
    };
  }, []);

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

      {/* Pet State Dev Controls Dropdown */}
      <PetDevControls />

      {/* Development Event Simulator Control */}
      <EventSimulatorDevControl />

      {/* Main Pet Renderer */}
      <PetRenderer />
    </div>
  );
}

/**
 * Backward compatibility alias for Step 01 references if needed
 */
export const PetPlaceholder = PetWindowShell;
