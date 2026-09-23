import { PetState } from '../model/pet.types';
import { ReactionIntentType, ReactionIntent } from '../brain/reaction-intent.types';

export interface ReactionDefinition {
  intent: ReactionIntentType;
  petState: PetState;
  priority: number;
  durationMs: number | null;
  cooldownMs: number;
  interruptible: boolean;
}

export type RejectionReason = 'cooldown' | 'priority';

export type ReactionHandleResult =
  | {
      status: 'accepted';
      intent: ReactionIntentType;
      petState: PetState;
    }
  | {
      status: 'rejected';
      intent: ReactionIntentType;
      reason: RejectionReason;
    };

export interface ActiveReaction {
  intent: ReactionIntentType;
  definition: ReactionDefinition;
  startedAt: number;
  id: number;
}

export interface ReactionEngineDependencies {
  setPetState?: (state: PetState) => void;
  getPetState?: () => PetState;
  clock?: () => number;
  setTimeout?: (fn: () => void, ms: number) => ReturnType<typeof globalThis.setTimeout>;
  clearTimeout?: (id: ReturnType<typeof globalThis.setTimeout>) => void;
}

export type ReactionResultListener = (result: ReactionHandleResult) => void;

export interface ReactionEngine {
  handle: (intent: ReactionIntent) => ReactionHandleResult;
  getActiveReaction: () => ActiveReaction | null;
  onReactionHandled: (listener: ReactionResultListener) => () => void;
  dispose: () => void;
  resetCooldowns: () => void;
}
