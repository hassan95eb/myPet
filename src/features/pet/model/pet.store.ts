import { create } from 'zustand';
import { PetState } from './pet.types';

export interface PetStore {
  state: PetState;
  setState: (state: PetState) => void;
}

export const usePetStore = create<PetStore>((set) => ({
  state: 'idle',
  setState: (state) => set({ state }),
}));
