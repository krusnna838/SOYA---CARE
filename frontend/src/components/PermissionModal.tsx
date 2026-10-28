import React, { useState } from 'react';
import { Camera, Image, Wifi, Bell, MapPin, Mic, Fingerprint, ShieldAlert, Check, X, HardDrive } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose }) => {
  const [permissions, setPermissions] = useState({
    camera: true,
    storage: true,
    gallery: true,
    internet: true,
    notifications: false,
    location: true,
    microphone: true,
    biometrics: false,
  });

  if (!isOpen) return null;

  const toggle = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const permItems = [
    {
      key: 'camera' as const,
      icon: Camera,
      title: 'Camera Access',
      description: 'Used to capture live photos of infected soybean leaves in the field for real-time AI scanning.'
    },
    {
      key: 'storage' as const,
      icon: HardDrive,
      title: 'Storage & Disk Permission',
      description: 'Allows caching offline disease models and saving downloadable PDF diagnostic reports locally.'
    },
    {
      key: 'gallery' as const,
      icon: Image,
      title: 'Photo Gallery Access',
      description: 'Enables selecting pre-captured leaf photos directly from your device photo library.'
    },
    {
      key: 'internet' as const,
      icon: Wifi,
      title: 'High-Speed Cloud Sync',
      description: 'Required to query deep neural network models, sync weather data, and transmit expert reviews.'
    },
    {
      key: 'notifications' as const,
      icon: Bell,
      title: 'Push & Disease Alerts',
      description: 'Notifies you when an agricultural expert approves your diagnosis or when rust spore flights near your area.'
    },
    {
      key: 'location' as const,
      icon: MapPin,
      title: 'Geographic Agri-Location',
      description: 'Used to provide localized weather advisories, micro-climate humidity, and locate nearest agri-centers.'
    },
    {
      key: 'microphone' as const,
      icon: Mic,
      title: 'Voice Assistant & Voice Notes',
      description: 'Powers hands-free voice commands in the field for farmers wearing gloves or holding equipment.'
    },
    {
      key: 'biometrics' as const,
      icon: Fingerprint,
      title: 'Biometric / Fingerprint Login',
      description: 'Provides quick, secure one-touch authentication for mobile and tablet devices.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">
                Application Permissions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                SoySmart AI requires specific permissions to ensure field accuracy and real-time advisory.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permissions Grid */}
        <div className="mt-6 space-y-4">
          {permItems.map((item) => {
            const Icon = item.icon;
            const isGranted = permissions[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggle(item.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between space-x-4 ${
                  isGranted
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${
                    isGranted ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <span>{item.title}</span>
                      {isGranted && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-extrabold">
                          GRANTED
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
                
                {/* Switch Toggle */}
                <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                  isGranted ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}>
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Permissions are stored locally and encrypted according to ISO 27001 standards.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:opacity-95 transition-all"
          >
            Save & Continue
          </button>
        </div>

      </div>
    </div>
  );
};
