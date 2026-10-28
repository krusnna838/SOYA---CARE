export type UserRole = 'FARMER' | 'EXPERT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  village?: string;
  district?: string;
  state?: string;
  nationality?: string;
  avatar?: string;
  farmSize?: string;
  cropVariety?: string;
  soilType?: string;
  language?: string;
  specialization?: string;
  institution?: string;
  twoFactorEnabled?: boolean;
}

export interface Pesticide {
  name: string;
  dosage: string;
  timing: string;
}

export interface Disease {
  id: string;
  name: string;
  scientificName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedStage: string;
  symptoms: string;
  causes: string;
  treatment: {
    chemical: string;
    organic: string;
  };
  recommendedPesticides: Pesticide[];
  organicSolution: string;
  preventiveTips: string[];
  images: string[];
  videoUrl?: string;
  referenceLinks?: string[];
}

export interface DiseaseScan {
  id: string;
  farmerId: string;
  farmerName: string;
  imageUrl: string;
  predictedDisease: string;
  confidenceScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  scannedAt: string;
  location: string;
  status: 'pending_review' | 'reviewed';
  expertNotes?: string;
  expertApproved?: boolean;
  diseaseDetails?: Disease;
}

export interface TicketMessage {
  sender: string;
  role: string;
  timestamp: string;
  text: string;
}

export interface SupportTicket {
  id: string;
  farmerId: string;
  farmerName: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  messages: TicketMessage[];
}

export interface WeatherData {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  condition: string;
  rainProbabilityPercent: number;
  location: string;
  sprayAdvisory: string;
}

export interface GovtScheme {
  id: string;
  title: string;
  description: string;
  subsidy: string;
  link: string;
  officialUrl?: string;
  state?: string;
  eligibility?: string;
}

export type LanguageCode = 'en' | 'hi' | 'es' | 'sw';
