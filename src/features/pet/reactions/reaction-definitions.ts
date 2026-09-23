import { ReactionIntentType } from '../brain/reaction-intent.types';
import { ReactionDefinition } from './reaction.types';

export const REACTION_DEFINITIONS: Record<ReactionIntentType, ReactionDefinition> = {
  notice: {
    intent: 'notice',
    petState: 'surprised',
    priority: 1,
    durationMs: 1200,
    cooldownMs: 1500,
    interruptible: true,
  },
  curious: {
    intent: 'curious',
    petState: 'surprised',
    priority: 1,
    durationMs: 1500,
    cooldownMs: 2000,
    interruptible: true,
  },
  pleased: {
    intent: 'pleased',
    petState: 'happy',
    priority: 2,
    durationMs: 1800,
    cooldownMs: 2000,
    interruptible: true,
  },
  concerned: {
    intent: 'concerned',
    petState: 'angry',
    priority: 3,
    durationMs: 2000,
    cooldownMs: 3000,
    interruptible: true,
  },
  sleepy: {
    intent: 'sleepy',
    petState: 'sleeping',
    priority: 1,
    durationMs: null,
    cooldownMs: 3000,
    interruptible: true,
  },
  attentive: {
    intent: 'attentive',
    petState: 'listening',
    priority: 2,
    durationMs: 1800,
    cooldownMs: 2000,
    interruptible: true,
  },
} as const;
