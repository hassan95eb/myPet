import { DomainEvent } from '../../../core/events/domain-event.types';

export interface BehaviorContext {
  lastEventType: DomainEvent['type'] | null;
  lastEventAt: number | null;

  lastApplicationName: string | null;

  recentApplicationOpenCount: number;
  recentApplicationWindowStartedAt: number | null;

  userPresence: 'active' | 'idle' | 'unknown';
  networkStatus: 'online' | 'offline' | 'unknown';
}
