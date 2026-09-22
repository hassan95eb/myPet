import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { APP_NAME } from './shared/constants/app';

export default function App() {
  const [status, setStatus] = useState<string>('Connecting to native core...');
  const [version, setVersion] = useState<string>('0.1.0');

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      try {
        const appStatus = await invoke<string>('get_app_status');
        const appVersion = await invoke<string>('get_app_version');
        if (isMounted) {
          setStatus(appStatus);
          setVersion(appVersion);
        }
      } catch {
        if (isMounted) {
          setStatus('Running in standalone Web Mode (Native IPC off)');
        }
      }
    }

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-900 text-slate-100">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight text-white">{APP_NAME}</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300 font-mono">
            v{version}
          </span>
        </div>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Step 00 — Technical Foundation & Architecture verified. Core runtime, React 19, Vite,
          Tailwind CSS v4, and Tauri native integration ready.
        </p>

        <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-800/80 font-mono text-xs text-emerald-400">
          <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
            Native Core Status
          </div>
          <div>{status}</div>
        </div>
      </div>
    </div>
  );
}
