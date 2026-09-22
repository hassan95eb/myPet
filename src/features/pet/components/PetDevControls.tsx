import React, { useCallback } from 'react';
import { usePetStore } from '../model/pet.store';
import { PET_STATES, PetState } from '../model/pet.types';

export function PetDevControls(): React.ReactElement | null {
  const currentState = usePetStore((s) => s.state);
  const setState = usePetStore((s) => s.setState);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setState(e.target.value as PetState);
    },
    [setState]
  );

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div
      data-testid="pet-dev-controls"
      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    >
      <select
        value={currentState}
        onChange={handleChange}
        aria-label="Pet State Controls"
        className="bg-slate-900/90 text-slate-200 text-[10px] font-mono font-medium py-0.5 px-1.5 rounded-md border border-slate-700/80 hover:border-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-md cursor-pointer pointer-events-auto"
      >
        {PET_STATES.map((state) => (
          <option key={state} value={state} className="bg-slate-900 text-slate-200 text-xs">
            {state}
          </option>
        ))}
      </select>
    </div>
  );
}
