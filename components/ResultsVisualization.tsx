
import React from 'react';
import { MOCK_ORDERS } from '../constants';

interface ResultsVisualizationProps {
  strategyName: string;
  onNext: () => void;
}

export const ResultsVisualization: React.FC<ResultsVisualizationProps> = ({ strategyName, onNext }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Proposed Wave Distribution</h2>
            <p className="text-sm text-slate-500 font-medium">Previewing results for <span className="text-[#00A79D] font-bold">Current Simulation</span></p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export XLSX
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Client / Priority</th>
                <th className="px-8 py-5">Article (SKU)</th>
                <th className="px-8 py-5">Quantity</th>
                <th className="px-8 py-5">Proposed Stock Point</th>
                <th className="px-8 py-5 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_ORDERS.map((order, idx) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 font-mono font-bold text-[#00A79D]">{order.id}</td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{order.client}</span>
                      <span className={`text-[9px] w-fit px-1.5 py-0.5 rounded-lg font-black uppercase ${
                        order.priority === 'P1' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {order.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-slate-600 font-medium">{order.sku}</span>
                  </td>
                  <td className="px-8 py-4 font-black text-slate-700">{order.quantity}</td>
                  <td className="px-8 py-4">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-[#00A79D]"></div>
                       <span className="font-bold text-slate-600 uppercase">WH-PARIS-{(idx % 3) + 1}</span>
                     </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${90 - idx * 5}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{90 - idx * 5}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 text-center bg-slate-50/50 border-t border-slate-100">
            <button className="text-xs font-bold text-[#00A79D] hover:underline">View distribution details</button>
          </div>
        </div>
      </div>

      {/* Action Toolbar (Finalize Orchestration) */}
      <div className="bg-[#0a1220] rounded-[2.5rem] px-8 py-7 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 border border-white/5 animate-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-[#00A79D]/10 rounded-2xl flex items-center justify-center text-[#00A79D] border border-[#00A79D]/20">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-white font-black text-xl tracking-tight leading-tight">Finalize Orchestration</h4>
            <p className="text-slate-400 text-[13px] font-medium tracking-tight">
              Matched scope: <span className="text-white font-black">142 orders</span> for "{strategyName}"
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button className="px-6 py-3 bg-[#1e293b]/50 text-slate-200 rounded-2xl font-bold text-sm hover:bg-[#1e293b] hover:text-white transition-all border border-white/10 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Save Only
          </button>
          
          <button className="px-6 py-3 bg-[#ef5e0e] text-white rounded-2xl font-bold text-sm hover:bg-[#d8540d] transition-all shadow-lg shadow-orange-950/20 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Launch Ad-hoc
          </button>
          
          <div className="h-8 w-[1px] bg-white/10 mx-1 hidden lg:block"></div>
          
          <button 
            onClick={onNext}
            className="px-8 py-3 bg-[#00a79d] text-white rounded-2xl font-black text-sm hover:bg-[#008d84] transition-all shadow-xl shadow-[#00a79d]/20 flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            Save & Launch Wave
          </button>
        </div>
      </div>
    </div>
  );
};
