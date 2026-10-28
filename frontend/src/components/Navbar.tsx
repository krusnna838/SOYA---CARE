import React, { useState } from 'react';
import { Sprout, ShieldCheck, Sun, Moon, Globe, Mic, Bell, User, LogOut, Camera, Sparkles, PhoneCall } from 'lucide-react';
import { User as UserType, LanguageCode } from '../types';

interface NavbarProps {
  user: UserType | null;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenPermissions: () => void;
  onOpenVoiceAssistant: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  setCurrentTab,
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  onOpenAuth,
  onLogout,
  onOpenPermissions,
  onOpenVoiceAssistant,
  onOpenProfile
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'scan', label: 'AI Diagnosis', icon: Sparkles },
    { id: 'diseases', label: 'Disease DB' },
    { id: 'community', label: 'Community' },
    { id: 'support', label: 'Help Center' }
  ];

  if (user?.role === 'FARMER') {
    navLinks.splice(3, 0, { id: 'farmer-dashboard', label: 'My Dashboard' });
  } else if (user?.role === 'EXPERT') {
    navLinks.splice(3, 0, { id: 'expert-dashboard', label: 'Expert Workbench' });
  } else if (user?.role === 'ADMIN') {
    navLinks.splice(3, 0, { id: 'expert-dashboard', label: 'Expert Workbench' });
    navLinks.splice(3, 0, { id: 'admin-dashboard', label: 'Admin Portal' });
  }

  const langNames: Record<LanguageCode, string> = {
    en: 'English (US)',
    hi: 'हिन्दी (Hindi)',
    es: 'Español (Spanish)',
    sw: 'Kiswahili'
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-emerald-500/20 dark:border-emerald-500/10 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sprout className="w-7 h-7 text-emerald-400 animate-pulse-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-heading font-extrabold text-2xl tracking-tight text-emerald-600 dark:text-emerald-400">
                  SoybeanCare
                </span>
                <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                  Agri Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Farmer Advisory & Diagnostic Platform</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/70 dark:bg-slate-900/70 p-1.5 rounded-full border border-slate-200 dark:border-slate-800">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setCurrentTab(link.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Controls & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Voice Assistant Button */}
            <button
              onClick={onOpenVoiceAssistant}
              title="SoySmart Voice Assistant"
              className="p-2.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors relative group"
            >
              <Mic className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            </button>

            {/* Permissions Button */}
            <button
              onClick={onOpenPermissions}
              title="System Permissions"
              className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Theme"
              className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span className="uppercase">{language}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-card shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  {(['en', 'hi', 'es', 'sw'] as LanguageCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between hover:bg-emerald-500/10 ${
                        language === code ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{langNames[code]}</span>
                      {language === code && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Account / Auth Actions */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-full border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 transition-all"
                >
                  <img
                    src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-500"
                  />
                  <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200 pr-2">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        {user.role}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center space-x-2"
                    >
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Profile & Farm Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setCurrentTab(user.role === 'ADMIN' ? 'admin-dashboard' : user.role === 'EXPERT' ? 'expert-dashboard' : 'farmer-dashboard');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center space-x-2 mt-1"
                    >
                      <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                      <span>My Workspace</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center space-x-2 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 hover:opacity-95 transition-all flex items-center space-x-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Portal Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
