import { describe, it, expect, beforeEach } from 'vitest';
import { usePetStore } from '../model/pet.store';
import { PET_STATES } from '../model/pet.types';

describe('PetStore', () => {
  beforeEach(() => {
    usePetStore.setState({ state: 'idle' });
  });

  it('starts with default state "idle"', () => {
    expect(usePetStore.getState().state).toBe('idle');
  });

  it('updates state via setState', () => {
    usePetStore.getState().setState('happy');
    expect(usePetStore.getState().state).toBe('happy');
  });

  it('supports setting all valid states', () => {
    PET_STATES.forEach((state) => {
      usePetStore.getState().setState(state);
      expect(usePetStore.getState().state).toBe(state);
    });
  });
});
