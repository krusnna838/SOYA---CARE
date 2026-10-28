import React, { useState, useEffect } from 'react';
import { User, DiseaseScan, WeatherData, GovtScheme } from '../types';
import { 
  Sprout, FileText, CloudSun, MapPin, Download, Plus, Settings, 
  AlertCircle, CheckCircle2, ShieldAlert, ExternalLink, Navigation, 
  Compass, RefreshCw, Globe, ChevronRight 
} from 'lucide-react';
import { api } from '../services/api';

interface FarmerDashboardProps {
  user: User;
  scans: DiseaseScan[];
  weather: WeatherData | null;
  schemes: GovtScheme[];
  onOpenReportModal: (scan: DiseaseScan) => void;
  onNavigateTab: (tab: string) => void;
  onOpenProfile: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  user,
  scans,
  weather: initialWeather,
  schemes: initialSchemes,
  onOpenReportModal,
  onNavigateTab,
  onOpenProfile
}) => {
  const healthyCount = scans.filter(s => s.predictedDisease?.toLowerCase().includes('healthy')).length;
  const diseaseCount = scans.length - healthyCount;

  // Live Location & Weather State
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(initialWeather);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // State-based Schemes State
  const [selectedState, setSelectedState] = useState<string>(user.state || 'Madhya Pradesh');
  const [schemesList, setSchemesList] = useState<GovtScheme[]>(initialSchemes);
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  // Fetch schemes when state changes
  useEffect(() => {
    async function loadStateSchemes() {
      setLoadingSchemes(true);
      try {
        const data = await api.getSchemes(selectedState);
        setSchemesList(data);
      } catch (e) {
        console.warn('Failed to load schemes for state:', e);
      } finally {
        setLoadingSchemes(false);
      }
    }
    loadStateSchemes();
  }, [selectedState]);

  // Live GPS Location Detection
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLiveLocation({ lat, lon });
        try {
          const freshWeather = await api.getWeather(lat, lon);
          setCurrentWeather(freshWeather);
        } catch (e) {
          console.warn('Could not fetch GPS live weather:', e);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        setGpsError('GPS permission was denied or signal unavailable.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome & Farmer Profile Header Banner with Agricultural Photography */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/20 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1920&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/85 to-slate-950/90" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">{user.name}</h1>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Soybean Grower
                </span>
                {user.nationality && (
                  <span className="text-[11px] bg-white/10 text-white font-medium px-2 py-0.5 rounded-md">
                    {user.nationality}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {[user.village, user.district, user.state].filter(Boolean).join(', ') || 'Central Agronomy Belt'}
                </span>
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-emerald-100/80 pt-1">
                {user.farmSize && (
                  <span className="bg-white/10 px-2 py-0.5 rounded-md">Area: <strong>{user.farmSize}</strong></span>
                )}
                {user.cropVariety && (
                  <span className="bg-white/10 px-2 py-0.5 rounded-md">Variety: <strong>{user.cropVariety}</strong></span>
                )}
                {user.soilType && (
                  <span className="bg-white/10 px-2 py-0.5 rounded-md">Soil: <strong>{user.soilType}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenProfile}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center space-x-1.5"
            >
              <Settings className="w-4 h-4" />
              <span>Edit Farm Profile</span>
            </button>
            <button
              onClick={() => onNavigateTab('scan')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Leaf Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Scans Overview & Right Live Weather / Schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Farm Diagnostics & Scans History */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Diagnostic Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Scans</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{scans.length}</p>
              <p className="text-[10px] text-slate-400">Specimens analyzed</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Healthy Foliage</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{healthyCount}</p>
              <p className="text-[10px] text-slate-400">Disease-free leaves</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pathogen Alerts</span>
              <p className="text-2xl font-bold text-rose-500">{diseaseCount}</p>
              <p className="text-[10px] text-slate-400">Treated / monitored</p>
            </div>
          </div>

          {/* Scans List / Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Field Health Scan History</span>
              </h3>
              <button
                onClick={() => onNavigateTab('scan')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Scan Leaf Now &rarr;
              </button>
            </div>

            {scans.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                <Sprout className="w-10 h-10 text-emerald-500 mx-auto opacity-40" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Leaf Scans Recorded Yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Take a photo of any soybean leaf showing spots or discoloration to receive instant ICAR verification and download PDF reports.
                </p>
                <button
                  onClick={() => onNavigateTab('scan')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
                >
                  Start First Scan
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300">
                      <th className="p-3 rounded-l-xl">Sample</th>
                      <th className="p-3">Detected Condition</th>
                      <th className="p-3">Confidence</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3 rounded-r-xl text-right">PDF Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {scans.map((scan) => {
                      const isHealthy = scan.predictedDisease?.toLowerCase().includes('healthy');
                      return (
                        <tr key={scan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <img src={scan.imageUrl} alt={scan.predictedDisease} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{scan.predictedDisease}</p>
                            <p className="text-[10px] text-slate-400">{new Date(scan.scannedAt).toLocaleDateString()}</p>
                          </td>
                          <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                            {(scan.confidenceScore * 100).toFixed(1)}%
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isHealthy 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                              {isHealthy ? 'Healthy' : (scan.severity || 'Alert')}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onOpenReportModal(scan)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors inline-flex items-center space-x-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live GPS Weather & Government Subsidies */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Live Farm GPS Weather Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <CloudSun className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Field Agro-Weather</h3>
              </div>
              
              {/* Detect Live GPS Button */}
              <button
                onClick={handleDetectLiveLocation}
                disabled={detectingGps}
                title="Detect live GPS coordinates of your soybean field"
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20 flex items-center space-x-1 transition-all"
              >
                <Navigation className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                <span>{detectingGps ? 'Locating...' : 'Live GPS'}</span>
              </button>
            </div>

            {currentWeather && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{currentWeather.temperatureC}°C</p>
                    <p className="text-xs text-slate-500">{currentWeather.condition}</p>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {currentWeather.location}
                    </p>
                  </div>
                  <div className="text-right text-xs space-y-1 text-slate-500">
                    <p>Humidity: <strong className="text-slate-800 dark:text-slate-200">{currentWeather.humidityPercent}%</strong></p>
                    <p>Wind: <strong className="text-slate-800 dark:text-slate-200">{currentWeather.windSpeedKmh} km/h</strong></p>
                    <p>Rain Risk: <strong className="text-slate-800 dark:text-slate-200">{currentWeather.rainProbabilityPercent}%</strong></p>
                  </div>
                </div>

                {liveLocation && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <Compass className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{liveLocation.lat.toFixed(4)}°N, {liveLocation.lon.toFixed(4)}°E</span>
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center space-x-0.5"
                    >
                      <span>Satellite View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {gpsError && (
                  <p className="text-[11px] text-rose-500">{gpsError}</p>
                )}

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  <strong>Spray Advisory:</strong> {currentWeather.sprayAdvisory}
                </div>
              </>
            )}
          </div>

          {/* Government Soybean Subsidies & Schemes (With State Filter and Direct Official Links) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Soybean Schemes &amp; Subsidies</span>
              </h3>

              {/* State Filter Selector */}
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Telangana">Telangana</option>
                <option value="All">All National Schemes</option>
              </select>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {loadingSchemes ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading verified government schemes...</div>
              ) : schemesList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No schemes found for this selection.</div>
              ) : (
                schemesList.map((s) => (
                  <div 
                    key={s.id} 
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 leading-snug">{s.title}</p>
                      {s.state && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                          {s.state}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">{s.description}</p>
                    
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 text-[11px] space-y-0.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Benefit: <span className="font-normal text-emerald-600 dark:text-emerald-400">{s.subsidy}</span>
                      </p>
                      {s.eligibility && (
                        <p className="text-slate-500 text-[10px]">Eligibility: {s.eligibility}</p>
                      )}
                    </div>

                    {/* Official Portal Redirect Button */}
                    <div className="pt-1 flex justify-end">
                      <a
                        href={s.officialUrl || s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                      >
                        <span>Visit Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
