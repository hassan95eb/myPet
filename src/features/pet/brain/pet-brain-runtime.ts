import { DomainEventBus } from '../../../core/events/domain-event-bus';
import { domainEventBus } from '../../../core/events/domain-event-bus.instance';
import { DomainEvent, DomainEventType } from '../../../core/events/domain-event.types';
import { evaluatePetEvent } from './pet-brain';
import { ReactionIntent } from './reaction-intent.types';

type IntentListener = (intent: ReactionIntent) => void;

const intentListeners = new Set<IntentListener>();
let activeBus: DomainEventBus | null = null;
let activeUnsubscribes: Array<() => void> = [];

export function onReactionIntent(listener: IntentListener): () => void {
  intentListeners.add(listener);
  return () => {
    intentListeners.delete(listener);
  };
}

export function initPetBrainRuntime(
  bus: DomainEventBus = domainEventBus
): () => void {
  // If already initialized on this bus, return cleanup function
  if (activeBus === bus && activeUnsubscribes.length > 0) {
    return cleanupPetBrainRuntime;
  }

  // Clean up any previous initialization
  cleanupPetBrainRuntime();

  activeBus = bus;

  const eventTypes: DomainEventType[] = [
    'application.opened',
    'application.closed',
    'network.online',
    'network.offline',
    'user.idle',
    'user.active',
  ];

  const handleDomainEvent = (event: DomainEvent) => {
    const intent = evaluatePetEvent(event);
    if (!intent) {
      return;
    }

    const snapshot = Array.from(intentListeners);
    for (const listener of snapshot) {
      listener(intent);
    }
  };

  activeUnsubscribes = eventTypes.map((type) =>
    bus.subscribe(type, handleDomainEvent)
  );

  return cleanupPetBrainRuntime;
}

export function cleanupPetBrainRuntime(): void {
  for (const unsub of activeUnsubscribes) {
    unsub();
  }
  activeUnsubscribes = [];
  activeBus = null;
}
