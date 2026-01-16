
import React, { useMemo, useState } from 'react';
import { MOCK_SCENARIOS, MOCK_ORDERS } from '../constants';
import { Scenario } from '../types';

interface ScenarioComparisonProps {
  currentStrategyName: string;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ currentStrategyName }) => {
  // On crée un scénario "virtuel" pour la stratégie en cours
  const currentDraft: Scenario = {
    id: 'current-draft-id',
    name: currentStrategyName || 'New Strategy (Draft)',
    description: 'Current configuration in progress...',
    rules: [],
    metrics: { fulfillmentRate: 88, shippingCost: 5.1, deliveryTime: 2.1, carbonFootprint: 1.8, orderCount: 142, itemCount: 310 },
    status: 'Draft'
  };

  // On combine les scénarios sauvegardés avec le brouillon actuel
  const allAvailableScenarios = [currentDraft, ...MOCK_SCENARIOS];

  // Sélection par défaut : Le brouillon actuel + les 2 premiers mocks
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>(
    [currentDraft.id, MOCK_SCENARIOS[0].id, MOCK_SCENARIOS[1].id]
  );

  // Simulation de données de comparaison pour les stratégies sélectionnées
  const orderComparisonData = useMemo(() => {
    const strategies = allAvailableScenarios.filter(s => selectedScenarioIds.includes(s.id));
    const stockPoints = ['WH-PARIS-01', 'WH-LYON-02', 'STORE-NICE-04', 'WH-BERLIN-01'];

    if (strategies.length === 0) return [];

    return MOCK_ORDERS.map((order, idx) => {
      const selections = strategies.map((s, sIdx) => {
        // Simulation déterministe : le brouillon (current-draft-id) a ses propres règles de matching
        const isMatched = s.id === 'current-draft-id' 
          ? (idx % 3 !== 0) // Simule 66% de match pour le brouillon
          : ((idx + sIdx) % 4 !== 0);

        return {
          strategyId: s.id,
          strategyName: s.name,
          isMatched,
          proposedStock: isMatched ? stockPoints[(idx + sIdx) % stockPoints.length] : null
        };
      });

      const matchCount = selections.filter(s => s.isMatched).length;

      return {
        ...order,
        selections,
        matchCount,
        totalStrategies: strategies.length
      };
    }).sort((a, b) => b.matchCount - a.matchCount);
  }, [selectedScenarioIds, currentStrategyName]);

  const toggleScenario = (id: string) => {
    setSelectedScenarioIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id) 
        : [...prev, id]
    );
  };

  const selectedScenarios = allAvailableScenarios.filter(s => selectedScenarioIds.includes(s.id));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Sélecteur de stratégies */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">Comparison Selection</h3>
            <p className="text-sm text-slate-500 font-medium">Compare your current draft against benchmark strategies.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {allAvailableScenarios.map(s => {
              const isDraft = s.id === 'current-draft-id';
              return (
                <button
                  key={s.id}
                  onClick={() => toggleScenario(s.id)}
                  className={`relative px-5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                    selectedScenarioIds.includes(s.id)
                      ? isDraft 
                        ? 'bg-[#00A79D] border-[#00A79D] text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/20' 
                        : 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-[#00A79D] hover:text-[#00A79D]'
                  }`}
                >
                  {isDraft && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  )}
                  {s.name}
                  {isDraft && (
                    <span className="ml-1 text-[8px] opacity-70 border border-white/30 px-1 rounded uppercase tracking-tighter">Draft</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">Order Match Matrix</h3>
            <p className="text-sm text-slate-500 font-medium">
              Orders sorted by frequency of selection across {selectedScenarioIds.length} strategies
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export XLSX
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {selectedScenarioIds.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 w-64">Order & Frequency</th>
                  {selectedScenarios.map(s => (
                    <th key={s.id} className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5">
                          {s.id === 'current-draft-id' && <div className="w-2 h-2 bg-[#00A79D] rounded-full animate-ping"></div>}
                          <span className={s.id === 'current-draft-id' ? "text-[#00A79D]" : "text-slate-900"}>{s.name}</span>
                        </div>
                        <span className="text-[8px] mt-1 font-medium text-slate-400">Proposed Stock Point</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderComparisonData.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                          order.matchCount === order.totalStrategies ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 
                          order.matchCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {order.matchCount}/{order.totalStrategies}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{order.id}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{order.client}</p>
                        </div>
                      </div>
                    </td>
                    
                    {order.selections.map((sel, sIdx) => (
                      <td key={sIdx} className="px-8 py-6 text-center">
                        {sel.isMatched ? (
                          <div className="animate-in fade-in zoom-in-90 duration-300">
                            <div className={`inline-flex items-center gap-2 border px-3 py-1.5 rounded-xl shadow-sm transition-colors ${
                              sel.strategyId === 'current-draft-id' 
                                ? 'bg-emerald-50 border-[#00A79D] text-[#00A79D]' 
                                : 'bg-white border-slate-200 text-slate-700 group-hover:border-slate-300'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${sel.strategyId === 'current-draft-id' ? 'bg-[#00A79D]' : 'bg-slate-400'}`}></div>
                              <span className="text-[10px] font-black uppercase">{sel.proposedStock}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="w-6 h-[2px] bg-slate-100 rounded-full"></div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-20 text-center text-slate-400 italic">
              Select at least one strategy above to begin comparison.
            </div>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-8 duration-1000">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[#00A79D]/20 rounded-2xl flex items-center justify-center text-[#00A79D]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-white font-black text-xl tracking-tight">Finalize Orchestration</h4>
            <p className="text-slate-400 text-sm font-medium">Matched scope: <span className="text-white font-bold">142 orders</span> for "{currentDraft.name}"</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-6 py-3.5 bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Save Only
          </button>
          <button className="px-6 py-3.5 bg-orange-600 text-white rounded-2xl font-bold text-sm hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/40 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Launch Ad-hoc
          </button>
          <div className="h-10 w-[1px] bg-slate-700 mx-2 hidden md:block"></div>
          <button className="px-10 py-3.5 bg-[#00A79D] text-white rounded-2xl font-black text-sm hover:bg-[#008d84] transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 scale-105">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            Save & Launch Wave
          </button>
        </div>
      </div>
    </div>
  );
};
