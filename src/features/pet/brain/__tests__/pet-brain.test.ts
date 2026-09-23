import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evaluatePetEvent } from '../pet-brain';
import {
  initPetBrainRuntime,
  onReactionIntent,
  cleanupPetBrainRuntime,
} from '../pet-brain-runtime';
import { createDomainEventBus } from '../../../../core/events/domain-event-bus';
import { usePetStore } from '../../model/pet.store';

describe('PetBrain (evaluatePetEvent)', () => {
  it('maps application.opened to curious intent with context', () => {
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

  it('maps application.closed to notice intent with context', () => {
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

  it('maps network.offline to concerned intent', () => {
    const intent = evaluatePetEvent({
      type: 'network.offline',
      occurredAt: 1000,
    });

    expect(intent).toEqual({
      type: 'concerned',
      causedBy: 'network.offline',
    });
  });

  it('maps network.online to pleased intent', () => {
    const intent = evaluatePetEvent({
      type: 'network.online',
      occurredAt: 1000,
    });

    expect(intent).toEqual({
      type: 'pleased',
      causedBy: 'network.online',
    });
  });

  it('maps user.idle to sleepy intent', () => {
    const intent = evaluatePetEvent({
      type: 'user.idle',
      occurredAt: 1000,
    });

    expect(intent).toEqual({
      type: 'sleepy',
      causedBy: 'user.idle',
    });
  });

  it('maps user.active to attentive intent', () => {
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

    const intent1 = evaluatePetEvent(event);
    const intent2 = evaluatePetEvent(event);

    expect(intent1).toEqual(intent2);
  });
});

describe('PetBrain Runtime Integration', () => {
  beforeEach(() => {
    usePetStore.setState({ state: 'idle' });
  });

  afterEach(() => {
    cleanupPetBrainRuntime();
  });

  it('subscribes to domain bus and emits ReactionIntent to listeners', () => {
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
