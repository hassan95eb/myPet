import { BehaviorContext } from './behavior-context.types';

export const APPLICATION_ACTIVITY_WINDOW_MS = 30_000;

export const INITIAL_BEHAVIOR_CONTEXT: Readonly<BehaviorContext> = Object.freeze({
  lastEventType: null,
  lastEventAt: null,
  lastApplicationName: null,
  recentApplicationOpenCount: 0,
  recentApplicationWindowStartedAt: null,
  userPresence: 'unknown',
  networkStatus: 'unknown',
});
