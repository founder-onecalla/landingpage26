export interface LeadIntakeStep1 {
  id: string;
  created_at: string;
  email: string;
  call_types: string[];
  avoided_call_text: string | null;
  other_text: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_adset: string | null;
  utm_ad: string | null;
  session_id: string | null;
  token: string;
}

export interface LeadIntakeStep2 {
  id: string;
  created_at: string;
  step1_id: string;
  company: string;
  description_text: string;
  audio_url: string | null;
  transcript_text: string | null;
  phone: string | null;
}

export const COMMON_COMPANIES = [
  'Aetna',
  'Allstate',
  'Amazon',
  'American Express',
  'Anthem',
  'AT&T',
  'Bank of America',
  'Blue Cross Blue Shield',
  'Capital One',
  'Chase',
  'Cigna',
  'Comcast',
  'CVS',
  'Delta Airlines',
  'Discover',
  'Duke Energy',
  'Fidelity',
  'GEICO',
  'Humana',
  'Kaiser Permanente',
  'Medicare',
  'MetLife',
  'Netflix',
  'PG&E',
  'Progressive',
  'Social Security',
  'Spectrum',
  'State Farm',
  'T-Mobile',
  'UnitedHealthcare',
  'USAA',
  'Verizon',
  'Walgreens',
  'Wells Fargo',
  'Xfinity',
] as const;

// Local storage keys for autosave
export const STORAGE_KEYS = {
  STEP1_DATA: 'onecalla_step1_data',
  STEP1_CURRENT_STEP: 'onecalla_step1_current',
  STEP2_DATA: 'onecalla_step2_data',
  STEP2_CURRENT_STEP: 'onecalla_step2_current',
} as const;
