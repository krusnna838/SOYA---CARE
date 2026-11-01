import type { Disease, DiseaseScan, SupportTicket, User, WeatherData, GovtScheme } from '../types';

// Development uses Vite's local /api proxy. Production connects to the existing
// Render backend unless an explicit VITE_API_BASE_URL is supplied at build time.
const configuredApiUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const defaultApiUrl = import.meta.env.DEV
  ? '/api'
  : 'https://soya-care-2.onrender.com/api';
const apiUrl = !configuredApiUrl || (!import.meta.env.DEV && configuredApiUrl.startsWith('/'))
  ? defaultApiUrl
  : configuredApiUrl;
// Accept either the backend root URL or the full /api URL in Render settings.
const API_BASE_URL = apiUrl.startsWith('http') && !apiUrl.endsWith('/api')
  ? `${apiUrl}/api`
  : apiUrl;

const TOKEN_KEY = 'soybeancare_auth_token';
const USER_KEY = 'soybeancare_user_profile';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  remove: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getUser: (): User | null => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user))
};

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    // If token expired, clear local storage
    tokenStorage.remove();
  }
  return response;
}

export const api = {
  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  async login(email: string, password: string, role?: string): Promise<{ token: string; user: User }> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          tokenStorage.set(data.token);
          tokenStorage.setUser(data.user);
        }
        return data;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Invalid email or password.');
    } catch (e: unknown) {
      if (e instanceof Error && e.message && e.message !== 'Failed to fetch') {
        throw e;
      }
      console.error('Login request could not reach the backend:', e);
      throw new Error(
        `Cannot connect to the backend at ${API_BASE_URL}. Check the Render backend service, VITE_API_BASE_URL, and backend CORS settings.`
      );
    }
  },

  async register(formData: any): Promise<{ token: string; user: User }> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          tokenStorage.set(data.token);
          tokenStorage.setUser(data.user);
        }
        return data;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Registration failed.');
    } catch (e: unknown) {
      if (e instanceof Error && e.message && e.message !== 'Failed to fetch') throw e;
      console.error('Registration request could not reach the backend:', e);
      throw new Error(
        `Cannot connect to the backend at ${API_BASE_URL}. Check the Render backend service, VITE_API_BASE_URL, and backend CORS settings.`
      );
    }
  },

  async googleLogin(credential: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Google login failed.');
    }
    const data = await res.json();
    if (data.token) {
      tokenStorage.set(data.token);
      tokenStorage.setUser(data.user);
    }
    return data;
  },

  async appleLogin(payload?: any): Promise<{ token: string; user: User }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/auth/apple`, {
      method: 'POST',
      body: JSON.stringify(payload || { email: 'apple.farmer@soybeancare.ai', name: 'Apple ID Farmer' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Apple Sign-In failed.');
    }
    const data = await res.json();
    if (data.token) {
      tokenStorage.set(data.token);
      tokenStorage.setUser(data.user);
    }
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = tokenStorage.get();
    if (!token || token === 'mock-jwt-token') {
      tokenStorage.remove();
      return null;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          tokenStorage.setUser(data.user);
          return data.user;
        }
      }
      // Never trust a cached profile when the API rejects the session.
      tokenStorage.remove();
      return null;
    } catch (e) {
      console.warn('Could not verify session with backend:', e);
      return null;
    }
  },

  async updateProfile(profileData: any): Promise<User> {
    const res = await fetchWithAuth(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      throw new Error('Could not update profile.');
    }
    const data = await res.json();
    if (data.user) tokenStorage.setUser(data.user);
    return data.user;
  },

  logout() {
    tokenStorage.remove();
  },

  // -------------------------------------------------------------
  // AI PREDICTION & SCANNING PIPELINE
  // -------------------------------------------------------------
  async predictLeafDisease(
    imageBase64: string,
    location?: string,
    latitude?: number,
    longitude?: number
  ): Promise<{ success: boolean; scan?: DiseaseScan; [key: string]: any }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: JSON.stringify({ imageBase64, location, latitude, longitude }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `AI prediction failed (HTTP ${res.status}).`);
    }
    // Never fabricate a disease result when the backend/model is unavailable.
    return data;
  },

  // -------------------------------------------------------------
  // DISEASE CATALOG
  // -------------------------------------------------------------
  async getDiseases(): Promise<Disease[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/diseases`);
      if (res.ok) {
        const data = await res.json();
        return data.diseases;
      }
    } catch (e) {
      console.warn('Using local disease catalog fallback:', e);
    }
    return [
      {
        id: 'd1',
        name: 'Septoria Brown Spot',
        scientificName: 'Septoria glycines',
        severity: 'medium',
        affectedStage: 'V3 to R6 (Vegetative to Pod Fill)',
        symptoms: 'Small, dark brown irregular spots on lower leaves with leaf yellowing.',
        causes: 'Fungal pathogen overwintering in crop residue.',
        treatment: {
          chemical: 'Apply Quadris (Azoxystrobin) or Headline EC at early onset.',
          organic: 'Apply Copper Soap or Neem oil foliar spray.'
        },
        recommendedPesticides: [
          { name: 'Headline EC', dosage: '6 - 12 fl oz/acre', timing: 'R1 to R3 Growth Stage' },
          { name: 'Quadris', dosage: '6.0 - 15.5 fl oz/acre', timing: 'At early disease onset' }
        ],
        organicSolution: 'Serenade ASO (Bacillus subtilis strain QST 713).',
        preventiveTips: ['Crop rotation with maize for 2 years.', 'Pathogen-free certified seeds.'],
        images: ['https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'd2',
        name: 'Asian Soybean Rust',
        scientificName: 'Phakopsora pachyrhizi',
        severity: 'critical',
        affectedStage: 'R1 to R7 (Flowering to Maturity)',
        symptoms: 'Tiny reddish-brown pustules on underside of lower leaves with rapid defoliation.',
        causes: 'Windborne fungal spores spread over long distances.',
        treatment: {
          chemical: 'Immediate spray of Priaxor or Delaro 325 SC.',
          organic: 'Sulfur-based organic fungicides or bio-stimulant chitin extract.'
        },
        recommendedPesticides: [
          { name: 'Priaxor', dosage: '4 - 8 fl oz/acre', timing: 'Preventive at R1-R3' }
        ],
        organicSolution: 'Copper hydroxide foliar treatment.',
        preventiveTips: ['Plant early-maturing cultivars.', 'Monitor regional spore bulletins.'],
        images: ['https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80']
      }
    ];
  },

  // -------------------------------------------------------------
  // SCANS & REPORTS
  // -------------------------------------------------------------
  async getScans(): Promise<DiseaseScan[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/scans`);
      if (res.ok) {
        const data = await res.json();
        return data.scans || [];
      }
    } catch (e) {
      console.warn('Could not load scans from backend:', e);
    }
    return [];
  },

  getReportPdfUrl(reportId: number | string): string {
    const cleanId = String(reportId).replace('scan-', '');
    return `${API_BASE_URL}/reports/${cleanId}/pdf`;
  },

  async downloadReportPdf(reportId: number | string): Promise<void> {
    const cleanId = String(reportId).replace('scan-', '');
    const url = `${API_BASE_URL}/reports/${cleanId}/pdf`;
    const res = await fetchWithAuth(url);
    if (!res.ok) {
      throw new Error('Failed to download PDF report.');
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `SoybeanCare-Health-Report-${cleanId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  async getMapReports(): Promise<any[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/map/reports`);
      if (res.ok) {
        const data = await res.json();
        return data.points || [];
      }
    } catch (e) {
      console.warn('Could not load map reports:', e);
    }
    return [];
  },

  // -------------------------------------------------------------
  // SUPPORT TICKETS
  // -------------------------------------------------------------
  async getTickets(): Promise<SupportTicket[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/tickets`);
      if (res.ok) {
        const data = await res.json();
        return data.tickets || [];
      }
    } catch (e) {
      console.warn('Could not load tickets:', e);
    }
    return [];
  },

  async createTicket(ticket: any): Promise<SupportTicket> {
    const res = await fetchWithAuth(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      body: JSON.stringify(ticket)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not create support ticket.');
    return data.ticket;

  },

  async replyTicket(ticketId: string, text: string): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      throw new Error('Failed to send reply to query.');
    }
    return await res.json();
  },

  async updateTicketStatus(ticketId: string, status: string): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      throw new Error('Failed to update query status.');
    }
    return await res.json();
  },

  async requestExpertReview(reportId: number | string, notes?: string): Promise<any> {
    const cleanId = String(reportId).replace('scan-', '');
    const res = await fetchWithAuth(`${API_BASE_URL}/reports/${cleanId}/request-expert`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to request expert review.');
    }
    return await res.json();
  },

  async expertReview(data: { scanId: string; expertNotes?: string; approve: boolean; customDisease?: string }): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE_URL}/expert/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record expert review.');
    }
    return await res.json();
  },

  // -------------------------------------------------------------
  // WEATHER & GOVERNMENT SCHEMES
  // -------------------------------------------------------------
  async getWeather(lat?: number, lon?: number): Promise<WeatherData | null> {
    try {
      const q = (lat !== undefined && lon !== undefined) ? `?lat=${lat}&lon=${lon}` : '';
      const res = await fetchWithAuth(`${API_BASE_URL}/weather${q}`);
      if (res.ok) {
        const data = await res.json();
        return data.weather;
      }
    } catch (e) { console.warn('Weather service unavailable:', e); }
    return null;
  },

  async getSchemes(state?: string): Promise<GovtScheme[]> {
    try {
      const q = state ? `?state=${encodeURIComponent(state)}` : '';
      const res = await fetchWithAuth(`${API_BASE_URL}/schemes${q}`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.schemes) ? data.schemes : [];
      }
    } catch (e) { console.warn('Government schemes service unavailable:', e); }
    return [];
  },

  // -------------------------------------------------------------
  // ADMINISTRATOR CONTROLS
  // -------------------------------------------------------------
  async getAdminSummary(): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE_URL}/admin/summary`);
    if (!res.ok) throw new Error('Could not retrieve admin summary.');
    return await res.json();
  },

  async getAdminUsers(searchQuery?: string): Promise<User[]> {
    const q = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
    const res = await fetchWithAuth(`${API_BASE_URL}/admin/users${q}`);
    if (!res.ok) throw new Error('Could not retrieve users.');
    const data = await res.json();
    return data.users || [];
  },

  async getAdminUserActivity(userId: number | string): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/activity`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Could not retrieve farmer activity.');
    }
    return await res.json();
  },

  async updateUserRole(userId: number | string, newRole: string): Promise<any> {
    const cleanId = String(userId).replace('u', '');
    const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${cleanId}/role`, {
      method: 'POST',
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) throw new Error('Could not update user role.');
    return await res.json();
  },

  async getAdminAuditLogs(): Promise<any[]> {
    const res = await fetchWithAuth(`${API_BASE_URL}/admin/audit-logs`);
    if (!res.ok) throw new Error('Could not retrieve audit logs.');
    const data = await res.json();
    return data.logs || [];
  }
};
