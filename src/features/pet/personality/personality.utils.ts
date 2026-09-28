import { DEFAULT_PERSONALITY } from './personality.config';
import { PetPersonality } from './personality.types';

function clampTrait(value: number | undefined, defaultValue: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return defaultValue;
  }
  return Math.min(1.0, Math.max(0.0, value));
}

export function normalizePersonality(
  personality?: Partial<PetPersonality>
): PetPersonality {
  if (!personality) {
    return { ...DEFAULT_PERSONALITY };
  }

  return {
    curiosity: clampTrait(personality.curiosity, DEFAULT_PERSONALITY.curiosity),
    sociability: clampTrait(
      personality.sociability,
      DEFAULT_PERSONALITY.sociability
    ),
    calmness: clampTrait(personality.calmness, DEFAULT_PERSONALITY.calmness),
  };
}
