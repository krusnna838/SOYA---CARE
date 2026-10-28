import React, { useState } from 'react';
import { Camera, ShieldCheck, ArrowRight, Sprout, CheckCircle2, ChevronDown, ChevronUp, FileText, Leaf, Award, AlertTriangle, Layers } from 'lucide-react';
import { Disease } from '../types';

interface LandingPageProps {
  onNavigateTab: (tab: string) => void;
  onOpenAuth: () => void;
  diseases: Disease[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateTab, onOpenAuth, diseases }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const workflowSteps = [
    {
      step: '01',
      title: 'Photograph Leaf Sample',
      description: 'Capture a clear, well-lit photo of the affected soybean leaf in your field using your phone or upload an existing image.',
      image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80'
    },
    {
      step: '02',
      title: 'Multi-Stage Verification',
      description: 'Our verification engine verifies leaf morphology, rejects non-soybean objects, and evaluates pathogen lesion characteristics.',
      image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80'
    },
    {
      step: '03',
      title: 'ICAR Management Plan',
      description: 'Receive immediate chemical dosages per acre, organic botanical alternatives, and download an official PDF diagnostic report.',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const coreDiseases = [
    {
      name: 'Septoria Brown Spot',
      pathogen: 'Septoria glycines',
      severity: 'Moderate',
      symptoms: 'Small, angular reddish-brown specks on unifoliate and trifoliate leaves leading to premature leaf shedding.',
      image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Asian Soybean Rust',
      pathogen: 'Phakopsora pachyrhizi',
      severity: 'Critical',
      symptoms: 'Polygonal chlorotic lesions with raised pustules on the lower leaf surface, causing rapid canopy defoliation.',
      image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Frogeye Leaf Spot',
      pathogen: 'Cercospora sojina',
      severity: 'High',
      symptoms: 'Circular grey lesions with narrow reddish-brown borders appearing on upper trifoliate canopy.',
      image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Bacterial Blight',
      pathogen: 'Pseudomonas savastanoi',
      severity: 'Moderate',
      symptoms: 'Water-soaked translucent angular lesions with yellow chlorotic halos, tearing leaves under heavy wind.',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const faqs = [
    {
      q: 'How does the soybean leaf verification work before diagnosis?',
      a: 'The system uses a strict 4-stage pipeline. Before classifying any disease, it checks the image file structure and analyzes visible leaf morphology (such as trifoliolate arrangement and venation). If an image contains human faces, animals, vehicles, buildings, or unrelated plants, it is flagged as NOT_SOYBEAN_LEAF rather than fabricating a false diagnosis.'
    },
    {
      q: 'Can I use this directly from my smartphone camera in the field?',
      a: 'Yes. The platform supports live camera capture directly from mobile browsers with rear-camera lens switching, GPS location tagging for regional surveillance, and works smoothly on 4G and rural mobile connections.'
    },
    {
      q: 'Are the treatment recommendations aligned with ICAR guidelines?',
      a: 'Yes. Treatment plans follow ICAR-IISR (Indian Institute of Soybean Research, Indore) guidelines, offering dual strategies: calibrated chemical fungicide dosages (e.g. Pyraclostrobin, Tebuconazole) alongside certified organic bio-controls (such as Trichoderma viride and Bacillus subtilis).'
    },
    {
      q: 'Can I download and share diagnostic reports with local agriculture officers?',
      a: 'Every valid scan generates a downloadable A4 PDF report with high-resolution leaf thumbnails, diagnostic scores, possible causes, spray timings, and agronomic disclaimers suitable for consultation with agricultural extension workers.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section with High-Res Farmer & Soybean Field Photography */}
      <section className="relative min-h-[560px] flex items-center justify-center overflow-hidden border-b border-emerald-950/20">
        
        {/* Real Agricultural Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1920&q=80')` }}
        />
        
        {/* Deep Forest Green Gradient Mask for Clean Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/85 to-slate-950/90" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 text-center space-y-6">
          
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>ICAR-IISR Crop Protection Guidelines & Computer Vision</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-white leading-tight">
            Protect Your Soybean Yield With <span className="text-emerald-400">Reliable Field Diagnosis</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Photograph suspicious leaf lesions directly in the field. Receive immediate pathogen classification, dual chemical and organic treatment protocols, and downloadable PDF reports.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigateTab('scan')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Start Field Leaf Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('diseases')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-sm transition-all flex items-center justify-center space-x-2"
            >
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>Explore Disease Catalog</span>
            </button>
          </div>

          {/* Verification Assurance Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multi-Stage Leaf Verification</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ICAR Treatment Protocols</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>A4 Downloadable PDF Reports</span>
            </span>
          </div>

        </div>
      </section>

      {/* 3-Step Field Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Standard Operating Procedure</p>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            How Field Diagnosis Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Three simple steps to identify soybean pathogens and prevent crop yield loss.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflowSteps.map((ws) => (
            <div 
              key={ws.step}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="h-44 overflow-hidden relative">
                <img 
                  src={ws.image} 
                  alt={ws.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm text-emerald-400 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                  Step {ws.step}
                </span>
              </div>
              <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{ws.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{ws.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Catalog of Key Soybean Diseases */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
              Target Soybean Diseases
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Diagnosed with calibrated computer vision trained on real soybean leaf lesions.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('diseases')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
          >
            <span>View Complete Disease Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {coreDiseases.map((d) => (
            <div 
              key={d.name}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col"
            >
              <img src={d.image} alt={d.name} className="h-36 w-full object-cover" />
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                      {d.severity} Risk
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{d.name}</h3>
                  <p className="text-[11px] italic text-slate-400">{d.pathogen}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-3">
                    {d.symptoms}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety & Agronomic Guidance Advisory Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-3xl p-6 sm:p-8 border border-emerald-200 dark:border-emerald-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Responsible Agricultural Practices & Soil Safety</span>
            </div>
            <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
              SoybeanCare AI provides preliminary diagnostic screening. Fertilizer applications (NPK) must be calibrated according to official soil testing lab reports. Never apply chemical fungicides without proper safety gear or at concentrations exceeding approved agricultural university labels.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('scan')}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shrink-0 transition-all flex items-center space-x-1.5"
          >
            <span>Scan Sample</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Common questions regarding image verification, diagnosis, and reports.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between space-x-4"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-emerald-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
