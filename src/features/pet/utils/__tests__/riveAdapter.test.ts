import { describe, it, expect } from 'vitest';
import { PET_STATES, PetState } from '../../model/pet.types';
import {
  DEFAULT_RIVE_ASSET_PATH,
  DEFAULT_RIVE_STATE_MACHINE,
  PET_RIVE_STATE_MAP,
  getRiveConfigForPetState,
} from '../riveAdapter';

describe('riveAdapter', () => {
  it('defines correct default asset path and state machine name', () => {
    expect(DEFAULT_RIVE_ASSET_PATH).toBe('/assets/pet/deskbuddy.riv');
    expect(DEFAULT_RIVE_STATE_MACHINE).toBe('PetStateMachine');
  });

  it('maps every PetState to a RiveStateConfig', () => {
    PET_STATES.forEach((state) => {
      const config = PET_RIVE_STATE_MAP[state];
      expect(config).toBeDefined();
      expect(config.riveStateName).toBe(state);
    });
  });

  it('getRiveConfigForPetState returns valid config for known state', () => {
    const config = getRiveConfigForPetState('sleeping');
    expect(config).toEqual({ riveStateName: 'sleeping' });
  });

  it('getRiveConfigForPetState falls back to idle for invalid/unknown state', () => {
    const config = getRiveConfigForPetState('unknown' as PetState);
    expect(config).toEqual({ riveStateName: 'idle' });
  });
});
