
import React from 'react';

export const Header: React.FC = () => (
  <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#00A79D] rounded-md flex items-center justify-center text-white font-bold text-xl">OS</div>
      <h1 className="text-xl font-bold tracking-tight text-slate-800">Wave Orchestrator</h1>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-medium">Administrator</p>
        <p className="text-xs text-slate-500">Warehouse Lead</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
        <img src="https://picsum.photos/40/40" alt="Avatar" />
      </div>
    </div>
  </header>
);

export const Sidebar: React.FC = () => (
  <aside className="w-64 bg-slate-900 text-white min-h-[calc(100vh-64px)] hidden lg:block p-6">
    <nav className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Orchestration</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-3 p-2 bg-[#00A79D] rounded-md cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Wave Management
          </li>
          <li className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-md transition-colors cursor-pointer text-slate-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Live Monitoring
          </li>
        </ul>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Settings</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-md transition-colors cursor-pointer text-slate-300">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            General Rules
          </li>
        </ul>
      </div>
    </nav>
  </aside>
);
