import React, { useState, useEffect } from 'react';
import type { User, Disease, DiseaseScan, SupportTicket, WeatherData, GovtScheme, LanguageCode } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PermissionModal } from './components/PermissionModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { PDFReportModal } from './components/PDFReportModal';
import { ProfileModal } from './components/ProfileModal';

import { LandingPage } from './pages/LandingPage';
import { AuthModal } from './pages/AuthModal';
import { ScanPage } from './pages/ScanPage';
import { DiseaseDatabasePage } from './pages/DiseaseDatabasePage';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { ExpertDashboard } from './pages/ExpertDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CustomerCarePage } from './pages/CustomerCarePage';
import { CommunityPage } from './pages/CommunityPage';
import { Lock, ShieldCheck, ShieldAlert, Sprout } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pdfScan, setPdfScan] = useState<DiseaseScan | null>(null);

  // Data Store State
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [scans, setScans] = useState<DiseaseScan[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [schemes, setSchemes] = useState<GovtScheme[]>([]);

  // Dark Mode Class Handler
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial Data & Active Session Fetching
  useEffect(() => {
    async function loadInitialData() {
      // 1. Session Restoration
      try {
        const activeUser = await api.getMe();
        if (activeUser) {
          setUser(activeUser);
        }
      } catch (e) {
        console.warn('Session check:', e);
      }

      // 2. Load Diseases
      const d = await api.getDiseases();
      setDiseases(d);

      // 3. Load Scans
      try {
        const s = await api.getScans();
        const normalizedScans = s.map(item => ({
          ...item,
          diseaseDetails: item.diseaseDetails || d.find(dis => dis.name.toLowerCase() === item.predictedDisease.toLowerCase()) || d[0]
        }));
        setScans(normalizedScans);
      } catch (e) {
        console.warn('Could not load scans:', e);
      }

      // 4. Load Weather
      const w = await api.getWeather();
      setWeather(w);

      // 5. Load Schemes
      const sch = await api.getSchemes();
      setSchemes(sch);

      // 6. Load Tickets
      const t = await api.getTickets();
      setTickets(t);
    }
    loadInitialData();
  }, []);

  // Refresh tickets dynamically on navigating to support or admin tab
  useEffect(() => {
    if (currentTab === 'support' || currentTab === 'admin-dashboard') {
      api.getTickets().then(setTickets).catch(console.warn);
    }
  }, [currentTab]);

  const handleOpenPdfReport = (scan: DiseaseScan) => {
    setPdfScan(scan);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentTab('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenPermissions={() => setPermissionModalOpen(true)}
        onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Content Router View */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <LandingPage
            onNavigateTab={setCurrentTab}
            onOpenAuth={() => setAuthModalOpen(true)}
            diseases={diseases}
          />
        )}

        {currentTab === 'scan' && (
          <ScanPage
            user={user}
            onOpenReportModal={handleOpenPdfReport}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'diseases' && (
          <DiseaseDatabasePage
            diseases={diseases}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'farmer-dashboard' && (
          user ? (
            <FarmerDashboard
              user={user}
              scans={scans}
              weather={weather}
              schemes={schemes}
              onOpenReportModal={handleOpenPdfReport}
              onNavigateTab={setCurrentTab}
              onOpenProfile={() => setProfileModalOpen(true)}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <Sprout className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold">Farmer Login Required</h2>
              <p className="text-xs text-slate-400">Please sign in to view your personalized soybean field scans and farm history.</p>
              <button onClick={() => setAuthModalOpen(true)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700">
                Sign In / Register
              </button>
            </div>
          )
        )}

        {currentTab === 'expert-dashboard' && (
          user ? (
            <ExpertDashboard
              user={user}
              scans={scans}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold">Agronomist Expert Login Required</h2>
              <p className="text-xs text-slate-400">Sign in with verified agricultural specialist credentials to access the verification workbench.</p>
              <button onClick={() => setAuthModalOpen(true)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700">
                Sign In as Expert
              </button>
            </div>
          )
        )}

        {currentTab === 'admin-dashboard' && (
          user ? (
            user.role === 'ADMIN' ? (
              <AdminDashboard
                user={user}
                tickets={tickets}
              />
            ) : (
              <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
                <h2 className="text-xl font-bold">Administrator Access Required</h2>
                <p className="text-xs text-slate-400">Your account ({user.email}) currently has role <strong>{user.role}</strong>. Master administrator permissions are required.</p>
                <div className="flex justify-center gap-3 pt-2">
                  <button onClick={() => setCurrentTab('farmer-dashboard')} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold">
                    Go to Farmer Dashboard
                  </button>
                  <button onClick={() => setAuthModalOpen(true)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">
                    Switch Account
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <Lock className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold">Administrator Sign-In Required</h2>
              <p className="text-xs text-slate-400">Please authenticate with administrative credentials to access enterprise telemetry.</p>
              <button onClick={() => setAuthModalOpen(true)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700">
                Admin Sign In
              </button>
            </div>
          )
        )}

        {currentTab === 'support' && (
          <CustomerCarePage
            user={user}
            tickets={tickets}
            onTicketCreated={(t) => setTickets([t, ...tickets])}
          />
        )}

        {currentTab === 'community' && (
          <CommunityPage
            user={user}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigateTab={setCurrentTab} />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          if (loggedInUser.role === 'ADMIN') setCurrentTab('admin-dashboard');
          else if (loggedInUser.role === 'EXPERT') setCurrentTab('expert-dashboard');
          else setCurrentTab('farmer-dashboard');
        }}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        user={user}
        onClose={() => setProfileModalOpen(false)}
        onProfileUpdated={(updated) => setUser(updated)}
      />

      <PermissionModal
        isOpen={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
      />

      <VoiceAssistantModal
        isOpen={voiceAssistantOpen}
        onClose={() => setVoiceAssistantOpen(false)}
        onNavigateTab={setCurrentTab}
      />

      <PDFReportModal
        scan={pdfScan}
        isOpen={!!pdfScan}
        onClose={() => setPdfScan(null)}
      />

    </div>
  );
}
export default App;
