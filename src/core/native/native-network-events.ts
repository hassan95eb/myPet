import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { domainEventBus } from '../events/domain-event-bus.instance';
import { DomainEventBus } from '../events/domain-event-bus';

export const NATIVE_EVENT_NETWORK_ONLINE = 'native://network-online';
export const NATIVE_EVENT_NETWORK_OFFLINE = 'native://network-offline';

/**
 * Initializes listeners for native network connectivity events emitted over Tauri IPC.
 * Translates valid native events into strongly typed DomainEvents published to DomainEventBus.
 *
 * Gracefully handles non-Tauri / standalone browser test environments.
 * Returns a synchronous cleanup function that unsubscribes active Tauri listeners.
 */
export function initNativeNetworkEvents(
  bus: DomainEventBus = domainEventBus
): () => void {
  let isCleanedUp = false;
  const unlistens: UnlistenFn[] = [];

  const setupListeners = async () => {
    try {
      const unlistenOnline = await listen(
        NATIVE_EVENT_NETWORK_ONLINE,
        () => {
          bus.publish({
            type: 'network.online',
            occurredAt: Date.now(),
          });
        }
      );

      const unlistenOffline = await listen(
        NATIVE_EVENT_NETWORK_OFFLINE,
        () => {
          bus.publish({
            type: 'network.offline',
            occurredAt: Date.now(),
          });
        }
      );

      if (isCleanedUp) {
        unlistenOnline();
        unlistenOffline();
      } else {
        unlistens.push(unlistenOnline, unlistenOffline);
      }
    } catch (err) {
      // In standalone web mode or test environment without Tauri runtime, fail gracefully
      if (import.meta.env.DEV) {
        console.warn(
          '[DeskBuddy Native Adapter] Tauri native network listener unavailable:',
          err
        );
      }
    }
  };

  setupListeners();

  return () => {
    isCleanedUp = true;
    for (const unlisten of unlistens) {
      unlisten();
    }
    unlistens.length = 0;
  };
}
