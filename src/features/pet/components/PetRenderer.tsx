import React from 'react';
import { usePetStore } from '../model/pet.store';
import { RivePetRenderer } from './RivePetRenderer';

export function PetRenderer(): React.ReactElement {
  const state = usePetStore((s) => s.state);

  return <RivePetRenderer petState={state} />;
}
