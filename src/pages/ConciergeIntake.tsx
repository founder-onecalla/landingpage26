import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitStep1 } from '../lib/api';
import { track } from '../lib/analytics';
import { STORAGE_KEYS } from '../types';
import { 
  COPY, 
  CATEGORY_TICKER_LINE1, 
  CATEGORY_TICKER_LINE2, 
  CATEGORY_TICKER_LINE3,
  COMPANY_TICKER_LINE1,
  COMPANY_TICKER_LINE2,
  COMPANY_TICKER_LINE3,
} from '../copy';

type Step = 1 | 2 | 3 | 'done';

// Clickable ticker component for category selection
function ClickableTicker({ 
  lines, 
  selectedItems, 
  onToggle 
}: { 
  lines: readonly (readonly string[])[]; 
  selectedItems: string[]; 
  onToggle: (item: string) => void;
}) {
  return (
    <div className="clickable-ticker-container">
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} className="clickable-ticker-line">
          <div className="clickable-ticker-track">
            {/* First set */}
            {line.map((item) => (
              <button
                key={`${item}-1`}
                type="button"
                className={`clickable-ticker-item ${selectedItems.includes(item) ? 'selected' : ''}`}
                onClick={() => onToggle(item)}
              >
                {item}
              </button>
            ))}
            {/* Duplicate set for seamless loop */}
            {line.map((item) => (
              <button
                key={`${item}-2`}
                type="button"
                className={`clickable-ticker-item ${selectedItems.includes(item) ? 'selected' : ''}`}
                onClick={() => onToggle(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Non-interactive ticker for company suggestions
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

interface FormData {
  selectedCategories: string[];
  customText: string;
  company: string;
  details: string;
  email: string;
}

export function ConciergeIntake() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>({
    selectedCategories: [],
    customText: '',
    company: '',
    details: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UTM params
  const [utmParams, setUtmParams] = useState<{
    utm_source?: string;
    utm_campaign?: string;
  }>({});

  // Load saved state
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEYS.STEP1_DATA);
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }

    setUtmParams({
      utm_source: searchParams.get('utm_source') || undefined,
      utm_campaign: searchParams.get('utm_campaign') || undefined,
    });

    track('step1_view');
  }, [searchParams]);

  // Autosave
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STEP1_DATA, JSON.stringify(data));
  }, [data]);

  // Step 1: Category is required
  const validateStep1 = useCallback((): boolean => {
    const hasCategory = data.selectedCategories.length > 0;
    const hasText = data.customText.trim().length > 0;
    if (!hasCategory && !hasText) {
      setError(COPY.step1Error);
      return false;
    }
    return true;
  }, [data.selectedCategories, data.customText]);

  // Step 2: Company + Details are optional, always valid
  const validateStep2 = useCallback((): boolean => {
    return true; // Both fields optional
  }, []);

  // Step 3: Email is required
  const validateStep3 = useCallback((): boolean => {
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError(COPY.step3Error);
      return false;
    }
    return true;
  }, [data.email]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await submitStep1({
        email: data.email,
        call_types: data.selectedCategories,
        avoided_call_text: data.customText || undefined,
        company: data.company || undefined,
        description_text: data.details || undefined,
        ...utmParams,
      });

      track('form_submit');

      localStorage.removeItem(STORAGE_KEYS.STEP1_DATA);
      localStorage.removeItem(STORAGE_KEYS.STEP1_CURRENT_STEP);

      setStep('done');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [data, utmParams]);

  const goNext = useCallback(() => {
    setError('');

    if (step === 1) {
      if (!validateStep1()) return;
      track('step1_complete');
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      track('step2_complete');
      setStep(3);
    } else if (step === 3) {
      if (!validateStep3()) return;
      handleSubmit();
    }
  }, [step, validateStep1, validateStep2, validateStep3, handleSubmit]);

  const goBack = useCallback(() => {
    setError('');
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 'done') return;

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
  }, [goNext, step]);

  const toggleCategory = (category: string) => {
    setData((prev) => {
      const isSelected = prev.selectedCategories.includes(category);
      return {
        ...prev,
        selectedCategories: isSelected
          ? prev.selectedCategories.filter((c) => c !== category)
          : [...prev.selectedCategories, category],
      };
    });
    setError('');
  };

  const getStepProgress = () => {
    if (step === 1) return 'Step 1 of 3';
    if (step === 2) return 'Step 2 of 3';
    if (step === 3) return 'Step 3 of 3';
    return '';
  };

  // Done screen
  if (step === 'done') {
    return (
      <div className="screen-layout">
        <div className="card">
          <div className="text-center">
            <h1 className="title">{COPY.doneTitle}</h1>
            <p className="subtitle">{COPY.doneSubtext}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Step indicator */}
      <div className="fixed top-6 right-6 step-indicator">
        {getStepProgress()}
      </div>

      <div className="screen-layout">
        <div className="card">
          {/* Step 1: Category (required) */}
          {step === 1 && (
            <div>
              <h1 className="title">{COPY.step1Title}</h1>
              <p className="subtitle">{COPY.step1Subtitle}</p>

              <input
                type="text"
                className={`input ${error ? 'error' : ''}`}
                value={data.customText}
                onChange={(e) => {
                  setData((prev) => ({ ...prev, customText: e.target.value }));
                  setError('');
                }}
                placeholder={COPY.step1Placeholder}
                autoFocus
              />

              {/* Category ticker - clickable, 3 lines, scrolling */}
              <ClickableTicker
                lines={[CATEGORY_TICKER_LINE1, CATEGORY_TICKER_LINE2, CATEGORY_TICKER_LINE3]}
                selectedItems={data.selectedCategories}
                onToggle={toggleCategory}
              />

              {error && <p className="error-text">{error}</p>}

              <div className="mt-8">
                <button className="btn-primary" onClick={goNext}>
                  {COPY.step1Button}
                </button>
              </div>
              <p className="keyboard-hint">{COPY.keyboardHint}</p>
            </div>
          )}

          {/* Step 2: Company + Details (both optional) */}
          {step === 2 && (
            <div>
              <button type="button" className="back-btn" onClick={goBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>

              <h1 className="title">{COPY.step2Title}</h1>
              <p className="subtitle">{COPY.step2Subtitle}</p>

              <div className="mt-6">
                <input
                  type="text"
                  className="input"
                  value={data.company}
                  onChange={(e) => setData((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder={COPY.step2CompanyPlaceholder}
                  autoFocus
                />
              </div>

              {/* Company suggestions ticker */}
              <Ticker
                lines={[
                  COMPANY_TICKER_LINE1,
                  COMPANY_TICKER_LINE2,
                  COMPANY_TICKER_LINE3,
                ]}
              />

              <div className="mt-6">
                <textarea
                  className="textarea"
                  value={data.details}
                  onChange={(e) => setData((prev) => ({ ...prev, details: e.target.value }))}
                  placeholder={COPY.step2DetailsPlaceholder}
                  rows={4}
                />
              </div>

              <div className="mt-8">
                <button className="btn-primary" onClick={goNext}>
                  {COPY.step2Button}
                </button>
              </div>
              <p className="keyboard-hint">{COPY.keyboardHint}</p>
            </div>
          )}

          {/* Step 3: Email (required) */}
          {step === 3 && (
            <div>
              <button type="button" className="back-btn" onClick={goBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>

              <h1 className="title">{COPY.step3Title}</h1>

              <div className="mt-6">
                <input
                  type="email"
                  className={`input ${error ? 'error' : ''}`}
                  value={data.email}
                  onChange={(e) => {
                    setData((prev) => ({ ...prev, email: e.target.value }));
                    setError('');
                  }}
                  placeholder={COPY.step3Placeholder}
                  autoFocus
                />
                {error && <p className="error-text">{error}</p>}
              </div>

              <div className="mt-8">
                <button className="btn-primary" onClick={goNext} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : COPY.step3Button}
                </button>
              </div>
              <p className="keyboard-hint">{COPY.keyboardHint}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
