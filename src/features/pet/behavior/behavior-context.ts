import { DomainEvent } from '../../../core/events/domain-event.types';
import { BehaviorContext } from './behavior-context.types';
import {
  APPLICATION_ACTIVITY_WINDOW_MS,
  INITIAL_BEHAVIOR_CONTEXT,
} from './behavior-context.config';

export function createInitialBehaviorContext(): BehaviorContext {
  return { ...INITIAL_BEHAVIOR_CONTEXT };
}

export function reduceBehaviorContext(
  context: BehaviorContext,
  event: DomainEvent
): BehaviorContext {
  const lastEventAt =
    context.lastEventAt === null
      ? event.occurredAt
      : Math.max(context.lastEventAt, event.occurredAt);

  const updated: BehaviorContext = {
    ...context,
    lastEventType: event.type,
    lastEventAt,
  };

  switch (event.type) {
    case 'application.opened': {
      updated.lastApplicationName = event.payload.applicationName;

      const windowStart = context.recentApplicationWindowStartedAt;

      // Handle stale events (occurredAt < current window start timestamp)
      if (windowStart !== null && event.occurredAt < windowStart) {
        return updated;
      }

      if (
        windowStart === null ||
        event.occurredAt - windowStart >= APPLICATION_ACTIVITY_WINDOW_MS
      ) {
        updated.recentApplicationWindowStartedAt = event.occurredAt;
        updated.recentApplicationOpenCount = 1;
      } else {
        updated.recentApplicationOpenCount = context.recentApplicationOpenCount + 1;
      }
      return updated;
    }

    case 'application.closed': {
      updated.lastApplicationName = event.payload.applicationName;
      return updated;
    }

    case 'user.idle': {
      updated.userPresence = 'idle';
      return updated;
    }

    case 'user.active': {
      updated.userPresence = 'active';
      return updated;
    }

    case 'network.online': {
      updated.networkStatus = 'online';
      return updated;
    }

    case 'network.offline': {
      updated.networkStatus = 'offline';
      return updated;
    }

    default:
      return updated;
  }
}
