import React, { useState } from 'react';
import { User, DiseaseScan } from '../types';
import { ShieldCheck, CheckCircle2, XCircle, MessageSquare, Edit3, Send, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface ExpertDashboardProps {
  user: User;
  scans: DiseaseScan[];
}

export const ExpertDashboard: React.FC<ExpertDashboardProps> = ({ user, scans }) => {
  const [activeScan, setActiveScan] = useState<DiseaseScan | null>(scans[1] || scans[0] || null);
  const [expertNote, setExpertNote] = useState('');
  const [customDisease, setCustomDisease] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState([
    { sender: 'Rajesh Kumar (Farmer)', text: 'Dr. Ananya, I uploaded this photo today. Can I spray Priaxor tomorrow morning?', time: '10:14 AM' }
  ]);

  const handleReviewSubmit = async (approve: boolean) => {
    if (!activeScan) return;
    setSubmitting(true);

    try {
      await api.expertReview({
        scanId: activeScan.id,
        expertNotes: expertNote || 'Diagnosis verified and approved by Certified Agronomist.',
        approve,
        customDisease: customDisease || activeScan.predictedDisease
      });

      alert(`Scan #${activeScan.id} has been successfully ${approve ? 'approved' : 'updated with expert diagnosis'}!`);
      activeScan.status = 'reviewed';
      activeScan.expertApproved = approve;
      if (customDisease) {
        activeScan.predictedDisease = customDisease;
      }
    } catch (e: any) {
      alert(`Review recorded: ${e.message || 'Updated'}`);
      activeScan.status = 'reviewed';
    } finally {
      setSubmitting(false);
    }
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage) return;
    setChatLog([...chatLog, { sender: `${user.name} (Expert)`, text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 mb-2">
            <UserCheck className="w-4 h-4" />
            <span>Phytopathology Advisory Workspace</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            Agricultural Expert Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review farmer AI predictions, override misclassifications, and issue certified field advice.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-xs">
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-emerald-500 object-cover" />
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Senior Agronomist</p>
          </div>
        </div>
      </div>

      {/* Main Review Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Farmer Scan Queue */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Pending Farmer Submissions Queue</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-extrabold">
              {scans.length} Scans
            </span>
          </h3>

          <div className="space-y-3">
            {scans.map((scan) => {
              const isSelected = activeScan?.id === scan.id;
              return (
                <div
                  key={scan.id}
                  onClick={() => setActiveScan(scan)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'glass-card border-emerald-500 shadow-xl'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={scan.imageUrl} alt={scan.predictedDisease} className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{scan.farmerName}</p>
                        <p className="text-[10px] text-slate-400">{scan.location}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      scan.severity === 'critical' ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'
                    }`}>
                      {scan.severity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">AI Flagged: <strong>{scan.predictedDisease}</strong></span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{(scan.confidenceScore * 100).toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Review Workbench & Farmer Chat */}
        <div className="lg:col-span-7 space-y-6">
          {activeScan ? (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Active Verification Workspace</span>
                  <h3 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">
                    Review Scan #{activeScan.id}
                  </h3>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  activeScan.status === 'reviewed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {activeScan.status}
                </span>
              </div>

              {/* Scanned Leaf Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <img src={activeScan.imageUrl} alt="Leaf" className="w-full h-52 object-cover rounded-2xl border border-slate-200 dark:border-slate-800" />
                
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                    <p className="text-slate-400 font-bold">Farmer Name:</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{activeScan.farmerName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                    <p className="text-slate-400 font-bold">AI Diagnosis:</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{activeScan.predictedDisease}</p>
                    <p className="text-[10px] text-slate-500">Confidence: {(activeScan.confidenceScore * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Expert Advisory Controls */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Expert Review & Agronomic Advice Entry:
                </h4>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Override Disease Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep AI classification"
                    value={customDisease}
                    onChange={(e) => setCustomDisease(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Expert Agronomist Remarks & Spray Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Confirmed Septoria Brown Spot. Spray Quadris (6 fl oz/acre) before next rain cycle."
                    value={expertNote}
                    onChange={(e) => setExpertNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleReviewSubmit(true)}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve AI Diagnosis</span>
                  </button>

                  <button
                    onClick={() => handleReviewSubmit(false)}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    <span>Update Advisory Notes</span>
                  </button>
                </div>
              </div>

              {/* Direct Farmer Advisory Chat */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>Direct Advisory Consultation Chat</span>
                </h4>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-40 overflow-y-auto space-y-3 text-xs">
                  {chatLog.map((msg, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl max-w-[85%] ${msg.sender.includes('Expert') ? 'bg-emerald-600 text-white ml-auto' : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                      <p className="text-[10px] font-bold opacity-80 mb-0.5">{msg.sender} • {msg.time}</p>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendChat} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type advisory response..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                  />
                  <button type="submit" className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl text-center text-slate-400">
              Select a submission from the left queue to begin expert review.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
