
import React, { useState } from 'react';
import { MOCK_SCENARIOS } from '../constants';

interface SelectionSummaryProps {
  strategyName: string;
}

export const SelectionSummary: React.FC<SelectionSummaryProps> = ({ strategyName }) => {
  const [selectedId, setSelectedId] = useState(MOCK_SCENARIOS[1].id);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800">Review & Launch Strategy</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          You are about to save and execute <span className="text-[#00A79D] font-bold">"{strategyName}"</span>. 
          Select the final simulation logic that yields the best results.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {MOCK_SCENARIOS.map(sc => (
          <div 
            key={sc.id} 
            onClick={() => setSelectedId(sc.id)}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
              selectedId === sc.id 
                ? 'border-[#00A79D] bg-white shadow-xl ring-8 ring-[#00A79D]/5' 
                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 opacity-70 grayscale-[0.5]'
            }`}
          >
            {selectedId === sc.id && (
              <div className="absolute top-0 right-0 bg-[#00A79D] text-white px-5 py-1.5 rounded-bl-2xl text-[10px] font-bold tracking-widest uppercase shadow-sm">
                Primary Selection
              </div>
            )}
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  selectedId === sc.id ? 'bg-[#00A79D] text-white shadow-lg shadow-emerald-500/30 rotate-3' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'
                }`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800">{sc.name}</h3>
                  <p className="text-sm text-slate-500 leading-tight">{sc.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-slate-100 backdrop-blur-sm">
                 <div className="px-4 py-2 text-center border-r border-slate-100">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Delivery</p>
                   <p className="text-base font-bold text-[#00A79D]">{sc.metrics.deliveryTime}d</p>
                 </div>
                 <div className="px-4 py-2 text-center">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Fulfillment</p>
                   <p className="text-base font-bold text-slate-800">{sc.metrics.fulfillmentRate}%</p>
                 </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
              {sc.rules.map((rule, i) => (
                <span key={i} className={`text-[10px] px-3 py-1.5 rounded-xl border transition-all ${
                  selectedId === sc.id ? 'bg-[#00A79D]/5 border-[#00A79D]/20 text-[#00A79D] font-bold' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {rule}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden group/launch">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover/launch:bg-emerald-500/20 transition-all duration-700"></div>
        
        <div className="space-y-3 text-center lg:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Validation Phase
          </div>
          <p className="text-3xl font-extrabold tracking-tight">Save & Orchestrate Wave</p>
          <p className="text-slate-400 max-w-md font-medium">
            This will apply the selected logic to <span className="text-white font-bold">142 orders</span> and save the strategy as <span className="text-emerald-400 font-bold">"{strategyName}"</span>.
          </p>
        </div>
        
        <button className="bg-[#00A79D] hover:bg-[#008d84] text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/40 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-4 relative z-10">
          START EXECUTION
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  );
};
