import { describe, it, expect } from 'vitest';
import {
  createInitialBehaviorContext,
  reduceBehaviorContext,
} from '../behavior-context';
import {
  ApplicationOpenedEvent,
  ApplicationClosedEvent,
  UserIdleEvent,
  UserActiveEvent,
  NetworkOnlineEvent,
  NetworkOfflineEvent,
} from '../../../../core/events/domain-event.types';

describe('BehaviorContext', () => {
  it('creates initial context with default values', () => {
    const context = createInitialBehaviorContext();
    expect(context).toEqual({
      lastEventType: null,
      lastEventAt: null,
      lastApplicationName: null,
      recentApplicationOpenCount: 0,
      recentApplicationWindowStartedAt: null,
      userPresence: 'unknown',
      networkStatus: 'unknown',
    });
  });

  describe('reduceBehaviorContext - application.opened', () => {
    it('tracks single application open event and sets window timestamp', () => {
      const initial = createInitialBehaviorContext();
      const event: ApplicationOpenedEvent = {
        type: 'application.opened',
        occurredAt: 1000,
        payload: { applicationName: 'VS Code' },
      };

      const reduced = reduceBehaviorContext(initial, event);

      expect(reduced.lastEventType).toBe('application.opened');
      expect(reduced.lastEventAt).toBe(1000);
      expect(reduced.lastApplicationName).toBe('VS Code');
      expect(reduced.recentApplicationOpenCount).toBe(1);
      expect(reduced.recentApplicationWindowStartedAt).toBe(1000);
    });

    it('increments count for open events within activity window', () => {
      let context = createInitialBehaviorContext();

      const event1: ApplicationOpenedEvent = {
        type: 'application.opened',
        occurredAt: 0,
        payload: { applicationName: 'App1' },
      };
      const event2: ApplicationOpenedEvent = {
        type: 'application.opened',
        occurredAt: 10000,
        payload: { applicationName: 'App2' },
      };
      const event3: ApplicationOpenedEvent = {
        type: 'application.opened',
        occurredAt: 29999,
        payload: { applicationName: 'App3' },
      };

      context = reduceBehaviorContext(context, event1);
      context = reduceBehaviorContext(context, event2);
      context = reduceBehaviorContext(context, event3);

      expect(context.recentApplicationOpenCount).toBe(3);
      expect(context.recentApplicationWindowStartedAt).toBe(0);
      expect(context.lastApplicationName).toBe('App3');
    });

    it('resets window and count when event occurs at or after window expiration (>= 30,000ms)', () => {
      let context = createInitialBehaviorContext();

      const event1: ApplicationOpenedEvent = {
        type: 'application.opened',
        occurredAt: 0,
        payload: { applicationName: 'App1' },
      };
      const event2: ApplicationOpenedEvent = {
        type: 'application.opened',
        occurredAt: 30000,
        payload: { applicationName: 'App2' },
      };

      context = reduceBehaviorContext(context, event1);
      expect(context.recentApplicationOpenCount).toBe(1);
      expect(context.recentApplicationWindowStartedAt).toBe(0);

      context = reduceBehaviorContext(context, event2);
      expect(context.recentApplicationOpenCount).toBe(1);
      expect(context.recentApplicationWindowStartedAt).toBe(30000);
      expect(context.lastApplicationName).toBe('App2');
    });

    it('ignores stale open events with timestamps before current window start', () => {
      let context = createInitialBehaviorContext();

      const event1: ApplicationOpenedEvent = {
        type: 'application.opened',
        occurredAt: 100000,
        payload: { applicationName: 'App1' },
      };
      const staleEvent: ApplicationOpenedEvent = {
        type: 'application.opened',
        occurredAt: 90000,
        payload: { applicationName: 'StaleApp' },
      };

      context = reduceBehaviorContext(context, event1);
      expect(context.recentApplicationOpenCount).toBe(1);
      expect(context.recentApplicationWindowStartedAt).toBe(100000);

      const reducedAfterStale = reduceBehaviorContext(context, staleEvent);
      expect(reducedAfterStale.recentApplicationOpenCount).toBe(1);
      expect(reducedAfterStale.recentApplicationWindowStartedAt).toBe(100000);
      expect(reducedAfterStale.lastEventAt).toBe(100000);
      expect(reducedAfterStale.lastEventType).toBe('application.opened');
    });
  });

  describe('reduceBehaviorContext - other events', () => {
    it('handles application.closed without affecting open count or window', () => {
      let context = createInitialBehaviorContext();

      const openEvent: ApplicationOpenedEvent = {
        type: 'application.opened',
        occurredAt: 1000,
        payload: { applicationName: 'App1' },
      };
      context = reduceBehaviorContext(context, openEvent);

      const closeEvent: ApplicationClosedEvent = {
        type: 'application.closed',
        occurredAt: 2000,
        payload: { applicationName: 'App1' },
      };
      context = reduceBehaviorContext(context, closeEvent);

      expect(context.lastEventType).toBe('application.closed');
      expect(context.lastEventAt).toBe(2000);
      expect(context.lastApplicationName).toBe('App1');
      expect(context.recentApplicationOpenCount).toBe(1);
      expect(context.recentApplicationWindowStartedAt).toBe(1000);
    });

    it('handles user.idle and user.active', () => {
      let context = createInitialBehaviorContext();

      const idleEvent: UserIdleEvent = {
        type: 'user.idle',
        occurredAt: 5000,
      };
      context = reduceBehaviorContext(context, idleEvent);
      expect(context.userPresence).toBe('idle');
      expect(context.lastEventType).toBe('user.idle');

      const activeEvent: UserActiveEvent = {
        type: 'user.active',
        occurredAt: 10000,
      };
      context = reduceBehaviorContext(context, activeEvent);
      expect(context.userPresence).toBe('active');
      expect(context.lastEventType).toBe('user.active');
    });

    it('handles network.offline and network.online', () => {
      let context = createInitialBehaviorContext();

      const offlineEvent: NetworkOfflineEvent = {
        type: 'network.offline',
        occurredAt: 5000,
      };
      context = reduceBehaviorContext(context, offlineEvent);
      expect(context.networkStatus).toBe('offline');

      const onlineEvent: NetworkOnlineEvent = {
        type: 'network.online',
        occurredAt: 10000,
      };
      context = reduceBehaviorContext(context, onlineEvent);
      expect(context.networkStatus).toBe('online');
    });
  });

  it('maintains monotonic lastEventAt when receiving out-of-order timestamps', () => {
    let context = createInitialBehaviorContext();

    const event1: UserActiveEvent = {
      type: 'user.active',
      occurredAt: 10000,
    };
    context = reduceBehaviorContext(context, event1);
    expect(context.lastEventAt).toBe(10000);

    const eventOld: UserIdleEvent = {
      type: 'user.idle',
      occurredAt: 5000,
    };
    context = reduceBehaviorContext(context, eventOld);
    expect(context.lastEventAt).toBe(10000);
  });
});
