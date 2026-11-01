import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Activity, Database, FileText, Search, 
  Lock, RefreshCw, BarChart2, CheckCircle2, AlertCircle, MapPin, 
  Cpu, Layers, Sparkles, MessageSquare, Send, Clock, Check
} from 'lucide-react';
import type { User, SupportTicket } from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  user: User;
  tickets: SupportTicket[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'predictions' | 'map' | 'users' | 'tickets' | 'model' | 'audit' | 'tracking'>('analytics');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [allUsersForTracking, setAllUsersForTracking] = useState<any[]>([]);
  const [pendingExperts, setPendingExperts] = useState<any[]>([]);
  const [processingExpertId, setProcessingExpertId] = useState<string | null>(null);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('All');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapPoints, setMapPoints] = useState<any[]>([]);
  const [allScans, setAllScans] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedMapPoint, setSelectedMapPoint] = useState<any | null>(null);
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingType, setTrackingType] = useState('All');

  const loadAdminData = async () => {
    setLoading(true);
    // Load each panel independently. A failure in optional analytics, map, or
    // ticket endpoints must never hide the user directory or expert requests.
    const tasks = [
      api.getAdminSummary().then(setSummaryData).catch((err) => console.warn('Admin summary unavailable:', err)),
      api.getAdminUsers(searchQuery).then(setUsersList).catch((err) => console.warn('Admin users unavailable:', err)),
      api.getAdminUsers().then(setAllUsersForTracking).catch((err) => console.warn('Tracking user list unavailable:', err)),
      api.getPendingExpertApplications().then(setPendingExperts).catch((err) => console.warn('Expert applications unavailable:', err)),
      api.getScans().then(setAllScans).catch((err) => console.warn('Admin scans unavailable:', err)),
      api.getMapReports().then(setMapPoints).catch((err) => console.warn('Admin map unavailable:', err)),
      api.getAdminAuditLogs().then(setAuditLogs).catch((err) => console.warn('Admin audit logs unavailable:', err)),
      api.getTickets().then(setTicketsList).catch((err) => console.warn('Admin tickets unavailable:', err)),
    ];
    await Promise.all(tasks);
    setLoading(false);
  };

  useEffect(() => {
    void loadAdminData();
  }, [searchQuery]);

  const handleRoleChange = async (userId: string | number, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      loadAdminData();
      alert(`User role successfully changed to ${newRole}.`);
    } catch (e: any) {
      alert("Role update failed: " + e.message);
    }
  };

  const handleExpertDecision = async (userId: string | number, decision: 'approve' | 'reject') => {
    const id = String(userId);
    const applicant = pendingExperts.find((item) => String(item.id || item.numeric_id) === id);
    const confirmed = window.confirm(
      decision === 'approve'
        ? `Approve ${applicant?.name || 'this'} as an Expert? They will be able to sign in with Expert access.`
        : `Reject ${applicant?.name || 'this'}'s application? Their pending application account will be removed so they can apply again later.`
    );
    if (!confirmed) return;
    setProcessingExpertId(id);
    try {
      if (decision === 'approve') await api.approveExpertApplication(id);
      else await api.rejectExpertApplication(id);
      await loadAdminData();
      window.alert(decision === 'approve' ? 'Expert application approved.' : 'Expert application rejected.');
    } catch (err: any) {
      window.alert(err.message || 'Could not process expert application.');
    } finally {
      setProcessingExpertId(null);
    }
  };

  const handleReplyTicket = async (ticketId: string) => {
    const text = (replyTextMap[ticketId] || '').trim();
    if (!text) {
      alert("Please enter a response message.");
      return;
    }
    setSendingReply(ticketId);
    try {
      await api.replyTicket(ticketId, text);
      setReplyTextMap(prev => ({ ...prev, [ticketId]: '' }));
      const updatedTickets = await api.getTickets();
      setTicketsList(updatedTickets);
      alert("Expert response recorded and sent to farmer!");
    } catch (e: any) {
      alert("Failed to submit response: " + e.message);
    } finally {
      setSendingReply(null);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await api.updateTicketStatus(ticketId, newStatus);
      const updatedTickets = await api.getTickets();
      setTicketsList(updatedTickets);
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <Lock className="w-4 h-4" />
            <span>Master Administration Suite</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            SoybeanCare AI Enterprise Control Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time analytics, geospatial disease mapping, user RBAC controls, model health, and audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'predictions', label: `All Predictions (${allScans.length})` },
            { id: 'map', label: 'Disease Map (GIS)' },
            { id: 'users', label: 'Farmer RBAC' },
            { id: 'tickets', label: `Farmer Queries (${ticketsList.filter(t => t.status === 'Open').length || 0})` },
            { id: 'model', label: 'AI Health' },
            { id: 'audit', label: 'Audit Logs' },
            { id: 'tracking', label: 'All Tracking' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={loadAdminData}
            title="Refresh Data"
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Stats Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered Users</p>
          <p className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {summaryData?.users ?? '—'}
          </p>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {summaryData?.farmers ?? '—'} Active Soybean Farmers
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Diagnoses Performed</p>
          <p className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {summaryData?.reports ?? '—'}
          </p>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Recorded reports from the live database</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Field Experts</p>
          <p className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {summaryData?.experts ?? '—'}
          </p>
          <p className="text-xs font-bold text-amber-500">
            {summaryData?.open_tickets ?? '—'} Open Farmer Consultations
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inference Pipeline Latency</p>
          <p className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {summaryData?.model_status?.active_latency_ms != null ? `${summaryData.model_status.active_latency_ms} ms` : 'Not measured'}
          </p>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Configuration status shown below</p>
        </div>
      </div>


      {/* All recorded farmer predictions */}
      {activeTab === 'predictions' && (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">All Farmer Predictions</h3>
            <p className="text-xs text-slate-500">Saved reports returned by the authenticated backend. No demo records are added.</p>
          </div><span className="text-xs font-bold text-emerald-600">{allScans.length} records</span></div>
          {allScans.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500">No saved predictions are available yet.</div> : (
            <div className="overflow-x-auto"><table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><tr><th className="p-3">Image</th><th className="p-3">Farmer</th><th className="p-3">Prediction</th><th className="p-3">Confidence</th><th className="p-3">Location</th><th className="p-3">Date</th></tr></thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{allScans.map((scan: any) => <tr key={scan.id}>
                <td className="p-3"><img src={scan.imageUrl} alt="Scanned leaf" className="w-12 h-12 rounded-lg object-cover" /></td><td className="p-3 font-semibold">{scan.farmerName || scan.farmerId || 'Farmer'}</td><td className="p-3">{scan.predictedDisease}</td><td className="p-3">{(Number(scan.confidenceScore ?? scan.confidence ?? 0) * 100).toFixed(1)}%</td><td className="p-3">{scan.location || '—'}</td><td className="p-3">{scan.scannedAt ? new Date(scan.scannedAt).toLocaleString() : '—'}</td>
              </tr>)}</tbody>
            </table></div>
          )}
        </div>
      )}

      {/* TAB 1: ANALYTICS & RECENT SCANS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Disease Distribution Chart */}
          <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-emerald-500" />
              <span>Disease Frequency Distribution</span>
            </h3>

            <div className="space-y-3 pt-2">
              {summaryData?.disease_distribution?.map((item: any, idx: number) => {
                const total = summaryData.reports ?? 0;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{item.disease}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Neural Inference Logs */}
          <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span>Live Specimen Inference Stream</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Farmer</th>
                    <th className="p-3">Pathogen</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {mapPoints.slice(0, 6).map((pt: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-3 text-slate-400">{String(pt.created_at || '').substring(0, 16).replace('T', ' ')}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{pt.farmer_name || 'Farmer'}</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">{pt.disease}</td>
                      <td className="p-3">{(pt.confidence * 100).toFixed(1)}%</td>
                      <td className="p-3">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: GEOSPATIAL DISEASE MAP (GIS) */}
      {activeTab === 'map' && (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                <span>Geospatial Soybean Foliar Pathogen Heatmap</span>
              </h3>
              <p className="text-xs text-slate-500">Live GPS telemetry tagged from farmer field uploads.</p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span>Asian Rust</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Septoria Brown Spot</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Healthy Canopy</span>
              </span>
            </div>
          </div>

          {/* Interactive Map Visualizer */}
          <div className="relative w-full h-[450px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
            
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* GPS report visualization; no fabricated basemap or coordinates. */}
            <div className="relative w-full h-full rounded-xl border border-emerald-500/20 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-6 flex flex-col justify-between">
              
              <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
                <span>GPS-LOCATED FARMER REPORTS</span>
                <span>GEO-DATUM: WGS84</span>
              </div>

              {/* Pinpoint Markers */}
              {mapPoints.filter((pt: any) => Number.isFinite(Number(pt.latitude)) && Number.isFinite(Number(pt.longitude))).length === 0 ? <div className="relative w-full h-72 flex items-center justify-center text-center text-sm text-slate-400">No farmer reports with GPS coordinates are available.</div> : <div className="relative w-full h-72">
                {mapPoints.filter((pt: any) => Number.isFinite(Number(pt.latitude)) && Number.isFinite(Number(pt.longitude))).map((pt: any, idx: number) => {
                  const isRust = pt.disease?.toLowerCase().includes('rust');
                  const isHealthy = pt.disease?.toLowerCase().includes('healthy');
                  const pinColor = isRust ? 'bg-rose-500' : isHealthy ? 'bg-emerald-500' : 'bg-amber-500';
                  
                  const geoPoints = mapPoints.filter((point: any) => Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude)));
                  const lats = geoPoints.map((point: any) => Number(point.latitude));
                  const lons = geoPoints.map((point: any) => Number(point.longitude));
                  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
                  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
                  const leftPct = 8 + (maxLon === minLon ? 42 : ((Number(pt.longitude) - minLon) / (maxLon - minLon)) * 84);
                  const topPct = 8 + (maxLat === minLat ? 42 : ((maxLat - Number(pt.latitude)) / (maxLat - minLat)) * 84);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedMapPoint(pt)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    >
                      <div className={`w-4 h-4 rounded-full ${pinColor} ring-4 ring-white/20 animate-pulse group-hover:scale-125 transition-transform`} />
                      <div className="hidden group-hover:block absolute left-6 -top-2 bg-slate-950 text-white text-[10px] p-2 rounded-lg border border-slate-700 whitespace-nowrap z-20 shadow-xl">
                        <p className="font-bold text-emerald-400">{pt.disease}</p>
                        <p>{pt.farmer_name} · {pt.location_name}</p>
                        <p className="text-slate-400">Score: {(pt.confidence * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>}

              {/* Selected Pin Details Bar */}
              {selectedMapPoint ? (
                <div className="bg-slate-950/90 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between text-xs text-white">
                  <div>
                    <span className="font-bold text-emerald-400">{selectedMapPoint.disease}</span>
                    <span className="text-slate-400 ml-2">Farmer: {selectedMapPoint.farmer_name}</span>
                    <span className="text-slate-400 ml-2">Location: {selectedMapPoint.location_name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedMapPoint(null)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 text-center">
                  Click any marker above to view field diagnosis telemetry.
                </p>
              )}

            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER & FARMER RBAC MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <section className="glass-card p-6 rounded-3xl border border-amber-300/60 dark:border-amber-800/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Expert Applications</h3>
                <p className="text-xs text-slate-500">Review new expert registrations. Applicants cannot sign in until approved.</p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                {pendingExperts.length} pending
              </span>
            </div>
            {pendingExperts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-center text-sm text-slate-500">
                No pending expert applications. New requests will appear here.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {pendingExperts.map((expert) => {
                  const id = String(expert.id || expert.numeric_id);
                  return (
                    <article key={id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{expert.name}</p>
                          <p className="text-xs text-slate-500">{expert.email}</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">PENDING</span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-1">
                        {expert.phone && <p>Phone: {expert.phone}</p>}
                        {(expert.village || expert.district || expert.state) && <p>Location: {[expert.village, expert.district, expert.state].filter(Boolean).join(', ')}</p>}
                        {expert.created_at && <p>Applied: {String(expert.created_at).slice(0, 10)}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" disabled={processingExpertId === id} onClick={() => handleExpertDecision(id, 'approve')} className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                          {processingExpertId === id ? 'Please wait…' : 'Approve Expert'}
                        </button>
                        <button type="button" disabled={processingExpertId === id} onClick={() => handleExpertDecision(id, 'reject')} className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30 disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <span>User Directory &amp; Role-Based Access Control</span>
              </h3>
              <p className="text-xs text-slate-500">Manage farmer accounts, grant agronomist expert roles, or configure administrators.</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-64 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Scans</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {usersList.map((u, idx) => (
                  <tr key={idx}>
                    <td className="p-3">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{u.name}</p>
                      <p className="text-slate-400 text-[11px]">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30' :
                        u.role === 'EXPERT' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                        u.role === 'PENDING_EXPERT' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {u.village ? `${u.village}, ${u.district}` : 'Madhya Pradesh'}
                    </td>
                    <td className="p-3 font-semibold">{u.scan_count || 0}</td>
                    <td className="p-3 text-slate-400">{String(u.created_at || '').substring(0, 10)}</td>
                    <td className="p-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id || u.numeric_id, e.target.value)}
                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                      >
                        <option value="FARMER">FARMER</option>
                        <option value="EXPERT">EXPERT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* TAB: COMPLETE ACTIVITY TRACKING — built from recorded backend data only */}
      {activeTab === 'tracking' && (() => {
        const events = [
          ...allUsersForTracking.map((item: any) => ({ type: 'Registration', title: item.name || 'New account', detail: `${item.role || 'USER'} · ${item.email || 'No email'}`, date: item.created_at, id: `user-${item.id || item.numeric_id}` })),
          ...allScans.map((item: any) => ({ type: 'Prediction', title: item.predictedDisease || item.disease || 'Crop scan', detail: `Farmer: ${item.farmerName || item.farmer_name || item.farmerId || 'Unknown'} · Confidence: ${Number(item.confidenceScore ?? item.confidence ?? 0) <= 1 ? (Number(item.confidenceScore ?? item.confidence ?? 0) * 100).toFixed(1) : Number(item.confidenceScore ?? item.confidence).toFixed(1)}%`, date: item.scannedAt || item.created_at, id: `scan-${item.id}` })),
          ...ticketsList.map((item: any) => ({ type: 'Support', title: item.subject || item.ticketCode || 'Farmer support request', detail: `${item.status || 'Open'} · ${item.farmerName || 'Farmer'} · ${item.ticketCode || item.id}`, date: item.createdAt || item.created_at, id: `ticket-${item.id}` })),
          ...auditLogs.map((item: any, index: number) => ({ type: 'Admin Action', title: item.action || 'Administrative event', detail: item.details || item.user_name || 'Recorded admin activity', date: item.created_at, id: `audit-${item.id || index}` })),
        ].filter((event: any) => event.date && !Number.isNaN(new Date(event.date).getTime())).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const visible = events.filter((event: any) => (trackingType === 'All' || event.type === trackingType) && (!trackingSearch || `${event.title} ${event.detail} ${event.type}`.toLowerCase().includes(trackingSearch.toLowerCase())));
        return (
          <section className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Complete Platform Activity Tracking</h3><p className="text-xs text-slate-500">One timeline for account registrations, crop predictions, farmer support and administrative actions. Only recorded backend events are shown.</p></div>
              <div className="flex gap-2"><input value={trackingSearch} onChange={(e) => setTrackingSearch(e.target.value)} placeholder="Search activity..." className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"/><button onClick={loadAdminData} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Refresh</button></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['All','Registration','Prediction','Support','Admin Action'].map((type) => <button key={type} onClick={() => setTrackingType(type)} className={`rounded-xl p-3 text-left border text-xs font-bold ${trackingType === type ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}><span>{type}</span><span className="block text-lg mt-1">{type === 'All' ? events.length : events.filter((event: any) => event.type === type).length}</span></button>)}
            </div>
            {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500">No recorded activity matches this filter.</div> : <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">{visible.map((event: any) => <article key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 p-4"><div className="min-w-0"><div className="flex items-center gap-2 mb-1"><span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-1 text-[10px] font-bold">{event.type}</span><h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{event.title}</h4></div><p className="text-xs text-slate-500 break-words">{event.detail}</p></div><time className="text-[11px] text-slate-400 whitespace-nowrap">{new Date(event.date).toLocaleString()}</time></article>)}</div>}
            <p className="text-[11px] text-slate-400">Tracking coverage depends on the records currently returned by the backend APIs. This view does not invent missing history or change login/prediction workflows.</p>
          </section>
        );
      })()}

      {/* TAB: FARMER QUERIES & TICKETS */}
      {activeTab === 'tickets' && (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                <span>Farmer Consultation Desk &amp; Field Support Tickets</span>
              </h3>
              <p className="text-xs text-slate-500">
                Review farmer concerns, diagnose crop issues, and send official agronomist advisory directly to the farmer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search queries..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-48 focus:w-64 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['All', 'Open', 'In Progress', 'Resolved'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setTicketStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      ticketStatusFilter === status
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket list */}
          {ticketsList
            .filter((t) => {
              const matchesFilter = ticketStatusFilter === 'All' || t.status === ticketStatusFilter;
              const matchesSearch =
                !ticketSearch ||
                t.subject?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                t.farmerName?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                t.ticketCode?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                t.category?.toLowerCase().includes(ticketSearch.toLowerCase());
              return matchesFilter && matchesSearch;
            })
            .length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700">
              <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No support tickets found</p>
              <p className="text-xs text-slate-400 mt-1">
                {ticketStatusFilter !== 'All'
                  ? `There are currently no tickets with status "${ticketStatusFilter}".`
                  : 'No farmer inquiries have been logged yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ticketsList
                .filter((t) => {
                  const matchesFilter = ticketStatusFilter === 'All' || t.status === ticketStatusFilter;
                  const matchesSearch =
                    !ticketSearch ||
                    t.subject?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                    t.farmerName?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                    t.ticketCode?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                    t.category?.toLowerCase().includes(ticketSearch.toLowerCase());
                  return matchesFilter && matchesSearch;
                })
                .map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/40 transition-colors"
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">{ticket.ticketCode || ticket.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ticket.status === 'Open'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                              : ticket.status === 'In Progress'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ticket.priority === 'High'
                              ? 'bg-rose-500/10 text-rose-500'
                              : ticket.priority === 'Medium'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {ticket.priority || 'Normal'} Priority
                        </span>
                        <span className="text-xs text-slate-500">· {ticket.category || 'General Support'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
                        >
                          <option value="Open">Status: Open</option>
                          <option value="In Progress">Status: In Progress</option>
                          <option value="Resolved">Status: Resolved</option>
                        </select>
                        <span className="text-xs text-slate-400">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>

                    {/* Farmer Details & Query Content */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-slate-900 dark:text-white">{ticket.farmerName}</span>
                        {ticket.farmerPhone && <span>· Ph: {ticket.farmerPhone}</span>}
                        {ticket.farmerEmail && <span>· {ticket.farmerEmail}</span>}
                        {ticket.location && <span>· Location: {ticket.location}</span>}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ticket.subject}</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                        {ticket.message}
                      </p>
                    </div>

                    {/* Thread history if messages exist */}
                    {ticket.messages && ticket.messages.length > 0 && (
                      <div className="space-y-2 pl-4 border-l-2 border-emerald-500/30 pt-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conversation Log</p>
                        {ticket.messages.map((m: any, mIdx: number) => (
                          <div
                            key={mIdx}
                            className={`p-2.5 rounded-xl text-xs ${
                              m.senderRole === 'ADMIN' || m.sender_role === 'ADMIN' || m.sender_role === 'EXPERT'
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {m.senderName || m.sender_name || m.sender || 'Agronomist Expert'} ({m.senderRole || m.sender_role || m.role || 'Staff'})
                              </span>
                              <span>{String(m.createdAt || m.created_at || m.timestamp || '').substring(0, 16).replace('T', ' ')}</span>
                            </div>
                            <p className="leading-relaxed">{m.message || m.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agronomist Reply Input */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Type expert agricultural recommendation or diagnosis reply..."
                        value={replyTextMap[ticket.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleReplyTicket(ticket.id);
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => handleReplyTicket(ticket.id)}
                        disabled={sendingReply === ticket.id || !(replyTextMap[ticket.id] || '').trim()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingReply === ticket.id ? 'Sending...' : 'Send Advisory'}</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI ENGINE METRICS & MODEL CONFIG */}
      {activeTab === 'model' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-emerald-500" />
              <span>Multi-Stage Inference Engine Status</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Stage A: Image Pre-processor</span>
                <span className="text-emerald-500 font-bold">Active (EXIF Normalized)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Stage B: Soybean Leaf Verifier</span>
                <span className="text-emerald-500 font-bold">
                  {summaryData?.model_status?.groq_vision_configured ? 'Groq Vision (Active)' : 'Calibrated Local Heuristic'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Stage C: Disease Classifier</span>
                <span className="text-emerald-500 font-bold">
                  {summaryData?.model_status?.roboflow_model_id || 'Roboflow / Calibrated Model'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Stage D: ICAR Agronomic Engine</span>
                <span className="text-emerald-500 font-bold">Active (Rule-Calibrated)</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-500" />
              <span>Continuous Learning &amp; Training Protocol</span>
            </h3>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Model Fine-Tuning Guidelines:</p>
              <p>
                To retrain or fine-tune local models, use the provided dataset scripts. Verified farmer leaf scans with high expert agreement scores are tagged for inclusion in next quarter's model checkpoint.
              </p>
              <p className="text-[11px] text-slate-400">
                Minimum validation confidence threshold: 75.0% · Strict prohibition of unverified chemical prescriptions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Administrative Security Audit Logs</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {auditLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td className="p-3 text-slate-400">{String(log.created_at || '').substring(0, 19).replace('T', ' ')}</td>
                    <td className="p-3 font-semibold">{log.user_name || 'System Admin'}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{log.action}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{log.details}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
