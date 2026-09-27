import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listen, EventCallback } from '@tauri-apps/api/event';
import { createDomainEventBus } from '../../events/domain-event-bus';
import { DomainEvent } from '../../events/domain-event.types';
import {
  initNativeNetworkEvents,
  NATIVE_EVENT_NETWORK_ONLINE,
  NATIVE_EVENT_NETWORK_OFFLINE,
} from '../native-network-events';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

describe('initNativeNetworkEvents', () => {
  let bus: ReturnType<typeof createDomainEventBus>;
  let listenMap: Map<string, EventCallback<unknown>>;
  let mockUnlistenOnline: ReturnType<typeof vi.fn>;
  let mockUnlistenOffline: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    bus = createDomainEventBus();
    listenMap = new Map();
    mockUnlistenOnline = vi.fn();
    mockUnlistenOffline = vi.fn();

    vi.mocked(listen).mockImplementation(async (eventName, callback) => {
      listenMap.set(eventName, callback);
      if (eventName === NATIVE_EVENT_NETWORK_ONLINE) {
        return mockUnlistenOnline;
      }
      return mockUnlistenOffline;
    });
  });

  it('publishes network.online domain event when native://network-online is received', async () => {
    const receivedEvents: DomainEvent[] = [];
    bus.subscribe('network.online', (e) => receivedEvents.push(e));

    const cleanup = initNativeNetworkEvents(bus);

    await vi.waitFor(() => {
      expect(listenMap.has(NATIVE_EVENT_NETWORK_ONLINE)).toBe(true);
    });

    const callbackOnline = listenMap.get(NATIVE_EVENT_NETWORK_ONLINE)!;
    callbackOnline({
      event: NATIVE_EVENT_NETWORK_ONLINE,
      id: 1,
      payload: {},
    });

    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toMatchObject({
      type: 'network.online',
    });
    expect(typeof receivedEvents[0].occurredAt).toBe('number');

    cleanup();
  });

  it('publishes network.offline domain event when native://network-offline is received', async () => {
    const receivedEvents: DomainEvent[] = [];
    bus.subscribe('network.offline', (e) => receivedEvents.push(e));

    const cleanup = initNativeNetworkEvents(bus);

    await vi.waitFor(() => {
      expect(listenMap.has(NATIVE_EVENT_NETWORK_OFFLINE)).toBe(true);
    });

    const callbackOffline = listenMap.get(NATIVE_EVENT_NETWORK_OFFLINE)!;
    callbackOffline({
      event: NATIVE_EVENT_NETWORK_OFFLINE,
      id: 2,
      payload: {},
    });

    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toMatchObject({
      type: 'network.offline',
    });
    expect(typeof receivedEvents[0].occurredAt).toBe('number');

    cleanup();
  });

  it('unsubscribes active Tauri listeners upon cleanup', async () => {
    const cleanup = initNativeNetworkEvents(bus);

    await vi.waitFor(() => {
      expect(listenMap.size).toBe(2);
    });

    cleanup();

    expect(mockUnlistenOnline).toHaveBeenCalledTimes(1);
    expect(mockUnlistenOffline).toHaveBeenCalledTimes(1);
  });

  it('handles Tauri API errors gracefully without throwing', async () => {
    vi.mocked(listen).mockRejectedValueOnce(new Error('Tauri API unavailable'));

    expect(() => {
      const cleanup = initNativeNetworkEvents(bus);
      cleanup();
    }).not.toThrow();
  });
});
