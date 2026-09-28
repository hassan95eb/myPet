import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listen, EventCallback } from '@tauri-apps/api/event';
import { createDomainEventBus } from '../../events/domain-event-bus';
import { DomainEvent } from '../../events/domain-event.types';
import {
  initNativeIdleEvents,
  NATIVE_EVENT_USER_IDLE,
  NATIVE_EVENT_USER_ACTIVE,
} from '../native-idle-events';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

describe('initNativeIdleEvents', () => {
  let bus: ReturnType<typeof createDomainEventBus>;
  let listenMap: Map<string, EventCallback<unknown>>;
  let mockUnlistenIdle: ReturnType<typeof vi.fn>;
  let mockUnlistenActive: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    bus = createDomainEventBus();
    listenMap = new Map();
    mockUnlistenIdle = vi.fn();
    mockUnlistenActive = vi.fn();

    vi.mocked(listen).mockImplementation(async (eventName, callback) => {
      listenMap.set(eventName, callback as EventCallback<unknown>);
      if (eventName === NATIVE_EVENT_USER_IDLE) {
        return mockUnlistenIdle;
      }
      return mockUnlistenActive;
    });
  });

  it('publishes user.idle domain event when native://user-idle is received', async () => {
    const receivedEvents: DomainEvent[] = [];
    bus.subscribe('user.idle', (e) => receivedEvents.push(e));

    const cleanup = initNativeIdleEvents(bus);

    await vi.waitFor(() => {
      expect(listenMap.has(NATIVE_EVENT_USER_IDLE)).toBe(true);
    });

    const callbackIdle = listenMap.get(NATIVE_EVENT_USER_IDLE)!;
    callbackIdle({
      event: NATIVE_EVENT_USER_IDLE,
      id: 1,
      payload: {},
    });

    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toMatchObject({
      type: 'user.idle',
    });
    expect(typeof receivedEvents[0].occurredAt).toBe('number');

    cleanup();
  });

  it('publishes user.active domain event when native://user-active is received', async () => {
    const receivedEvents: DomainEvent[] = [];
    bus.subscribe('user.active', (e) => receivedEvents.push(e));

    const cleanup = initNativeIdleEvents(bus);

    await vi.waitFor(() => {
      expect(listenMap.has(NATIVE_EVENT_USER_ACTIVE)).toBe(true);
    });

    const callbackActive = listenMap.get(NATIVE_EVENT_USER_ACTIVE)!;
    callbackActive({
      event: NATIVE_EVENT_USER_ACTIVE,
      id: 2,
      payload: {},
    });

    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toMatchObject({
      type: 'user.active',
    });
    expect(typeof receivedEvents[0].occurredAt).toBe('number');

    cleanup();
  });

  it('unsubscribes active Tauri listeners upon cleanup', async () => {
    const cleanup = initNativeIdleEvents(bus);

    await vi.waitFor(() => {
      expect(listenMap.size).toBe(2);
    });

    cleanup();

    expect(mockUnlistenIdle).toHaveBeenCalledTimes(1);
    expect(mockUnlistenActive).toHaveBeenCalledTimes(1);
  });

  it('handles Tauri API errors gracefully without throwing', async () => {
    vi.mocked(listen).mockRejectedValueOnce(new Error('Tauri API unavailable'));

    expect(() => {
      const cleanup = initNativeIdleEvents(bus);
      cleanup();
    }).not.toThrow();
  });
});
