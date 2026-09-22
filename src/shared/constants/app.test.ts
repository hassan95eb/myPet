import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_VERSION } from '../constants/app';

describe('App Constants', () => {
  it('should have correct application metadata', () => {
    expect(APP_NAME).toBe('DeskBuddy');
    expect(APP_VERSION).toBe('0.1.0');
  });
});
