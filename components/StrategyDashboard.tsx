
import React, { useState } from 'react';
import { Scenario } from '../types';

interface StrategyDashboardProps {
  scenarios: Scenario[];
  onSelect: (strategy: Scenario) => void;
  onEdit: (strategy: Scenario) => void;
  onCreateNew: () => void;
  onUpdateName: (id: string, newName: string) => void;
}

const DAYS = [
  { label: 'Mon', full: 'Monday', value: 1 },
  { label: 'Tue', full: 'Tuesday', value: 2 },
  { label: 'Wed', full: 'Wednesday', value: 3 },
  { label: 'Thu', full: 'Thursday', value: 4 },
  { label: 'Fri', full: 'Friday', value: 5 },
  { label: 'Sat', full: 'Saturday', value: 6 },
  { label: 'Sun', full: 'Sunday', value: 0 },
];

export const StrategyDashboard: React.FC<StrategyDashboardProps> = ({ 
  scenarios, 
  onSelect, 
  onEdit, 
  onCreateNew,
  onUpdateName 
}) => {
  const [showScheduleId, setShowScheduleId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  
  // New manual scheduling state
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [manualTimes, setManualTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('08:00');

  const handleStartEditing = (strategy: Scenario) => {
    setEditingNameId(strategy.id);
    setTempName(strategy.name);
  };

  const handleSaveName = (id: string) => {
    if (tempName.trim()) {
      onUpdateName(id, tempName);
    }
    setEditingNameId(null);
  };

  const toggleDay = (dayValue: number) => {
    setSelectedDays(prev =>
      prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue].sort((a, b) => a - b)
    );
  };

  const addTime = () => {
    if (newTime && !manualTimes.includes(newTime)) {
      setManualTimes(prev => [...prev, newTime].sort());
    }
  };

  const removeTime = (time: string) => {
    setManualTimes(prev => prev.filter(t => t !== time));
  };

  const setDayPreset = (type: 'weekdays' | 'weekends' | 'all' | 'clear') => {
    if (type === 'clear') setSelectedDays([]);
    else if (type === 'weekdays') setSelectedDays([1, 2, 3, 4, 5]);
    else if (type === 'weekends') setSelectedDays([6, 0]);
    else if (type === 'all') setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Saved Orchestration Strategies</h2>
          <p className="text-slate-500 mt-1">Manage, edit, or launch your pre-configured fulfillment workflows.</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="bg-[#00A79D] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-emerald-500/20 hover:bg-[#008d84] transition-all hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Strategy
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategy Name</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Last Perf (Orders / Items)</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Execution Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {scenarios.map((strategy) => (
                <React.Fragment key={strategy.id}>
                  <tr className="group hover:bg-slate-50/80 transition-all cursor-default">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-[#00A79D] rounded-xl flex items-center justify-center group-hover:bg-[#00A79D] group-hover:text-white transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <div className="flex-1">
                          {editingNameId === strategy.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="text-base font-bold text-slate-800 bg-white border border-[#00A79D] rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-[#00A79D]/20 w-full"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveName(strategy.id);
                                  if (e.key === 'Escape') setEditingNameId(null);
                                }}
                              />
                              <button 
                                onClick={() => handleSaveName(strategy.id)}
                                className="p-1 text-[#00A79D] hover:bg-emerald-50 rounded"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800 text-base">{strategy.name}</p>
                              <button 
                                onClick={() => handleStartEditing(strategy)}
                                className="p-1 text-slate-300 hover:text-[#00A79D] opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                            </div>
                          )}
                          <p className="text-xs text-slate-400 truncate max-w-[250px]">{strategy.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden lg:table-cell">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Orders</p>
                          <p className="text-sm font-bold text-slate-700">{strategy.metrics.orderCount}</p>
                        </div>
                        <div className="w-[1px] h-8 bg-slate-100"></div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Articles</p>
                          <p className="text-sm font-bold text-slate-700">{strategy.metrics.itemCount}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden sm:table-cell">
                      <div className="flex items-center gap-4">
                        <div className="space-y-0.5">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Last Run</span>
                           <span className="text-xs font-semibold text-slate-600 block whitespace-nowrap">
                             {strategy.lastExecuted ? strategy.lastExecuted : 'Never'}
                           </span>
                        </div>
                        <div className="w-[1px] h-6 bg-slate-100 hidden md:block"></div>
                        <div className="space-y-0.5">
                           <span className="text-[9px] font-bold text-[#00A79D] uppercase tracking-widest block">Next Run</span>
                           <span className="text-xs font-bold text-[#00A79D] block whitespace-nowrap">
                             {strategy.nextExecution ? strategy.nextExecution : (strategy.status === 'Active' ? 'Pending' : 'Manual')}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onSelect(strategy)}
                          className="px-4 py-2 bg-[#00A79D] text-white text-xs font-bold rounded-xl hover:bg-[#008d84] transition-all shadow-md shadow-emerald-500/10"
                        >
                          Select
                        </button>
                        <button 
                          onClick={() => onEdit(strategy)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                          title="Edit Logic"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={() => {
                            setShowScheduleId(showScheduleId === strategy.id ? null : strategy.id);
                            // Initial manual values
                            if (showScheduleId !== strategy.id) {
                              setManualTimes(['08:00', '14:00', '20:00']);
                            }
                          }}
                          className={`p-2 rounded-xl transition-all ${showScheduleId === strategy.id ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'}`}
                          title="Schedule"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showScheduleId === strategy.id && (
                    <tr className="bg-orange-50/10 border-l-4 border-orange-400">
                      <td colSpan={4} className="px-8 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-top-2 duration-300">
                          
                          {/* Days Selection */}
                          <div className="space-y-5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <h4 className="text-sm font-bold text-orange-900 uppercase tracking-wide">Execution Days</h4>
                              </div>
                              <div className="flex gap-2">
                                 {['weekdays', 'weekends', 'all', 'clear'].map(preset => (
                                   <button
                                     key={preset}
                                     onClick={() => setDayPreset(preset as any)}
                                     className="px-3 py-1 bg-white border border-orange-200 rounded-full text-[10px] font-bold text-orange-600 hover:bg-orange-100 transition-all uppercase tracking-tighter"
                                   >
                                     {preset}
                                   </button>
                                 ))}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {DAYS.map((day) => (
                                <button
                                  key={day.value}
                                  onClick={() => toggleDay(day.value)}
                                  className={`px-5 py-2 rounded-xl font-bold text-sm transition-all border ${
                                    selectedDays.includes(day.value)
                                      ? 'bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/20'
                                      : 'bg-white border-orange-200 text-orange-400 hover:border-orange-400 hover:text-orange-600'
                                  }`}
                                >
                                  {day.full}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Manual Hours Selection */}
                          <div className="space-y-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <h4 className="text-sm font-bold text-orange-900 uppercase tracking-wide">Manual Execution Times</h4>
                            </div>

                            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-orange-100 shadow-sm">
                              <input 
                                type="time" 
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                              />
                              <button 
                                onClick={addTime}
                                className="bg-orange-500 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Add Time
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {manualTimes.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">No execution times added yet.</p>
                              ) : (
                                manualTimes.map(time => (
                                  <div key={time} className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl animate-in zoom-in-90 duration-200">
                                    <span className="text-sm font-black text-orange-700">{time}</span>
                                    <button 
                                      onClick={() => removeTime(time)}
                                      className="text-orange-300 hover:text-red-500 transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Summary & Actions */}
                          <div className="lg:col-span-2 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-orange-200 gap-6">
                            <div className="flex-1">
                              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 inline-block">
                                <p className="text-sm font-medium text-orange-800 leading-relaxed">
                                  {selectedDays.length > 0 && manualTimes.length > 0 ? (
                                    <>
                                      This strategy is scheduled for <span className="font-bold">{manualTimes.length} execution(s)</span> daily 
                                      on <span className="font-bold">
                                        {selectedDays.length === 7 ? 'Every Day' : selectedDays.map(dv => DAYS.find(d => d.value === dv)?.label).join(', ')}
                                      </span> 
                                      at: <span className="font-bold text-orange-600">{manualTimes.join(', ')}</span>.
                                    </>
                                  ) : (
                                    "Please select execution days and add at least one manual time."
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                              <button 
                                onClick={() => setShowScheduleId(null)}
                                className="flex-1 md:flex-none bg-orange-600 text-white px-10 py-3 rounded-xl text-base font-bold hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/30"
                              >
                                Save Schedule
                              </button>
                              <button 
                                onClick={() => setShowScheduleId(null)}
                                className="flex-1 md:flex-none text-orange-500 bg-white border border-orange-200 px-8 py-3 rounded-xl text-base font-bold hover:bg-orange-50 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
