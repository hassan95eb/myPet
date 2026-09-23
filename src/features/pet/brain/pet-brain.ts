import { DomainEvent } from '../../../core/events/domain-event.types';
import { ReactionIntent } from './reaction-intent.types';

export function evaluatePetEvent(event: DomainEvent): ReactionIntent | null {
  switch (event.type) {
    case 'application.opened':
      return {
        type: 'curious',
        causedBy: event.type,
        context: {
          applicationName: event.payload.applicationName,
        },
      };

    case 'application.closed':
      return {
        type: 'notice',
        causedBy: event.type,
        context: {
          applicationName: event.payload.applicationName,
        },
      };

    case 'network.offline':
      return {
        type: 'concerned',
        causedBy: event.type,
      };

    case 'network.online':
      return {
        type: 'pleased',
        causedBy: event.type,
      };

    case 'user.idle':
      return {
        type: 'sleepy',
        causedBy: event.type,
      };

    case 'user.active':
      return {
        type: 'attentive',
        causedBy: event.type,
      };

    default:
      return null;
  }
}
