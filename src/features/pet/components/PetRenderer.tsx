import React from 'react';
import { usePetStore } from '../model/pet.store';
import { PetState } from '../model/pet.types';

interface PetVisualConfig {
  label: string;
  badge: string;
  eyes: React.ReactNode;
  mouth: React.ReactNode;
  accentBg: string;
}

const VISUAL_CONFIGS: Record<PetState, PetVisualConfig> = {
  idle: {
    label: 'Idle',
    badge: '😐',
    eyes: (
      <div className="flex items-center space-x-3">
        <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
      </div>
    ),
    mouth: <div className="w-6 h-1.5 rounded-full bg-slate-300/80" />,
    accentBg: 'from-indigo-500 via-purple-500 to-pink-500',
  },
  walking: {
    label: 'Walking',
    badge: '🚶',
    eyes: (
      <div className="flex items-center space-x-3">
        <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] translate-x-0.5" />
        <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] translate-x-0.5" />
      </div>
    ),
    mouth: <div className="w-5 h-1 rounded-full bg-cyan-300/80 translate-x-0.5" />,
    accentBg: 'from-blue-500 via-cyan-500 to-teal-500',
  },
  sleeping: {
    label: 'Sleeping',
    badge: '💤',
    eyes: (
      <div className="flex items-center space-x-3">
        <div className="w-3.5 h-1 rounded-full bg-indigo-300 shadow-[0_0_6px_rgba(165,180,252,0.8)]" />
        <div className="w-3.5 h-1 rounded-full bg-indigo-300 shadow-[0_0_6px_rgba(165,180,252,0.8)]" />
      </div>
    ),
    mouth: <div className="w-2.5 h-2.5 rounded-full bg-indigo-400/60" />,
    accentBg: 'from-slate-700 via-indigo-900 to-slate-900',
  },
  happy: {
    label: 'Happy',
    badge: '😊',
    eyes: (
      <div className="flex items-center space-x-3">
        <div className="w-3.5 h-2 rounded-t-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
        <div className="w-3.5 h-2 rounded-t-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
      </div>
    ),
    mouth: <div className="w-6 h-3 rounded-b-full bg-amber-300/90" />,
    accentBg: 'from-amber-400 via-orange-500 to-rose-500',
  },
  angry: {
    label: 'Angry',
    badge: '😡',
    eyes: (
      <div className="flex items-center space-x-3">
        <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] rotate-12" />
        <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] -rotate-12" />
      </div>
    ),
    mouth: <div className="w-6 h-1.5 bg-rose-400/90 rounded-t-md" />,
    accentBg: 'from-red-600 via-rose-700 to-orange-600',
  },
  surprised: {
    label: 'Surprised',
    badge: '😲',
    eyes: (
      <div className="flex items-center space-x-3">
        <div className="w-4 h-4 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
        </div>
        <div className="w-4 h-4 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
        </div>
      </div>
    ),
    mouth: <div className="w-3.5 h-3.5 rounded-full bg-yellow-300/90" />,
    accentBg: 'from-fuchsia-500 via-purple-600 to-violet-600',
  },
  listening: {
    label: 'Listening',
    badge: '🎵',
    eyes: (
      <div className="flex items-center space-x-3">
        <div className="w-3.5 h-3.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
        <div className="w-3.5 h-3.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
      </div>
    ),
    mouth: <div className="w-4 h-2 rounded-b-full bg-violet-300/80" />,
    accentBg: 'from-violet-500 via-purple-500 to-fuchsia-500',
  },
};

export function PetRenderer(): React.ReactElement {
  const state = usePetStore((s) => s.state);
  const config = VISUAL_CONFIGS[state] ?? VISUAL_CONFIGS.idle;

  return (
    <div
      data-tauri-drag-region
      data-testid="pet-renderer-container"
      data-pet-state={state}
      className={`w-36 h-36 rounded-3xl bg-gradient-to-br ${config.accentBg} p-1 shadow-2xl flex flex-col items-center justify-between cursor-grab active:cursor-grabbing border border-white/20 select-none transition-colors duration-200`}
    >
      {/* Inner Card Content */}
      <div
        data-tauri-drag-region
        className="w-full h-full bg-slate-900/90 rounded-[20px] p-3 flex flex-col items-center justify-between text-center backdrop-blur-sm pointer-events-none relative overflow-hidden"
      >
        {/* Badge Indicator */}
        <div className="absolute top-1.5 right-2 text-xs" title={config.label}>
          {config.badge}
        </div>

        <div className="w-full flex-1 flex flex-col items-center justify-center pt-2 space-y-2">
          {/* Eyes */}
          {config.eyes}

          {/* Mouth */}
          {config.mouth}
        </div>

        {/* Labels */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-semibold tracking-wider text-slate-200 uppercase">
            DeskBuddy
          </span>
          <span className="text-[9px] text-slate-400 font-mono">
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
