import React, { useState } from 'react';
import { SupportTicket, User } from '../types';
import { PhoneCall, Mail, MessageSquare, Plus, Send, HelpCircle, CheckCircle2, Bot, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface CustomerCarePageProps {
  user: User | null;
  tickets: SupportTicket[];
  onTicketCreated: (ticket: SupportTicket) => void;
}

export const CustomerCarePage: React.FC<CustomerCarePageProps> = ({ user, tickets, onTicketCreated }) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Disease Consultation');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [message, setMessage] = useState('');
  const [farmerName, setFarmerName] = useState(user?.name || '');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [farmerLocation, setFarmerLocation] = useState(user?.state ? `${user.village ? user.village + ', ' : ''}${user.state}` : '');
  const [creating, setCreating] = useState(false);

  const [chatLog, setChatLog] = useState([
    { sender: 'SoySmart AI Support Bot', text: 'Hello! How can I assist you with your soybean crop today?', time: '10:00 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    
    const sender = user?.name || farmerName.trim() || 'Soybean Farmer';
    setCreating(true);

    try {
      const newTicket = await api.createTicket({
        subject,
        category,
        priority,
        message,
        farmerName: sender,
        farmerPhone: farmerPhone || undefined,
        farmerEmail: user?.email || undefined,
        location: farmerLocation || undefined
      });

      onTicketCreated(newTicket);
      setSubject('');
      setMessage('');
      alert('Support query submitted successfully! Your Ticket ID is ' + (newTicket.ticketCode || newTicket.id) + '. Our agronomist team will review and reply.');
    } catch (err: any) {
      alert('Failed to submit ticket: ' + (err.message || 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  const handleSendLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatLog(prev => [...prev, { sender: 'You', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatInput('');

    setTimeout(() => {
      let botReply = "Thank you for reaching out! Our agricultural advisory team has logged this request.";
      const lower = userMsg.toLowerCase();
      if (lower.includes('spray') || lower.includes('rain')) {
        botReply = "Rainfastness rule: Do not spray fungicide if rainfall is expected within 3-4 hours. Ensure morning dew has dried before applying systemic fungicides.";
      } else if (lower.includes('rust') || lower.includes('pustule')) {
        botReply = "Asian Soybean Rust can defoliate crops rapidly under 80%+ humidity. Submit a leaf photo in the Leaf Scanner for instant verification and ICAR recommended triazole fungicides.";
      } else if (lower.includes('dose') || lower.includes('fertilizer') || lower.includes('npk')) {
        botReply = "Soybeans fix their own atmospheric nitrogen through rhizobium nodules. A standard starter dose of 20:60:40 kg/ha N:P:K is typically recommended per ICAR guidelines.";
      }
      setChatLog(prev => [...prev, { sender: 'SoySmart AI Support Bot', text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
          <PhoneCall className="w-4 h-4" />
          <span>Agricultural Extension &amp; Field Helpdesk</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
          Farmer Assistance &amp; Query Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Submit field issues directly to certified agronomists, track expert responses, or consult our 24/7 crop advisory bot.
        </p>
      </div>

      {/* Grid: Live Chat & Raise Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: AI Live Chat Assistant */}
        <div className="lg:col-span-5 glass-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Instant Advisory Assistant</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">ICAR-Aligned Rule Engine Active</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 h-80 overflow-y-auto space-y-3 text-xs">
            {chatLog.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-2xl max-w-[88%] ${
                  msg.sender === 'You' 
                    ? 'bg-emerald-600 text-white ml-auto' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
                }`}
              >
                <p className="text-[10px] font-bold opacity-75 mb-0.5">{msg.sender} • {msg.time}</p>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendLiveChat} className="flex space-x-2">
            <input
              type="text"
              placeholder="Ask about spraying timing, pesticide dosage, rust..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button 
              type="submit" 
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right: Raise Support Ticket Form */}
        <div className="lg:col-span-7 glass-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Raise Official Agronomist Consultation</h3>
              <p className="text-[11px] text-slate-400">Escalate severe crop issues to the SoybeanCare agricultural expert panel.</p>
            </div>
          </div>

          <form onSubmit={handleRaiseTicket} className="space-y-3.5 text-xs">
            {/* Farmer contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Farmer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={user?.name || farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  disabled={Boolean(user?.name)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-75"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Phone / WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={farmerPhone}
                  onChange={(e) => setFarmerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                >
                  <option>Disease Consultation</option>
                  <option>Pesticide Recommendation</option>
                  <option>Nutrient Deficiency</option>
                  <option>Soil / Seed Quality</option>
                  <option>App / Camera Issue</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Urgency</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Farm Location</label>
                <input
                  type="text"
                  placeholder="Village, District, State"
                  value={farmerLocation}
                  onChange={(e) => setFarmerLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Subject / Issue Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Yellow lesions spreading rapidly on 5 acres after rainfall"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Detailed Symptoms &amp; Crop State *</label>
              <textarea
                rows={3}
                required
                placeholder="Describe leaf symptoms, growth stage (e.g. R3 pod development), pesticide history, and current weather..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {creating ? 'Submitting Consultation Ticket...' : 'Submit Consultation to Agronomists'}
            </button>
          </form>
        </div>

      </div>

      {/* SECTION: MY SUBMITTED QUERIES & EXPERT REPLIES */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              <span>My Consultation Inquiries &amp; Expert Advice</span>
            </h3>
            <p className="text-xs text-slate-500">
              Check real-time advisory responses and resolution status from the agronomist team.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {tickets.length} Active {tickets.length === 1 ? 'Inquiry' : 'Inquiries'}
          </span>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto opacity-40" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No Consultation Inquiries Raised Yet</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              If your soybean crop shows unusual symptoms or fungal spots, fill the form above to receive tailored ICAR advice.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div 
                key={t.id} 
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{t.ticketCode || t.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'Open'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                        : t.status === 'In Progress'
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                    }`}>
                      Status: {t.status}
                    </span>
                    <span className="text-xs text-slate-500">· {t.category}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t.subject}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                    {t.message}
                  </p>
                </div>

                {/* Replies Thread */}
                {t.messages && t.messages.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Agronomist Expert Advice &amp; Response ({t.messages.length}):
                    </p>
                    {t.messages.map((m: any, idx: number) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-100 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                          <span>{m.senderName || m.sender_name || 'SoybeanCare Expert Agronomist'}</span>
                          <span>{String(m.createdAt || m.created_at || '').substring(0, 16).replace('T', ' ')}</span>
                        </div>
                        <p className="leading-relaxed">{m.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-[11px] text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Your query has been queued for review by an agronomist expert. Responses will appear here.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
