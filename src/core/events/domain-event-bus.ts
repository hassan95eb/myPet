import { DomainEvent, DomainEventType } from './domain-event.types';

export type EventHandler<T extends DomainEventType> = (
  event: Extract<DomainEvent, { type: T }>
) => void;

export type UnsubscribeFn = () => void;

export interface DomainEventBus {
  publish(event: DomainEvent): void;
  subscribe<T extends DomainEventType>(
    type: T,
    handler: EventHandler<T>
  ): UnsubscribeFn;
}

export function createDomainEventBus(): DomainEventBus {
  const subscribers = new Map<DomainEventType, Set<(event: unknown) => void>>();

  return {
    publish(event: DomainEvent): void {
      const handlers = subscribers.get(event.type);
      if (!handlers || handlers.size === 0) {
        return;
      }

      // Snapshot handlers so unsubscription during dispatch is safe
      const handlersToNotify = Array.from(handlers);
      for (const handler of handlersToNotify) {
        handler(event);
      }
    },

    subscribe<T extends DomainEventType>(
      type: T,
      handler: EventHandler<T>
    ): UnsubscribeFn {
      let typeSubscribers = subscribers.get(type);
      if (!typeSubscribers) {
        typeSubscribers = new Set();
        subscribers.set(type, typeSubscribers);
      }

      const genericHandler = handler as (event: unknown) => void;
      typeSubscribers.add(genericHandler);

      return () => {
        const currentSubscribers = subscribers.get(type);
        if (currentSubscribers) {
          currentSubscribers.delete(genericHandler);
          if (currentSubscribers.size === 0) {
            subscribers.delete(type);
          }
        }
      };
    },
  };
}
