import { DomainEventType } from '../../../core/events/domain-event.types';

export const REACTION_INTENTS = [
  'notice',
  'curious',
  'pleased',
  'concerned',
  'sleepy',
  'attentive',
] as const;

export type ReactionIntentType = (typeof REACTION_INTENTS)[number];

export interface ReactionIntentContext {
  applicationName?: string;
}

export interface ReactionIntent {
  type: ReactionIntentType;
  causedBy: DomainEventType;
  context?: ReactionIntentContext;
}
