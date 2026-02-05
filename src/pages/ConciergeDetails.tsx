import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { transcribeAudio, submitStep2, blobToBase64 } from '../lib/api';
import { track } from '../lib/analytics';
import { STORAGE_KEYS } from '../types';
import {
  COPY,
  COMPANY_TICKER_LINE1,
  COMPANY_TICKER_LINE2,
  COMPANY_TICKER_LINE3,
  CASES_TICKER_LINE1,
  CASES_TICKER_LINE2,
  CASES_TICKER_LINE3,
} from '../copy';

type Step = 'company' | 'details' | 'done';
type InputMode = 'speak' | 'type';
type RecordingState = 'idle' | 'recording' | 'transcribing';

interface DetailsData {
  company: string;
  transcript: string;
  audioPath: string | null;
}

// Extract step1_id from token
function extractStep1IdFromToken(token: string): string | null {
  try {
    const [dataBase64] = token.split('.');
    if (!dataBase64) return null;
    const data = atob(dataBase64);
    const payload = JSON.parse(data);
    return payload.step1_id || null;
  } catch {
    return null;
  }
}

// Check if token is valid
function isTokenFormatValid(token: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  try {
    const data = atob(parts[0]);
    const payload = JSON.parse(data);
    if (payload.exp && payload.exp < Date.now()) return false;
    return !!payload.step1_id;
  } catch {
    return false;
  }
}

