import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitStep1 } from '../lib/api';
import { track } from '../lib/analytics';
import { STORAGE_KEYS } from '../types';
import { COPY, CATEGORY_TICKER_LINE1, CATEGORY_TICKER_LINE2, CATEGORY_TICKER_LINE3 } from '../copy';

type Step = 1 | 2 | 'confirmation';

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

interface FormData {
  selectedCategories: string[];
  customText: string;
  email: string;
}

export function ConciergeIntake() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>({
    selectedCategories: [],
    customText: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

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

  const validateStep1 = useCallback((): boolean => {
    const hasCategory = data.selectedCategories.length > 0;
    const hasText = data.customText.trim().length > 0;
    if (!hasCategory && !hasText) {
      setError(COPY.step1Error);
      return false;
    }
    return true;
  }, [data.selectedCategories, data.customText]);

  const validateStep2 = useCallback((): boolean => {
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError(COPY.step2Error);
      return false;
    }
    return true;
  }, [data.email]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const result = await submitStep1({
        email: data.email,
        call_types: data.selectedCategories,
        avoided_call_text: data.customText || undefined,
        ...utmParams,
      });

      track('step2_submit');
      setToken(result.token);

      localStorage.removeItem(STORAGE_KEYS.STEP1_DATA);
      localStorage.removeItem(STORAGE_KEYS.STEP1_CURRENT_STEP);

      setStep('confirmation');
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
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      handleSubmit();
    }
  }, [step, validateStep1, validateStep2, handleSubmit]);

  const goBack = useCallback(() => {
    setError('');
    if (step === 2) setStep(1);
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 'confirmation') return;

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

  const detailsUrl = token ? `/details?t=${token}` : '/details';

  // Confirmation screen
  if (step === 'confirmation') {
    return (
      <div className="screen-layout">
        <div className="card">
          <div className="text-center">
            <h1 className="title">{COPY.confirmationText}</h1>
            <p className="subtitle" style={{ marginTop: '16px', marginBottom: '0' }}>
              <a href={detailsUrl} className="link">{COPY.confirmationLink}</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Step indicator */}
      <div className="fixed top-6 right-6 step-indicator">
        {step === 1 ? COPY.step1Progress : COPY.step2Progress}
      </div>

      <div className="screen-layout">
        <div className="card">
          {/* Step 1 */}
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

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <button type="button" className="back-btn" onClick={goBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>

              <h1 className="title">{COPY.step2Title}</h1>

              <div className="mt-6">
                <input
                  type="email"
                  className={`input ${error ? 'error' : ''}`}
                  value={data.email}
                  onChange={(e) => {
                    setData((prev) => ({ ...prev, email: e.target.value }));
                    setError('');
                  }}
                  placeholder={COPY.step2Placeholder}
                  autoFocus
                />
                {error && <p className="error-text">{error}</p>}
              </div>

              <div className="mt-8">
                <button className="btn-primary" onClick={goNext} disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait...' : COPY.step2Button}
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
