import React, { useState } from 'react';
import type { DiseaseScan } from '../types';
import { Download, Printer, X, CheckCircle, ShieldCheck, FileText } from 'lucide-react';
import { api } from '../services/api';

interface PDFReportModalProps {
  scan: DiseaseScan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PDFReportModal: React.FC<PDFReportModalProps> = ({ scan, isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  if (!isOpen || !scan) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await api.downloadReportPdf(scan.id);
    } catch (e: any) {
      console.warn("Direct server PDF failed, triggering print-to-PDF:", e);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 text-slate-900 dark:text-slate-100">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <FileText className="w-5 h-5" />
            <span>Official Agronomic Diagnostic Report</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/30"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center space-x-1"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div id="printable-report" className="mt-6 space-y-6">
          
          {/* Header & Logo */}
          <div className="flex items-start justify-between border-b-2 border-emerald-500 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
                SoybeanCare AI Enterprise
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ICAR-Aligned Soybean Phytopathology &amp; Soil Health Advisory
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400">REPORT ID</span>
              <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{scan.id}</p>
              <p className="text-[11px] text-slate-500">{new Date(scan.scannedAt).toLocaleDateString()} | {new Date(scan.scannedAt).toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Farmer & Location Info Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Farmer Information</p>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{scan.farmerName}</p>
              <p className="text-slate-500">Soybean Cultivator | ID: {scan.farmerId}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Geographic Field Coordinates</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{scan.location}</p>
              <p className="text-slate-500">Agri-Zone: Central Soybean Basin</p>
            </div>
          </div>

          {/* Image & Prediction Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Scanned Image with Bounding Box Overlay */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-lg">
              <img src={scan.imageUrl} alt="Scanned Leaf" className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-3/4 border-2 border-dashed border-emerald-400 rounded-lg flex items-top p-1">
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                    Detected: {scan.predictedDisease}
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnostic Core Metrics */}
            <div className="md:col-span-2 space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Foliar Pathogen</span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {(scan.confidenceScore * 100).toFixed(1)}% AI Confidence
                  </span>
                </div>
                <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                  {scan.predictedDisease}
                </h2>
                <p className="text-xs font-serif italic text-slate-500">
                  {scan.diseaseDetails?.scientificName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Severity Level</p>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 uppercase">{scan.severity}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Phenological Stage</p>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100">{scan.diseaseDetails?.affectedStage || 'V3 to R6'}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Biological Symptoms & Causes */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400">Biological Observation</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              {scan.diseaseDetails?.symptoms}
            </p>
          </div>

          {/* Dual Action Protocols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Chemical Recommendation (Subject to Expert Confirmation):</p>
              <p className="text-slate-600 dark:text-slate-300">
                {scan.diseaseDetails?.treatment?.chemical}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Organic &amp; Biological Remedy:</p>
              <p className="text-slate-600 dark:text-slate-300">
                {scan.diseaseDetails?.treatment?.organic}
              </p>
            </div>
          </div>

          {/* Soil & Fertilizer Advisory */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
            <strong>Soil &amp; Fertilizer Note:</strong> Soybean fixes nitrogen biologically via root nodules. Never apply synthetic nitrogen or chemical fertilizers based on visual leaf symptoms alone. Consult an accredited laboratory soil test report.
          </div>

          {/* Legal Disclaimer Box */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
            <strong>SAFETY NOTICE:</strong> This document represents automated decision support and preliminary screening. It does NOT constitute a certified diagnosis. Always seek verification from a qualified agronomy advisor or Krishi Vigyan Kendra before applying chemical treatments.
          </div>

          {/* Signoff Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified by SoybeanCare AI Neural Classifier</span>
            </div>
            <span>Authorized Agricultural AI Telemetry</span>
          </div>

        </div>

      </div>
    </div>
  );
};
