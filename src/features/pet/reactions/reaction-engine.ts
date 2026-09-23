import { usePetStore } from '../model/pet.store';
import { ReactionIntent } from '../brain/reaction-intent.types';
import { REACTION_DEFINITIONS } from './reaction-definitions';
import {
  ActiveReaction,
  ReactionEngine,
  ReactionEngineDependencies,
  ReactionHandleResult,
  ReactionResultListener,
} from './reaction.types';

export function createReactionEngine(
  deps: ReactionEngineDependencies = {}
): ReactionEngine {
  const setPetState = deps.setPetState ?? ((s) => usePetStore.getState().setState(s));
  const clock = deps.clock ?? (() => Date.now());
  const setTimeoutFn = deps.setTimeout ?? ((fn, ms) => globalThis.setTimeout(fn, ms));
  const clearTimeoutFn = deps.clearTimeout ?? ((id) => globalThis.clearTimeout(id));

  let activeReaction: ActiveReaction | null = null;
  let activeTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  let nextReactionId = 0;
  const cooldowns = new Map<string, number>();
  const resultListeners = new Set<ReactionResultListener>();

  const onReactionHandled = (listener: ReactionResultListener): (() => void) => {
    resultListeners.add(listener);
    return () => {
      resultListeners.delete(listener);
    };
  };

  const notifyResultListeners = (result: ReactionHandleResult): void => {
    const snapshot = Array.from(resultListeners);
    for (const listener of snapshot) {
      listener(result);
    }
  };

  const handle = (intent: ReactionIntent): ReactionHandleResult => {
    const definition = REACTION_DEFINITIONS[intent.type];
    if (!definition) {
      const result: ReactionHandleResult = {
        status: 'rejected',
        intent: intent.type,
        reason: 'priority',
      };
      notifyResultListeners(result);
      return result;
    }

    const now = clock();
    const lastExecuted = cooldowns.get(intent.type) ?? 0;

    // 1. Cooldown check
    if (now - lastExecuted < definition.cooldownMs) {
      const result: ReactionHandleResult = {
        status: 'rejected',
        intent: intent.type,
        reason: 'cooldown',
      };
      notifyResultListeners(result);
      return result;
    }

    // 2. Priority check
    if (activeReaction !== null && definition.priority <= activeReaction.definition.priority) {
      const result: ReactionHandleResult = {
        status: 'rejected',
        intent: intent.type,
        reason: 'priority',
      };
      notifyResultListeners(result);
      return result;
    }

    // 3. Accepted: Clear existing active completion timer
    if (activeTimer !== null) {
      clearTimeoutFn(activeTimer);
      activeTimer = null;
    }

    // Record execution timestamp for cooldown
    cooldowns.set(intent.type, now);

    nextReactionId += 1;
    const currentReactionId = nextReactionId;

    activeReaction = {
      intent: intent.type,
      definition,
      startedAt: now,
      id: currentReactionId,
    };

    // Update Pet state
    setPetState(definition.petState);

    // Schedule completion timer for temporary reactions
    if (definition.durationMs !== null) {
      activeTimer = setTimeoutFn(() => {
        // Stale timer guard: only set to idle if this reaction is still active
        if (activeReaction && activeReaction.id === currentReactionId) {
          activeReaction = null;
          activeTimer = null;
          setPetState('idle');
        }
      }, definition.durationMs);
    }

    const result: ReactionHandleResult = {
      status: 'accepted',
      intent: intent.type,
      petState: definition.petState,
    };
    notifyResultListeners(result);
    return result;
  };

  const getActiveReaction = (): ActiveReaction | null => {
    return activeReaction;
  };

  const dispose = (): void => {
    if (activeTimer !== null) {
      clearTimeoutFn(activeTimer);
      activeTimer = null;
    }
    activeReaction = null;
    cooldowns.clear();
    resultListeners.clear();
  };

  const resetCooldowns = (): void => {
    cooldowns.clear();
  };

  return {
    handle,
    getActiveReaction,
    onReactionHandled,
    dispose,
    resetCooldowns,
  };
}
