import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDomainEventBus } from '../domain-event-bus';
import { domainEventBus } from '../domain-event-bus.instance';
import { usePetStore } from '../../../features/pet/model/pet.store';

describe('DomainEventBus', () => {
  beforeEach(() => {
    // Reset Zustand PetStore to initial state before tests
    usePetStore.setState({ state: 'idle' });
  });

  it('delivers published events to matching subscribers', () => {
    const bus = createDomainEventBus();
    const handler = vi.fn();

    bus.subscribe('network.online', handler);

    const now = Date.now();
    bus.publish({ type: 'network.online', occurredAt: now });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      type: 'network.online',
      occurredAt: now,
    });
  });

  it('filters events so subscribers only receive matching event types', () => {
    const bus = createDomainEventBus();
    const offlineHandler = vi.fn();
    const onlineHandler = vi.fn();

    bus.subscribe('network.offline', offlineHandler);
    bus.subscribe('network.online', onlineHandler);

    bus.publish({ type: 'network.offline', occurredAt: Date.now() });

    expect(offlineHandler).toHaveBeenCalledTimes(1);
    expect(onlineHandler).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers for the same event type', () => {
    const bus = createDomainEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.subscribe('user.idle', handler1);
    bus.subscribe('user.idle', handler2);

    bus.publish({ type: 'user.idle', occurredAt: Date.now() });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('stops delivering events after unsubscription', () => {
    const bus = createDomainEventBus();
    const handler = vi.fn();

    const unsubscribe = bus.subscribe('user.active', handler);

    bus.publish({ type: 'user.active', occurredAt: Date.now() });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();

    bus.publish({ type: 'user.active', occurredAt: Date.now() });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('safely handles unsubscription during event dispatch', () => {
    const bus = createDomainEventBus();
    const handler1 = vi.fn();
    let unsubscribe2: (() => void) | null = null;

    const handler2 = vi.fn(() => {
      if (unsubscribe2) {
        unsubscribe2();
      }
    });

    bus.subscribe('network.online', handler1);
    unsubscribe2 = bus.subscribe('network.online', handler2);

    // Dispatching should call both handlers cleanly
    bus.publish({ type: 'network.online', occurredAt: Date.now() });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    // Second publish should call only handler1 because handler2 unsubscribed itself
    bus.publish({ type: 'network.online', occurredAt: Date.now() });

    expect(handler1).toHaveBeenCalledTimes(2);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('correctly passes typed payloads for application events', () => {
    const bus = createDomainEventBus();
    const openedHandler = vi.fn();
    const closedHandler = vi.fn();

    bus.subscribe('application.opened', openedHandler);
    bus.subscribe('application.closed', closedHandler);

    bus.publish({
      type: 'application.opened',
      occurredAt: 1000,
      payload: { applicationName: 'VS Code' },
    });

    bus.publish({
      type: 'application.closed',
      occurredAt: 2000,
      payload: { applicationName: 'Spotify' },
    });

    expect(openedHandler).toHaveBeenCalledWith({
      type: 'application.opened',
      occurredAt: 1000,
      payload: { applicationName: 'VS Code' },
    });

    expect(closedHandler).toHaveBeenCalledWith({
      type: 'application.closed',
      occurredAt: 2000,
      payload: { applicationName: 'Spotify' },
    });
  });

  it('does NOT automatically mutate PetState in Zustand when events are published', () => {
    const initialPetState = usePetStore.getState().state;
    expect(initialPetState).toBe('idle');

    domainEventBus.publish({ type: 'network.offline', occurredAt: Date.now() });
    domainEventBus.publish({
      type: 'application.opened',
      occurredAt: Date.now(),
      payload: { applicationName: 'Google Chrome' },
    });
    domainEventBus.publish({ type: 'user.idle', occurredAt: Date.now() });

    // PetState must remain untouched
    expect(usePetStore.getState().state).toBe('idle');
  });
});
