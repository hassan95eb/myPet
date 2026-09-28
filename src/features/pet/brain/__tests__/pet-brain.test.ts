import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evaluatePetEvent } from '../pet-brain';
import {
  initPetBrainRuntime,
  onReactionIntent,
  cleanupPetBrainRuntime,
} from '../pet-brain-runtime';
import { createDomainEventBus } from '../../../../core/events/domain-event-bus';
import { usePetStore } from '../../model/pet.store';
import { DEFAULT_PERSONALITY } from '../../personality';

describe('PetBrain (evaluatePetEvent) Default Behavior Regression', () => {
  it('maps application.opened to curious intent with context using DEFAULT_PERSONALITY', () => {
    const event = {
      type: 'application.opened' as const,
      occurredAt: 1000,
      payload: { applicationName: 'Google Chrome' },
    };

    const intent = evaluatePetEvent(event);

    expect(intent).toEqual({
      type: 'curious',
      causedBy: 'application.opened',
      context: { applicationName: 'Google Chrome' },
    });
  });

  it('maps application.closed to notice intent with context using DEFAULT_PERSONALITY', () => {
    const event = {
      type: 'application.closed' as const,
      occurredAt: 1000,
      payload: { applicationName: 'Spotify' },
    };

    const intent = evaluatePetEvent(event);

    expect(intent).toEqual({
      type: 'notice',
      causedBy: 'application.closed',
      context: { applicationName: 'Spotify' },
    });
  });

  it('maps network.offline to concerned intent using DEFAULT_PERSONALITY', () => {
    const intent = evaluatePetEvent({
      type: 'network.offline',
      occurredAt: 1000,
    });

    expect(intent).toEqual({
      type: 'concerned',
      causedBy: 'network.offline',
    });
  });

  it('maps network.online to pleased intent using DEFAULT_PERSONALITY', () => {
    const intent = evaluatePetEvent({
      type: 'network.online',
      occurredAt: 1000,
    });

    expect(intent).toEqual({
      type: 'pleased',
      causedBy: 'network.online',
    });
  });

  it('maps user.idle to sleepy intent using DEFAULT_PERSONALITY', () => {
    const intent = evaluatePetEvent({
      type: 'user.idle',
      occurredAt: 1000,
    });

    expect(intent).toEqual({
      type: 'sleepy',
      causedBy: 'user.idle',
    });
  });

  it('maps user.active to attentive intent using DEFAULT_PERSONALITY', () => {
    const intent = evaluatePetEvent({
      type: 'user.active',
      occurredAt: 1000,
    });

    expect(intent).toEqual({
      type: 'attentive',
      causedBy: 'user.active',
    });
  });

  it('is deterministic for identical inputs', () => {
    const event = {
      type: 'network.offline' as const,
      occurredAt: 12345,
    };

    const intent1 = evaluatePetEvent(event, DEFAULT_PERSONALITY);
    const intent2 = evaluatePetEvent(event, DEFAULT_PERSONALITY);

    expect(intent1).toEqual(intent2);
  });
});

