import { PetPersonality } from './personality.types';

export const DEFAULT_PERSONALITY: Readonly<PetPersonality> = Object.freeze({
  curiosity: 0.75,
  sociability: 0.70,
  calmness: 0.55,
});
