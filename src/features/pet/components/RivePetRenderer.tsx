import React, { useEffect, useState, useCallback } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { PetState } from '../model/pet.types';
import {
  DEFAULT_RIVE_ASSET_PATH,
  DEFAULT_RIVE_STATE_MACHINE,
  getRiveConfigForPetState,
} from '../utils/riveAdapter';
import { StaticPetFallback } from './StaticPetFallback';

interface RivePetRendererProps {
  petState: PetState;
  assetPath?: string;
  stateMachineName?: string;
}

export function RivePetRenderer({
  petState,
  assetPath = DEFAULT_RIVE_ASSET_PATH,
  stateMachineName = DEFAULT_RIVE_STATE_MACHINE,
}: RivePetRendererProps): React.ReactElement {
  const [hasError, setHasError] = useState(false);

  const handleLoadError = useCallback(() => {
    // Log development warning and gracefully fall back to static renderer
    if (import.meta.env.DEV) {
      console.warn(
        `[DeskBuddy Rive] Failed to load Rive asset at "${assetPath}". Falling back to static renderer.`
      );
    }
    setHasError(true);
  }, [assetPath]);

  const { RiveComponent, rive } = useRive({
    src: assetPath,
    stateMachine: stateMachineName,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoadError: handleLoadError,
  });

  // Apply state updates to Rive instance via state machine inputs or state names
  useEffect(() => {
    if (!rive || hasError) return;

    try {
      const config = getRiveConfigForPetState(petState);
      const inputs = rive.stateMachineInputs(stateMachineName);

      if (inputs && inputs.length > 0) {
        // Find corresponding input trigger/boolean/number if defined in state machine
        const targetInput = inputs.find((i) => i.name === config.riveStateName);
        if (targetInput) {
          if (typeof config.inputValue === 'number' || typeof config.inputValue === 'boolean') {
            targetInput.value = config.inputValue;
          } else {
            // Trigger input if applicable
            targetInput.fire();
          }
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[DeskBuddy Rive] Error updating Rive state machine input:', err);
      }
    }
  }, [rive, petState, stateMachineName, hasError]);

  if (hasError) {
    return <StaticPetFallback petState={petState} />;
  }

  return (
    <div
      data-tauri-drag-region
      data-testid="pet-renderer-container"
      data-pet-state={petState}
      className="relative w-36 h-36 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
    >
      <RiveComponent
        data-tauri-drag-region
        className="w-full h-full pointer-events-none"
      />
    </div>
  );
}
