import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listen, EventCallback } from '@tauri-apps/api/event';
import { createDomainEventBus } from '../../events/domain-event-bus';
import { DomainEvent } from '../../events/domain-event.types';
import {
  initNativeApplicationEvents,
  NATIVE_EVENT_APPLICATION_OPENED,
  NATIVE_EVENT_APPLICATION_CLOSED,
  NativeApplicationPayload,
} from '../native-application-events';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

describe('initNativeApplicationEvents', () => {
  let bus: ReturnType<typeof createDomainEventBus>;
  let listenMap: Map<string, EventCallback<NativeApplicationPayload>>;
  let mockUnlistenOpened: ReturnType<typeof vi.fn>;
  let mockUnlistenClosed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    bus = createDomainEventBus();
    listenMap = new Map();
    mockUnlistenOpened = vi.fn();
    mockUnlistenClosed = vi.fn();

    vi.mocked(listen).mockImplementation(async (eventName, callback) => {
      listenMap.set(eventName, callback as EventCallback<NativeApplicationPayload>);
      if (eventName === NATIVE_EVENT_APPLICATION_OPENED) {
        return mockUnlistenOpened;
      }
      return mockUnlistenClosed;
    });
  });

  it('publishes application.opened domain event when native://application-opened is received', async () => {
    const receivedEvents: DomainEvent[] = [];
    bus.subscribe('application.opened', (e) => receivedEvents.push(e));

    const cleanup = initNativeApplicationEvents(bus);

    // Allow async listen setup to resolve
    await vi.waitFor(() => {
      expect(listenMap.has(NATIVE_EVENT_APPLICATION_OPENED)).toBe(true);
    });

    const callbackOpened = listenMap.get(NATIVE_EVENT_APPLICATION_OPENED)!;
    callbackOpened({
      event: NATIVE_EVENT_APPLICATION_OPENED,
      id: 1,
      payload: { applicationName: 'Google Chrome' },
    });

    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toMatchObject({
      type: 'application.opened',
      payload: { applicationName: 'Google Chrome' },
    });

    cleanup();
  });

  it('publishes application.closed domain event when native://application-closed is received', async () => {
    const receivedEvents: DomainEvent[] = [];
    bus.subscribe('application.closed', (e) => receivedEvents.push(e));

    const cleanup = initNativeApplicationEvents(bus);

    await vi.waitFor(() => {
      expect(listenMap.has(NATIVE_EVENT_APPLICATION_CLOSED)).toBe(true);
    });

    const callbackClosed = listenMap.get(NATIVE_EVENT_APPLICATION_CLOSED)!;
    callbackClosed({
      event: NATIVE_EVENT_APPLICATION_CLOSED,
      id: 2,
      payload: { applicationName: 'Visual Studio Code' },
    });

    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toMatchObject({
      type: 'application.closed',
      payload: { applicationName: 'Visual Studio Code' },
    });

    cleanup();
  });

  it('ignores invalid or empty application payloads', async () => {
    const receivedEvents: DomainEvent[] = [];
    bus.subscribe('application.opened', (e) => receivedEvents.push(e));
    bus.subscribe('application.closed', (e) => receivedEvents.push(e));

    const cleanup = initNativeApplicationEvents(bus);

    await vi.waitFor(() => {
      expect(listenMap.has(NATIVE_EVENT_APPLICATION_OPENED)).toBe(true);
    });

    const callbackOpened = listenMap.get(NATIVE_EVENT_APPLICATION_OPENED)!;
    callbackOpened({ event: NATIVE_EVENT_APPLICATION_OPENED, id: 3, payload: {} });

    expect(receivedEvents).toHaveLength(0);

    cleanup();
  });

  it('unsubscribes active Tauri listeners upon cleanup', async () => {
    const cleanup = initNativeApplicationEvents(bus);

    await vi.waitFor(() => {
      expect(listenMap.size).toBe(2);
    });

    cleanup();

    expect(mockUnlistenOpened).toHaveBeenCalledTimes(1);
    expect(mockUnlistenClosed).toHaveBeenCalledTimes(1);
  });

  it('handles Tauri API errors gracefully without throwing', async () => {
    vi.mocked(listen).mockRejectedValueOnce(new Error('Tauri API unavailable'));

    expect(() => {
      const cleanup = initNativeApplicationEvents(bus);
      cleanup();
    }).not.toThrow();
  });
});