describe('PetBrain Personality Influence', () => {
  const eventAppOpened = {
    type: 'application.opened' as const,
    occurredAt: 1000,
    payload: { applicationName: 'VS Code' },
  };

  const eventUserActive = {
    type: 'user.active' as const,
    occurredAt: 1000,
  };

  const eventNetworkOffline = {
    type: 'network.offline' as const,
    occurredAt: 1000,
  };

  describe('Curiosity', () => {
    it('produces curious when curiosity >= 0.40', () => {
      const intentHigh = evaluatePetEvent(eventAppOpened, {
        curiosity: 0.8,
        sociability: 0.7,
        calmness: 0.55,
      });
      expect(intentHigh?.type).toBe('curious');

      const intentBoundary = evaluatePetEvent(eventAppOpened, {
        curiosity: 0.4,
        sociability: 0.7,
        calmness: 0.55,
      });
      expect(intentBoundary?.type).toBe('curious');
    });

    it('produces null when curiosity < 0.40', () => {
      const intentLow = evaluatePetEvent(eventAppOpened, {
        curiosity: 0.2,
        sociability: 0.7,
        calmness: 0.55,
      });
      expect(intentLow).toBeNull();
    });
  });

  describe('Sociability', () => {
    it('produces attentive when sociability >= 0.40', () => {
      const intentHigh = evaluatePetEvent(eventUserActive, {
        curiosity: 0.75,
        sociability: 0.8,
        calmness: 0.55,
      });
      expect(intentHigh?.type).toBe('attentive');

      const intentBoundary = evaluatePetEvent(eventUserActive, {
        curiosity: 0.75,
        sociability: 0.4,
        calmness: 0.55,
      });
      expect(intentBoundary?.type).toBe('attentive');
    });

    it('produces notice when sociability < 0.40', () => {
      const intentLow = evaluatePetEvent(eventUserActive, {
        curiosity: 0.75,
        sociability: 0.2,
        calmness: 0.55,
      });
      expect(intentLow?.type).toBe('notice');
    });
  });

  describe('Calmness', () => {
    it('produces concerned when calmness < 0.75', () => {
      const intentNormal = evaluatePetEvent(eventNetworkOffline, {
        curiosity: 0.75,
        sociability: 0.7,
        calmness: 0.5,
      });
      expect(intentNormal?.type).toBe('concerned');
    });

    it('produces notice when calmness >= 0.75', () => {
      const intentHigh = evaluatePetEvent(eventNetworkOffline, {
        curiosity: 0.75,
        sociability: 0.7,
        calmness: 0.9,
      });
      expect(intentHigh?.type).toBe('notice');

      const intentBoundary = evaluatePetEvent(eventNetworkOffline, {
        curiosity: 0.75,
        sociability: 0.7,
        calmness: 0.75,
      });
      expect(intentBoundary?.type).toBe('notice');
    });
  });
});

describe('PetBrain Runtime Integration', () => {
  beforeEach(() => {
    usePetStore.setState({ state: 'idle' });
  });

  afterEach(() => {
    cleanupPetBrainRuntime();
  });

  it('subscribes to domain bus and emits ReactionIntent to listeners using default personality', () => {
    const bus = createDomainEventBus();
    const cleanupRuntime = initPetBrainRuntime(bus);
    const intentListener = vi.fn();

    const unsubIntent = onReactionIntent(intentListener);

    bus.publish({
      type: 'user.idle',
      occurredAt: Date.now(),
    });

    expect(intentListener).toHaveBeenCalledTimes(1);
    expect(intentListener).toHaveBeenCalledWith({
      type: 'sleepy',
      causedBy: 'user.idle',
    });

    unsubIntent();
    cleanupRuntime();
  });

  it('uses custom personality supplied in runtime options', () => {
    const bus = createDomainEventBus();
    const cleanupRuntime = initPetBrainRuntime({
      bus,
      personality: {
        curiosity: 0.1, // low curiosity
        sociability: 0.7,
        calmness: 0.55,
      },
    });
    const intentListener = vi.fn();

    onReactionIntent(intentListener);

    bus.publish({
      type: 'application.opened',
      occurredAt: Date.now(),
      payload: { applicationName: 'Firefox' },
    });

    // Should NOT produce reaction because curiosity < 0.40
    expect(intentListener).not.toHaveBeenCalled();

    cleanupRuntime();
  });

  it('stops emitting ReactionIntents after cleanup', () => {
    const bus = createDomainEventBus();
    const cleanupRuntime = initPetBrainRuntime(bus);
    const intentListener = vi.fn();

    onReactionIntent(intentListener);

    bus.publish({ type: 'network.online', occurredAt: Date.now() });
    expect(intentListener).toHaveBeenCalledTimes(1);

    cleanupRuntime();

    bus.publish({ type: 'network.online', occurredAt: Date.now() });
    expect(intentListener).toHaveBeenCalledTimes(1);
  });

  it('does NOT automatically mutate PetState in Zustand when PetBrain evaluates events', () => {
    const bus = createDomainEventBus();
    initPetBrainRuntime(bus);

    expect(usePetStore.getState().state).toBe('idle');

    bus.publish({ type: 'user.idle', occurredAt: Date.now() });
    bus.publish({ type: 'network.offline', occurredAt: Date.now() });
    bus.publish({
      type: 'application.opened',
      occurredAt: Date.now(),
      payload: { applicationName: 'Google Chrome' },
    });

    // PetState must remain unchanged at 'idle'
    expect(usePetStore.getState().state).toBe('idle');
  });
});
