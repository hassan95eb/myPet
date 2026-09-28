import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { domainEventBus } from '../events/domain-event-bus.instance';
import { DomainEventBus } from '../events/domain-event-bus';

export const NATIVE_EVENT_USER_IDLE = 'native://user-idle';
export const NATIVE_EVENT_USER_ACTIVE = 'native://user-active';

/**
 * Initializes listeners for native user idle state transition events emitted over Tauri IPC.
 * Translates native events (`native://user-idle`, `native://user-active`) into strongly typed
 * `user.idle` and `user.active` DomainEvents published to DomainEventBus.
 *
 * Gracefully handles non-Tauri / standalone browser test environments.
 * Returns a synchronous cleanup function that unsubscribes active Tauri listeners.
 */
export function initNativeIdleEvents(
  bus: DomainEventBus = domainEventBus
): () => void {
  let isCleanedUp = false;
  const unlistens: UnlistenFn[] = [];

  const setupListeners = async () => {
    try {
      const unlistenIdle = await listen(
        NATIVE_EVENT_USER_IDLE,
        () => {
          bus.publish({
            type: 'user.idle',
            occurredAt: Date.now(),
          });
        }
      );

      const unlistenActive = await listen(
        NATIVE_EVENT_USER_ACTIVE,
        () => {
          bus.publish({
            type: 'user.active',
            occurredAt: Date.now(),
          });
        }
      );

      if (isCleanedUp) {
        unlistenIdle();
        unlistenActive();
      } else {
        unlistens.push(unlistenIdle, unlistenActive);
      }
    } catch (err) {
      // In standalone web mode or test environment without Tauri runtime, fail gracefully
      if (import.meta.env.DEV) {
        console.warn(
          '[DeskBuddy Native Adapter] Tauri native user idle event listener unavailable:',
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
