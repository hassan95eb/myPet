import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createReactionEngine } from '../reaction-engine';
import { PetState } from '../../model/pet.types';
import { ReactionIntent } from '../../brain/reaction-intent.types';
import { evaluatePetEvent } from '../../brain/pet-brain';
import { DomainEvent } from '../../../../core/events/domain-event.types';

describe('ReactionEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps intent execution correctly to PetState', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    const intent: ReactionIntent = {
      type: 'curious',
      causedBy: 'application.opened',
    };

    const result = engine.handle(intent);

    expect(result).toEqual({
      status: 'accepted',
      intent: 'curious',
      petState: 'surprised',
    });
    expect(currentState).toBe('surprised');
    engine.dispose();
  });

  it('resets to idle after temporary reaction duration expires', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    engine.handle({ type: 'curious', causedBy: 'application.opened' });
    expect(currentState).toBe('surprised');

    // curious duration is 1500ms
    vi.advanceTimersByTime(1499);
    expect(currentState).toBe('surprised');

    vi.advanceTimersByTime(1);
    expect(currentState).toBe('idle');

    engine.dispose();
  });

  it('persistent reaction (sleepy -> sleeping) does not automatically return to idle', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    engine.handle({ type: 'sleepy', causedBy: 'user.idle' });
    expect(currentState).toBe('sleeping');

    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000);
    expect(currentState).toBe('sleeping');

    engine.dispose();
  });

  it('allows higher-priority reaction to interrupt active lower-priority reaction', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    // curious has priority 1
    engine.handle({ type: 'curious', causedBy: 'application.opened' });
    expect(currentState).toBe('surprised');

    // concerned has priority 3
    const result = engine.handle({ type: 'concerned', causedBy: 'network.offline' });

    expect(result).toEqual({
      status: 'accepted',
      intent: 'concerned',
      petState: 'angry',
    });
    expect(currentState).toBe('angry');

    engine.dispose();
  });

  it('rejects lower-priority reaction when higher-priority reaction is active', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    // concerned (priority 3)
    engine.handle({ type: 'concerned', causedBy: 'network.offline' });
    expect(currentState).toBe('angry');

    // curious (priority 1) arrives
    const result = engine.handle({ type: 'curious', causedBy: 'application.opened' });

    expect(result).toEqual({
      status: 'rejected',
      intent: 'curious',
      reason: 'priority',
    });
    expect(currentState).toBe('angry');

    engine.dispose();
  });

  it('retains active reaction when equal-priority reaction arrives', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    // notice (priority 1)
    engine.handle({ type: 'notice', causedBy: 'application.closed' });
    expect(currentState).toBe('surprised');

    // curious (priority 1) arrives
    const result = engine.handle({ type: 'curious', causedBy: 'application.opened' });

    expect(result).toEqual({
      status: 'rejected',
      intent: 'curious',
      reason: 'priority',
    });
    expect(currentState).toBe('surprised');

    engine.dispose();
  });

  it('enforces cooldown for repeated identical accepted intents', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    // First curious call accepts (cooldown is 2000ms)
    const res1 = engine.handle({ type: 'curious', causedBy: 'application.opened' });
    expect(res1.status).toBe('accepted');

    // Let duration (1500ms) expire so pet returns to idle
    vi.advanceTimersByTime(1500);
    expect(currentState).toBe('idle');

    // Second curious call at 1500ms is within 2000ms cooldown window
    const res2 = engine.handle({ type: 'curious', causedBy: 'application.opened' });
    expect(res2).toEqual({
      status: 'rejected',
      intent: 'curious',
      reason: 'cooldown',
    });
    expect(currentState).toBe('idle');

    engine.dispose();
  });

  it('allows reaction execution after cooldown expires', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    // curious cooldown is 2000ms
    engine.handle({ type: 'curious', causedBy: 'application.opened' });
    vi.advanceTimersByTime(1500); // returns to idle
    expect(currentState).toBe('idle');

    // Advance past cooldown threshold (2001ms total)
    vi.advanceTimersByTime(501);

    const res = engine.handle({ type: 'curious', causedBy: 'application.opened' });
    expect(res.status).toBe('accepted');
    expect(currentState).toBe('surprised');

    engine.dispose();
  });

  it('prevents stale completion timers from resetting newer interrupted reactions to idle', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    // 1. curious (1500ms duration)
    engine.handle({ type: 'curious', causedBy: 'application.opened' });
    expect(currentState).toBe('surprised');

    // 2. Advance 500ms, then concerned (priority 3, 2000ms duration) interrupts curious
    vi.advanceTimersByTime(500);
    engine.handle({ type: 'concerned', causedBy: 'network.offline' });
    expect(currentState).toBe('angry');

    // 3. Advance 1000ms (total time 1500ms, when curious timer would have fired)
    vi.advanceTimersByTime(1000);
    // State MUST remain 'angry', not reset to 'idle'
    expect(currentState).toBe('angry');

    // 4. Advance remaining 1000ms (concerned duration ends)
    vi.advanceTimersByTime(1000);
    expect(currentState).toBe('idle');

    engine.dispose();
  });

  it('disposing engine clears active timers and resources', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    engine.handle({ type: 'curious', causedBy: 'application.opened' });
    expect(currentState).toBe('surprised');

    engine.dispose();
    expect(engine.getActiveReaction()).toBeNull();

    // Advancing timers should not mutate state after dispose
    vi.advanceTimersByTime(2000);
    expect(currentState).toBe('surprised'); // unchanged
  });

  it('verifies full wake-up sequence from sleeping (sleepy -> attentive)', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    // 1. user.idle -> sleepy (priority 1) -> sleeping
    const sleepyRes = engine.handle({ type: 'sleepy', causedBy: 'user.idle' });
    expect(sleepyRes.status).toBe('accepted');
    expect(currentState).toBe('sleeping');

    // 2. user.active -> attentive (priority 2) -> interrupts sleeping
    const attentiveRes = engine.handle({ type: 'attentive', causedBy: 'user.active' });
    expect(attentiveRes.status).toBe('accepted');
    expect(currentState).toBe('listening');

    // 3. After attentive duration (1800ms) -> returns to idle
    vi.advanceTimersByTime(1800);
    expect(currentState).toBe('idle');

    engine.dispose();
  });

  it('verifies concerned (priority 3) wakes pet from sleeping', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    // user.idle -> sleepy -> sleeping
    engine.handle({ type: 'sleepy', causedBy: 'user.idle' });
    expect(currentState).toBe('sleeping');

    // network.offline -> concerned (priority 3) interrupts sleeping -> angry
    const res = engine.handle({ type: 'concerned', causedBy: 'network.offline' });
    expect(res.status).toBe('accepted');
    expect(currentState).toBe('angry');

    // 2000ms later -> idle
    vi.advanceTimersByTime(2000);
    expect(currentState).toBe('idle');

    engine.dispose();
  });

  it('maintains Pet Brain decoupling: evaluatePetEvent produces intent without mutating PetState directly', () => {
    let currentState: PetState = 'idle';
    const engine = createReactionEngine({
      setPetState: (s) => {
        currentState = s;
      },
    });

    const event: DomainEvent = {
      type: 'network.offline',
      occurredAt: Date.now(),
    };

    // PetBrain evaluates event to intent
    const intent = evaluatePetEvent(event);
    expect(intent).toEqual({
      type: 'concerned',
      causedBy: 'network.offline',
    });
    // PetState must still be idle before engine executes it
    expect(currentState).toBe('idle');

    // ReactionEngine handles intent and updates PetState
    engine.handle(intent!);
    expect(currentState).toBe('angry');

    engine.dispose();
  });
});