// Ticker component for 3-line scrolling text
function Ticker({ lines }: { lines: string[] }) {
  return (
    <div className="ticker-container">
      {lines.map((line, index) => (
        <div key={index} className="ticker-line">
          <div className="ticker-track">
            <span className="ticker-text">{line}</span>
            <span className="ticker-text">{line}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConciergeDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('t') || '';

  const isValidToken = isTokenFormatValid(token);
  const step1Id = isValidToken ? extractStep1IdFromToken(token) : null;

  const [step, setStep] = useState<Step>('company');
  const [data, setData] = useState<DetailsData>({
    company: '',
    transcript: '',
    audioPath: null,
  });
  const [inputMode, setInputMode] = useState<InputMode>('speak');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voice recording
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Load saved state
  useEffect(() => {
    if (!isValidToken) return;

    const savedData = localStorage.getItem(STORAGE_KEYS.STEP2_DATA);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData({ ...parsed, audioPath: null });
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }

    track('intake_view');
  }, [isValidToken]);

  // Autosave
  useEffect(() => {
    if (!isValidToken) return;
    const { audioPath, ...savableData } = data;
    localStorage.setItem(STORAGE_KEYS.STEP2_DATA, JSON.stringify(savableData));
  }, [data, isValidToken]);

  const validateCompany = useCallback((): boolean => {
    if (!data.company.trim()) {
      setError(COPY.intakeAError);
      return false;
    }
    return true;
  }, [data.company]);

  const validateDetails = useCallback((): boolean => {
    if (!data.transcript.trim()) {
      setError(COPY.intakeBError);
      return false;
    }
    return true;
  }, [data.transcript]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await submitStep2({
        token,
        company: data.company,
        description_text: data.transcript,
        audio_path: data.audioPath || undefined,
        transcript_text: data.transcript,
      });

      track('intake_submit');

      localStorage.removeItem(STORAGE_KEYS.STEP2_DATA);
      localStorage.removeItem(STORAGE_KEYS.STEP2_CURRENT_STEP);

      setStep('done');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, data]);

  const goNext = useCallback(() => {
    setError('');

    if (step === 'company') {
      if (!validateCompany()) return;
      setStep('details');
    } else if (step === 'details') {
      if (!validateDetails()) return;
      handleSubmit();
    }
  }, [step, validateCompany, validateDetails, handleSubmit]);

  const goBack = useCallback(() => {
    setError('');
    if (step === 'details') setStep('company');
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 'done' || recordingState !== 'idle') return;

      if (e.key === 'Enter' && !e.shiftKey) {
        const activeEl = document.activeElement;
        if (activeEl?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          goNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, step, recordingState]);

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await handleTranscription(blob);
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingTime(0);
      track('audio_record_start');

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Unable to access microphone. Please use the Type option.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setRecordingState('transcribing');
    setError('');

    try {
      if (!step1Id) throw new Error('Invalid session');

      const audioBase64 = await blobToBase64(blob);
      const result = await transcribeAudio({
        step1_id: step1Id,
        audio_base64: audioBase64,
        audio_mime: 'audio/webm',
      });

      setData((prev) => ({
        ...prev,
        transcript: result.transcript_text,
        audioPath: result.audio_path,
      }));
      track('audio_transcribed');
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Transcription failed. Please try again or use the Type option.');
    } finally {
      setRecordingState('idle');
    }
  };

  const resetRecording = () => {
    setData((prev) => ({ ...prev, transcript: '', audioPath: null }));
    setRecordingState('idle');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitAnother = () => {
    // Reset the intake data but keep the same token
    setData({ company: '', transcript: '', audioPath: null });
    setStep('company');
    setError('');
    setInputMode('speak');
    localStorage.removeItem(STORAGE_KEYS.STEP2_DATA);
    localStorage.removeItem(STORAGE_KEYS.STEP2_CURRENT_STEP);
  };

  // Expired token
  if (!isValidToken) {
    return (
      <div className="screen-layout">
        <div className="card">
          <div className="text-center">
            <h1 className="title">This link has expired.</h1>
            <p className="subtitle">Please start from the beginning.</p>
            <div className="mt-8">
              <button className="btn-primary" onClick={() => navigate('/')}>
                Start over
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Done screen
  if (step === 'done') {
    return (
      <div className="screen-layout">
        <div className="card">
          <div className="text-center">
            <h1 className="title">{COPY.completionTitle}</h1>
            <p className="subtitle">{COPY.completionSubtext}</p>
            <div className="mt-8">
              <button className="btn-primary" onClick={handleSubmitAnother}>
                {COPY.completionButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-layout">
      <div className="card">
        {/* Intake Screen 1: Company */}
        {step === 'company' && (
          <div>
            <h1 className="title">{COPY.intakeATitle}</h1>

            <div className="mt-6">
              <input
                type="text"
                className={`input ${error ? 'error' : ''}`}
                value={data.company}
                onChange={(e) => {
                  setData((prev) => ({ ...prev, company: e.target.value }));
                  setError('');
                }}
                autoFocus
              />
              {error && <p className="error-text">{error}</p>}
            </div>

            {/* Company suggestions ticker - 3 lines, non-interactive */}
            <Ticker
              lines={[
                COMPANY_TICKER_LINE1,
                COMPANY_TICKER_LINE2,
                COMPANY_TICKER_LINE3,
              ]}
            />

            <div className="mt-8">
              <button className="btn-primary" onClick={goNext}>
                {COPY.intakeAButton}
              </button>
            </div>
            <p className="keyboard-hint">{COPY.keyboardHint}</p>
          </div>
        )}

        {/* Intake Screen 2: Details */}
        {step === 'details' && (
          <div>
            <button type="button" className="back-btn" onClick={goBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>

            <h1 className="title">{COPY.intakeBTitle}</h1>

            {/* Common cases ticker - 3 lines, non-interactive */}
            <Ticker
              lines={[
                CASES_TICKER_LINE1,
                CASES_TICKER_LINE2,
                CASES_TICKER_LINE3,
              ]}
            />

            {/* Speak/Type tabs */}
            <div className="tabs mt-6">
              <button
                type="button"
                className={`tab ${inputMode === 'speak' ? 'active' : ''}`}
                onClick={() => setInputMode('speak')}
              >
                Speak
              </button>
              <button
                type="button"
                className={`tab ${inputMode === 'type' ? 'active' : ''}`}
                onClick={() => setInputMode('type')}
              >
                Type
              </button>
            </div>

            {inputMode === 'speak' ? (
              <div>
                {/* Recording */}
                {recordingState === 'recording' && (
                  <div className="text-center py-8">
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="record-btn recording"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>
                    <p className="helper mt-4">Recording... {formatTime(recordingTime)}</p>
                  </div>
                )}

                {/* Transcribing */}
                {recordingState === 'transcribing' && (
                  <div className="text-center py-8">
                    <div
                      className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
                      style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
                    />
                    <p className="helper">Transcribing...</p>
                  </div>
                )}

                {/* Idle - show record button */}
                {recordingState === 'idle' && !data.transcript && (
                  <div className="text-center py-8">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="record-btn idle"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </button>
                    <p className="helper mt-4">{COPY.intakeBMicHelper}</p>
                  </div>
                )}

                {/* Transcript display */}
                {recordingState === 'idle' && data.transcript && (
                  <div>
                    <p className="transcript-label">{COPY.intakeBTranscriptLabel}</p>
                    <textarea
                      className="textarea"
                      value={data.transcript}
                      onChange={(e) => setData((prev) => ({ ...prev, transcript: e.target.value }))}
                      rows={5}
                    />
                    <p className="transcript-helper">{COPY.intakeBTranscriptHelper}</p>
                    <div className="mt-2">
                      <button type="button" className="link" onClick={resetRecording}>
                        {COPY.intakeBTryAgain}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  className={`textarea ${error ? 'error' : ''}`}
                  value={data.transcript}
                  onChange={(e) => setData((prev) => ({ ...prev, transcript: e.target.value }))}
                  placeholder={COPY.intakeBPlaceholder}
                  rows={5}
                  autoFocus
                />
              </div>
            )}

            {error && <p className="error-text">{error}</p>}

            <div className="mt-8">
              <button
                className="btn-primary"
                onClick={goNext}
                disabled={isSubmitting || recordingState !== 'idle'}
              >
                {isSubmitting ? 'Please wait...' : COPY.intakeBButton}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
