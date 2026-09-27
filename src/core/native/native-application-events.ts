import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { domainEventBus } from '../events/domain-event-bus.instance';
import { DomainEventBus } from '../events/domain-event-bus';

export const NATIVE_EVENT_APPLICATION_OPENED = 'native://application-opened';
export const NATIVE_EVENT_APPLICATION_CLOSED = 'native://application-closed';

export interface NativeApplicationPayload {
  applicationName?: string;
  application_name?: string;
}

/**
 * Initializes listeners for native application lifecycle events emitted over Tauri IPC.
 * Translates valid native events into strongly typed DomainEvents published to DomainEventBus.
 *
 * Gracefully handles non-Tauri / standalone browser test environments.
 * Returns a synchronous cleanup function that unsubscribes active Tauri listeners.
 */
export function initNativeApplicationEvents(
  bus: DomainEventBus = domainEventBus
): () => void {
  let isCleanedUp = false;
  const unlistens: UnlistenFn[] = [];

  const setupListeners = async () => {
    try {
      const unlistenOpened = await listen<NativeApplicationPayload>(
        NATIVE_EVENT_APPLICATION_OPENED,
        (event) => {
          const appName =
            event.payload?.applicationName || event.payload?.application_name;
          if (!appName || typeof appName !== 'string') {
            return;
          }

          bus.publish({
            type: 'application.opened',
            occurredAt: Date.now(),
            payload: {
              applicationName: appName,
            },
          });
        }
      );

      const unlistenClosed = await listen<NativeApplicationPayload>(
        NATIVE_EVENT_APPLICATION_CLOSED,
        (event) => {
          const appName =
            event.payload?.applicationName || event.payload?.application_name;
          if (!appName || typeof appName !== 'string') {
            return;
          }

          bus.publish({
            type: 'application.closed',
            occurredAt: Date.now(),
            payload: {
              applicationName: appName,
            },
          });
        }
      );

      if (isCleanedUp) {
        unlistenOpened();
        unlistenClosed();
      } else {
        unlistens.push(unlistenOpened, unlistenClosed);
      }
    } catch (err) {
      // In standalone web mode or test environment without Tauri runtime, fail gracefully
      if (import.meta.env.DEV) {
        console.warn(
          '[DeskBuddy Native Adapter] Tauri native event listener unavailable:',
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
