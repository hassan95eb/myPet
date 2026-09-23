import React, { useState, useEffect, useCallback } from 'react';
import { domainEventBus } from '../../../core/events/domain-event-bus.instance';
import { DomainEvent, DomainEventType } from '../../../core/events/domain-event.types';
import { onReactionIntent } from '../../pet/brain/pet-brain-runtime';
import { ReactionIntent } from '../../pet/brain/reaction-intent.types';

export function EventSimulatorDevControl(): React.ReactElement | null {
  const [appName, setAppName] = useState('Google Chrome');
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const eventTypes: DomainEventType[] = [
      'application.opened',
      'application.closed',
      'network.online',
      'network.offline',
      'user.idle',
      'user.active',
    ];

    const unsubscribes = eventTypes.map((type) =>
      domainEventBus.subscribe(type, (event: DomainEvent) => {
        let details = '';
        if (event.type === 'application.opened' || event.type === 'application.closed') {
          details = ` (${event.payload.applicationName})`;
        }
        const timeStr = new Date(event.occurredAt).toLocaleTimeString();
        setLastEvent(`${event.type}${details} @ ${timeStr}`);
        console.debug('[Dev Event Simulator] Event received:', event);
      })
    );

    const unsubIntent = onReactionIntent((intent: ReactionIntent) => {
      let details = '';
      if (intent.context?.applicationName) {
        details = ` (${intent.context.applicationName})`;
      }
      setLastIntent(`${intent.type}${details}`);
      console.debug('[Dev Event Simulator] Pet Brain ReactionIntent:', intent);
    });

    return () => {
      for (const unsub of unsubscribes) {
        unsub();
      }
      unsubIntent();
    };
  }, []);

  const handleSimulate = useCallback(
    (type: DomainEventType) => {
      const occurredAt = Date.now();
      if (type === 'application.opened' || type === 'application.closed') {
        domainEventBus.publish({
          type,
          occurredAt,
          payload: { applicationName: appName.trim() || 'Google Chrome' },
        });
      } else if (type === 'network.online' || type === 'network.offline') {
        domainEventBus.publish({ type, occurredAt });
      } else if (type === 'user.idle' || type === 'user.active') {
        domainEventBus.publish({ type, occurredAt });
      }
    },
    [appName]
  );

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div
      data-testid="event-simulator-dev-control"
      className="absolute top-2 left-2 z-50 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900/95 p-2 rounded-lg border border-slate-700/80 shadow-lg text-[10px] font-mono text-slate-200 flex flex-col gap-1.5 w-48"
    >
      <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px] border-b border-slate-800 pb-1 flex items-center justify-between">
        <span>Event Simulator</span>
        <span className="text-[8px] text-indigo-400">DEV</span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sim-app-name" className="text-[9px] text-slate-400">
          App Name:
        </label>
        <input
          id="sim-app-name"
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="Google Chrome"
          className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-[10px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => handleSimulate('application.opened')}
          className="bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white py-0.5 px-1 rounded transition-colors text-[9px]"
        >
          App Opened
        </button>
        <button
          type="button"
          onClick={() => handleSimulate('application.closed')}
          className="bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white py-0.5 px-1 rounded transition-colors text-[9px]"
        >
          App Closed
        </button>
        <button
          type="button"
          onClick={() => handleSimulate('network.online')}
          className="bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white py-0.5 px-1 rounded transition-colors text-[9px]"
        >
          Net Online
        </button>
        <button
          type="button"
          onClick={() => handleSimulate('network.offline')}
          className="bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white py-0.5 px-1 rounded transition-colors text-[9px]"
        >
          Net Offline
        </button>
        <button
          type="button"
          onClick={() => handleSimulate('user.idle')}
          className="bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white py-0.5 px-1 rounded transition-colors text-[9px]"
        >
          User Idle
        </button>
        <button
          type="button"
          onClick={() => handleSimulate('user.active')}
          className="bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white py-0.5 px-1 rounded transition-colors text-[9px]"
        >
          User Active
        </button>
      </div>

      <div className="mt-0.5 pt-1 border-t border-slate-800/80 text-[9px] text-slate-400 flex flex-col gap-0.5 truncate">
        <div className="truncate">
          <span className="text-slate-500">Last: </span>
          <span className="text-indigo-300">{lastEvent || 'None'}</span>
        </div>
        <div className="truncate">
          <span className="text-slate-500">Brain Intent: </span>
          <span className="text-emerald-300 font-semibold">{lastIntent || 'None'}</span>
        </div>
      </div>
    </div>
  );
}
