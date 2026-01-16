
import React, { useState } from 'react';
import { Condition } from '../types';
import { FIELDS, OPERATORS, MOCK_ORDERS } from '../constants';

interface ConditionBuilderProps {
  conditions: Condition[];
  onAdd: (c: Condition) => void;
  onRemove: (id: string) => void;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ conditions, onAdd, onRemove }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCondition, setNewCondition] = useState<Partial<Condition>>({
    field: FIELDS[0],
    operator: OPERATORS[3], // Default to 'in'
    value: '',
    joiner: 'AND',
    infoFieldName: '',
    infoFieldType: 'string'
  });

  const handleAdd = () => {
    const isInfo = newCondition.field?.toLowerCase().includes('information');
    if (newCondition.value || (isInfo && newCondition.infoFieldName)) {
      onAdd({
        id: Math.random().toString(36).substr(2, 9),
        field: newCondition.field!,
        operator: newCondition.operator!,
        value: newCondition.value!,
        joiner: conditions.length > 0 ? newCondition.joiner : undefined,
        infoFieldName: isInfo ? newCondition.infoFieldName : undefined,
        infoFieldType: isInfo ? newCondition.infoFieldType : undefined
      });
      setNewCondition({ ...newCondition, value: '', infoFieldName: '' });
      setIsModalOpen(false);
    }
  };

  const isInformationField = newCondition.field?.toLowerCase().includes('information');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Step 1 Header & Rule Engine */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#00A79D]/10 text-[#00A79D] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Step 01</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Selection Pool</h2>
            </div>
            <p className="text-slate-500 text-sm font-medium">Define which pending orders should enter this orchestration wave.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00A79D] text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-emerald-500/20 hover:bg-[#008d84] transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Add New Condition
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 min-h-[80px] p-6 bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
          {conditions.length === 0 ? (
            <div className="w-full text-center py-4">
              <p className="text-slate-400 italic text-sm">No specific filters applied. <span className="text-slate-600 font-bold underline">All eligible orders</span> will be included.</p>
            </div>
          ) : (
            conditions.map((c, idx) => (
              <React.Fragment key={c.id}>
                {idx > 0 && (
                  <div className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 uppercase">
                    {c.joiner}
                  </div>
                )}
                <div className="flex items-center gap-3 bg-white border border-slate-200 pl-5 pr-2.5 py-3 rounded-2xl text-xs shadow-sm group hover:border-[#00A79D] hover:shadow-md transition-all">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-0.5">
                      {c.field}{c.infoFieldName ? ` : ${c.infoFieldName}` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium italic">{c.operator}</span>
                      <span className="text-[#00A79D] font-black text-sm">{c.value}</span>
                    </div>
                  </div>
                  <button onClick={() => onRemove(c.id)} className="ml-2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Live Preview List */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-[#00A79D]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">Live Selection Preview</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Orders matching defined rules</p>
            </div>
          </div>
          <div className="px-6 py-3 bg-[#00A79D]/5 border border-[#00A79D]/20 rounded-2xl flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Estimated Pool Size</span>
            <span className="text-2xl font-black text-[#00A79D] leading-none">142 <span className="text-xs text-slate-400">orders</span></span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Customer Segment</th>
                <th className="px-8 py-5">Priority</th>
                <th className="px-8 py-5">Sales Channel</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_ORDERS.slice(0, 5).map(order => (
                <tr key={order.id} className="hover:bg-emerald-50/20 transition-all group">
                  <td className="px-8 py-5">
                    <span className="font-mono font-black text-[#00A79D] text-sm group-hover:underline underline-offset-4 cursor-pointer">{order.id}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-800 text-sm">{order.client}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                      order.priority === 'P1' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-500 font-medium text-sm">{order.channel}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-5 text-center bg-slate-50/20 border-t border-slate-50">
            <button className="text-[11px] font-black text-[#00A79D] hover:text-[#008d84] uppercase tracking-widest flex items-center justify-center gap-2 mx-auto">
              View all results
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal - Styled for OneStock */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Filter Rule</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Target specific orders for this wave.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-2xl transition-all"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-10 space-y-6">
              {conditions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Operator</label>
                  <div className="flex gap-2">
                    {['AND', 'OR'].map(joiner => (
                      <button
                        key={joiner}
                        onClick={() => setNewCondition({...newCondition, joiner: joiner as any})}
                        className={`flex-1 py-4 rounded-2xl text-sm font-black border transition-all ${
                          newCondition.joiner === joiner 
                            ? 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/30' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-orange-300'
                        }`}
                      >
                        {joiner}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Field</label>
                <div className="relative group">
                  <select 
                    value={newCondition.field}
                    onChange={e => setNewCondition({...newCondition, field: e.target.value})}
                    className="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-[#00A79D]/10 focus:border-[#00A79D] transition-all appearance-none cursor-pointer pr-12"
                  >
                    {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-[#00A79D]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {isInformationField && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. VIP_Level"
                      value={newCondition.infoFieldName}
                      onChange={e => setNewCondition({...newCondition, infoFieldName: e.target.value})}
                      className="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-[#00A79D]/10 focus:border-[#00A79D] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Type</label>
                    <select 
                      value={newCondition.infoFieldType}
                      onChange={e => setNewCondition({...newCondition, infoFieldType: e.target.value})}
                      className="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-[#00A79D]/10 focus:border-[#00A79D] transition-all appearance-none pr-10"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</label>
                  <select 
                    value={newCondition.operator}
                    onChange={e => setNewCondition({...newCondition, operator: e.target.value})}
                    className="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-[#00A79D]/10 focus:border-[#00A79D] transition-all appearance-none pr-10"
                  >
                    {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Value</label>
                  <input 
                    type="text"
                    placeholder="Value..."
                    value={newCondition.value}
                    onChange={e => setNewCondition({...newCondition, value: e.target.value})}
                    className="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-[#00A79D]/10 focus:border-[#00A79D] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-8 py-4.5 rounded-2xl font-bold text-slate-500 hover:bg-white hover:text-slate-800 transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                className="flex-[1.5] bg-[#00A79D] text-white px-10 py-4.5 rounded-2xl font-black shadow-2xl shadow-emerald-500/20 hover:bg-[#008d84] transition-all"
              >
                Apply Filter Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
