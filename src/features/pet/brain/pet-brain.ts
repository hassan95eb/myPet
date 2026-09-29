import { DomainEvent } from '../../../core/events/domain-event.types';
import { ReactionIntent } from './reaction-intent.types';
import { PetPersonality, DEFAULT_PERSONALITY } from '../personality';
import {
  BehaviorContext,
  createInitialBehaviorContext,
} from '../behavior';

export function evaluatePetEvent(
  event: DomainEvent,
  personality: PetPersonality = DEFAULT_PERSONALITY,
  context: BehaviorContext = createInitialBehaviorContext()
): ReactionIntent | null {
  switch (event.type) {
    case 'application.opened':
      if (personality.curiosity >= 0.4) {
        const intentType =
          context.recentApplicationOpenCount >= 3 ? 'attentive' : 'curious';

        return {
          type: intentType,
          causedBy: event.type,
          context: {
            applicationName: event.payload.applicationName,
          },
        };
      }
      return null;

    case 'application.closed':
      return {
        type: 'notice',
        causedBy: event.type,
        context: {
          applicationName: event.payload.applicationName,
        },
      };

    case 'network.offline':
      if (personality.calmness < 0.75) {
        return {
          type: 'concerned',
          causedBy: event.type,
        };
      }
      return {
        type: 'notice',
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
      if (personality.sociability >= 0.4) {
        return {
          type: 'attentive',
          causedBy: event.type,
        };
      }
      return {
        type: 'notice',
        causedBy: event.type,
      };

    default:
      return null;
  }
}
