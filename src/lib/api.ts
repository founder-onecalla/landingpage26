const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function callEdgeFunction<T>(
  functionName: string,
  body: object
): Promise<T> {
  if (!isConfigured()) {
    throw new Error(
      'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
  }

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`Network error calling ${functionName}:`, err);
    throw new Error('Network error. Please check your connection.');
  }

  // Check content type to see if it's JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error(`Non-JSON response from ${functionName}:`, text);
    throw new Error(`Server error (${response.status}). Please try again.`);
  }

  let data: T & { error?: string };
  try {
    data = await response.json();
  } catch (err) {
    console.error(`JSON parse error from ${functionName}:`, err);
    throw new Error('Invalid server response. Please try again.');
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

export interface SubmitStep1Params {
  email: string;
  call_types: string[];
  avoided_call_text?: string;
  other_text?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_adset?: string;
  utm_ad?: string;
}

export interface SubmitStep1Result {
  ok: boolean;
  token: string;
}

export async function submitStep1(params: SubmitStep1Params): Promise<SubmitStep1Result> {
  return callEdgeFunction('submit-step1', params);
}

export interface TranscribeAudioParams {
  step1_id: string;
  audio_base64: string;
  audio_mime: string;
}

export interface TranscribeAudioResult {
  transcript_text: string;
  audio_path: string;
}

export async function transcribeAudio(params: TranscribeAudioParams): Promise<TranscribeAudioResult> {
  return callEdgeFunction('transcribe-audio', params);
}

export interface SubmitStep2Params {
  token: string;
  company: string;
  description_text: string;
  audio_path?: string;
  transcript_text?: string;
  phone?: string;
}

export async function submitStep2(params: SubmitStep2Params): Promise<{ ok: boolean }> {
  return callEdgeFunction('submit-step2', params);
}

// Helper to convert Blob to base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Remove the data:audio/webm;base64, prefix
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
