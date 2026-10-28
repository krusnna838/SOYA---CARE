import React from 'react';
import { Sprout, PhoneCall, Mail, MapPin, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigateTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 transition-colors pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <span className="font-heading font-extrabold text-2xl text-white tracking-tight">
                SoySmart <span className="text-emerald-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Commercial AI phytopathology platform giving soybean farmers real-time disease classification, organic remedies, and agronomic support.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>ISO 27001 & Privacy Compliant</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-heading">
              Platform Solutions
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigateTab('scan')} className="hover:text-emerald-400 transition-colors">
                  AI Disease Diagnosis
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateTab('diseases')} className="hover:text-emerald-400 transition-colors">
                  Soybean Disease Catalog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateTab('community')} className="hover:text-emerald-400 transition-colors">
                  Farmer Community & Forums
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateTab('support')} className="hover:text-emerald-400 transition-colors">
                  Customer Care & Live Chat
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Govt Initiatives & Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-heading">
              Agri Resources & Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center space-x-1.5 hover:text-emerald-400 cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>ICAR - Indian Institute of Soybean Research</span>
              </li>
              <li className="flex items-center space-x-1.5 hover:text-emerald-400 cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>PM Fasal Bima Yojana Portal</span>
              </li>
              <li className="flex items-center space-x-1.5 hover:text-emerald-400 cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>Kisan Call Center Hotline (1800-180-1551)</span>
              </li>
              <li className="flex items-center space-x-1.5 hover:text-emerald-400 cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>National Crop Insurance Portal</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Emergency Hotline & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-heading">
              24×7 Farmer Support Hotline
            </h4>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>Toll-Free: +1 800 555 SOYAI</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>support@soysmart.ai</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>AgriTech Campus, Sector 9, MP</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 SoySmart AI Corporation. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Security Compliance</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
