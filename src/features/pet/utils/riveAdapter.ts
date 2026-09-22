import { PetState } from '../model/pet.types';

export const DEFAULT_RIVE_ASSET_PATH = '/assets/pet/deskbuddy.riv';
export const DEFAULT_RIVE_STATE_MACHINE = 'PetStateMachine';

export interface RiveStateConfig {
  /** Rive state machine state name or input name */
  riveStateName: string;
  /** Optional trigger or numeric input value if state machine uses inputs */
  inputValue?: number | boolean;
}

/**
 * Adapter mapping DeskBuddy domain PetState to Rive animation/state machine representations.
 * This decouples application domain state from Rive internals.
 */
export const PET_RIVE_STATE_MAP: Record<PetState, RiveStateConfig> = {
  idle: { riveStateName: 'idle' },
  walking: { riveStateName: 'walking' },
  sleeping: { riveStateName: 'sleeping' },
  happy: { riveStateName: 'happy' },
  angry: { riveStateName: 'angry' },
  surprised: { riveStateName: 'surprised' },
  listening: { riveStateName: 'listening' },
};

/**
 * Returns the mapped Rive configuration for a given domain PetState.
 */
export function getRiveConfigForPetState(petState: PetState): RiveStateConfig {
  return PET_RIVE_STATE_MAP[petState] ?? PET_RIVE_STATE_MAP.idle;
}
