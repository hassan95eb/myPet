export const PET_STATES = [
  'idle',
  'walking',
  'sleeping',
  'happy',
  'angry',
  'surprised',
  'listening',
] as const;

export type PetState = (typeof PET_STATES)[number];
