import React, { useState } from 'react';
import { Search, Filter, Sprout, Bug, ShieldAlert, CheckCircle, ExternalLink, ChevronRight, Video, FileText } from 'lucide-react';
import { Disease } from '../types';

interface DiseaseDatabasePageProps {
  diseases: Disease[];
  onNavigateTab: (tab: string) => void;
}

export const DiseaseDatabasePage: React.FC<DiseaseDatabasePageProps> = ({ diseases, onNavigateTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(diseases[0] || null);

  const filteredDiseases = diseases.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.symptoms.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || d.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sprout className="w-8 h-8 text-emerald-500" />
            <span>Soybean Disease Knowledge Base</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive phytopathology database with symptoms, chemical fungicides, organic solutions, and preventive advice.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('scan')}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 hover:opacity-95 transition-all flex items-center space-x-1.5 self-start md:self-auto"
        >
          <span>Diagnose Leaf Image Now</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by disease name, symptoms, or scientific name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 ${
                selectedSeverity === sev
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

      </div>

      {/* Catalog Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left List of Diseases */}
        <div className="lg:col-span-4 space-y-3">
          {filteredDiseases.map((d) => {
            const isSelected = selectedDisease?.id === d.id;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDisease(d)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between space-x-3 ${
                  isSelected
                    ? 'glass-card border-emerald-500 shadow-lg shadow-emerald-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={d.images[0]}
                    alt={d.name}
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30 shrink-0"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</h3>
                    <p className="text-[11px] font-serif italic text-slate-500 truncate max-w-[160px]">{d.scientificName}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  d.severity === 'critical' ? 'bg-rose-500/20 text-rose-500' :
                  d.severity === 'high' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-emerald-500/20 text-emerald-500'
                }`}>
                  {d.severity}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Disease Detail View */}
        <div className="lg:col-span-8">
          {selectedDisease ? (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
              
              {/* Disease Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Affected Stage: {selectedDisease.affectedStage}
                  </span>
                  <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mt-1">
                    {selectedDisease.name}
                  </h2>
                  <p className="text-xs font-serif italic text-slate-500">
                    Scientific Classification: {selectedDisease.scientificName}
                  </p>
                </div>

                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                  selectedDisease.severity === 'critical' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                  selectedDisease.severity === 'high' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                }`}>
                  {selectedDisease.severity} Risk Level
                </span>
              </div>

              {/* Disease Photo Showcase */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-64">
                <img
                  src={selectedDisease.images[0]}
                  alt={selectedDisease.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Symptoms & Causes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                    <Bug className="w-4 h-4 text-emerald-500" />
                    <span>Symptoms & Identification:</span>
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {selectedDisease.symptoms}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Environmental Causes:</span>
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {selectedDisease.causes}
                  </p>
                </div>
              </div>

              {/* Chemical & Organic Treatments */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b pb-1">
                  Agronomic Advisory & Treatment Protocol
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Chemical Fungicides:</p>
                    <p className="text-slate-600 dark:text-slate-300">{selectedDisease.treatment.chemical}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Organic Solutions:</p>
                    <p className="text-slate-600 dark:text-slate-300">{selectedDisease.treatment.organic}</p>
                  </div>
                </div>

                {/* Recommended Formulations Table */}
                {selectedDisease.recommendedPesticides.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Recommended Commercial Formulations:</p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Dosage / Acre</th>
                            <th className="p-3">Optimal Timing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {selectedDisease.recommendedPesticides.map((p, idx) => (
                            <tr key={idx}>
                              <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">{p.name}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-300">{p.dosage}</td>
                              <td className="p-3 text-slate-500">{p.timing}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl text-center text-slate-400">
              Select a disease from the list to view full details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
