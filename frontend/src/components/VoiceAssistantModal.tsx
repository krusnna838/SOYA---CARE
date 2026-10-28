import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, Sprout, Bot } from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [botResponse, setBotResponse] = useState('Hello! I am your SoySmart Voice Assistant. Say "Analyze leaf photo", "Weather forecast", or "Open Disease Database".');

  useEffect(() => {
    if (isOpen) {
      setListening(true);
      const timer = setTimeout(() => {
        setListening(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVoiceCommand = (commandText: string) => {
    setTranscript(commandText);
    setListening(false);

    const lower = commandText.toLowerCase();
    if (lower.includes('scan') || lower.includes('analyze') || lower.includes('leaf') || lower.includes('photo')) {
      setBotResponse('Navigating to AI Diagnosis page to upload or capture soybean leaf image...');
      setTimeout(() => {
        onNavigateTab('scan');
        onClose();
      }, 1500);
    } else if (lower.includes('weather') || lower.includes('rain') || lower.includes('spray')) {
      setBotResponse('Today\'s forecast in Indore Agri Zone: 28.4°C, 74% humidity. Favorable for morning spraying before 11:00 AM.');
    } else if (lower.includes('disease') || lower.includes('database') || lower.includes('rust')) {
      setBotResponse('Opening SoySmart Disease Database catalog...');
      setTimeout(() => {
        onNavigateTab('diseases');
        onClose();
      }, 1500);
    } else {
      setBotResponse(`I heard "${commandText}". You can ask me to scan a leaf, check spray weather, or browse diseases.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-in fade-in">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 text-center relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Bot Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold mb-6">
          <Bot className="w-4 h-4 animate-bounce" />
          <span>SoySmart AI Voice Engine 2.0</span>
        </div>

        {/* Microphone Animated Waveform */}
        <div className="relative my-8 flex items-center justify-center">
          {listening && (
            <div className="absolute w-32 h-32 rounded-full border-2 border-emerald-500/40 animate-ping" />
          )}
          <button
            onClick={() => {
              setListening(!listening);
              if (!listening) {
                setTranscript('');
                setBotResponse('Listening for field voice input...');
              }
            }}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              listening
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/50 scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {listening ? <Mic className="w-10 h-10 animate-pulse" /> : <MicOff className="w-10 h-10" />}
          </button>
        </div>

        {/* State Label */}
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">
          {listening ? 'Listening... Speak Now' : 'Tap Microphone to Speak'}
        </p>

        {/* Transcript & Bot Response Output */}
        {transcript && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 mb-3 italic">
            "{transcript}"
          </div>
        )}

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium leading-relaxed flex items-start space-x-2 text-left">
          <Volume2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{botResponse}</span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => handleVoiceCommand("Analyze leaf photo for Septoria Brown Spot")}
            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 text-xs transition-colors border border-slate-200 dark:border-slate-700"
          >
            "Analyze leaf photo"
          </button>
          <button
            onClick={() => handleVoiceCommand("Check spray weather forecast")}
            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 text-xs transition-colors border border-slate-200 dark:border-slate-700"
          >
            "Check spray weather"
          </button>
          <button
            onClick={() => handleVoiceCommand("Open Disease Database catalog")}
            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 text-xs transition-colors border border-slate-200 dark:border-slate-700"
          >
            "Browse Diseases"
          </button>
        </div>

      </div>
    </div>
  );
};
