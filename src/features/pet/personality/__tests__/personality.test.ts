import { describe, it, expect } from 'vitest';
import { DEFAULT_PERSONALITY } from '../personality.config';
import { normalizePersonality } from '../personality.utils';

describe('PetPersonality Model & Utilities', () => {
  it('has correct default personality trait values', () => {
    expect(DEFAULT_PERSONALITY).toEqual({
      curiosity: 0.75,
      sociability: 0.7,
      calmness: 0.55,
    });
  });

  it('is frozen and immutable', () => {
    expect(Object.isFrozen(DEFAULT_PERSONALITY)).toBe(true);
  });

  it('normalizes undefined or empty input to DEFAULT_PERSONALITY', () => {
    expect(normalizePersonality()).toEqual(DEFAULT_PERSONALITY);
    expect(normalizePersonality({})).toEqual(DEFAULT_PERSONALITY);
  });

  it('clamps trait values out of [0.0, 1.0] range', () => {
    const normalized = normalizePersonality({
      curiosity: -0.5,
      sociability: 1.5,
      calmness: 0.5,
    });

    expect(normalized).toEqual({
      curiosity: 0.0,
      sociability: 1.0,
      calmness: 0.5,
    });
  });

  it('falls back to DEFAULT_PERSONALITY traits for invalid/non-finite numbers', () => {
    const normalized = normalizePersonality({
      curiosity: NaN,
      sociability: Infinity,
      calmness: -Infinity,
    });

    expect(normalized).toEqual(DEFAULT_PERSONALITY);
  });

  it('merges partial valid values with defaults', () => {
    const normalized = normalizePersonality({
      curiosity: 0.2,
    });

    expect(normalized).toEqual({
      curiosity: 0.2,
      sociability: 0.7,
      calmness: 0.55,
    });
  });
});
