import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitStep1, sendVerificationCode } from '../lib/api';
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

type Step = 1 | 2 | 3 | 4 | 'done';

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

// Clickable company ticker - parses string lines into clickable items
function ClickableCompanyTicker({ 
  lines, 
  selectedItems, 
  onToggle 
}: { 
  lines: string[]; 
  selectedItems: string[]; 
  onToggle: (item: string) => void;
}) {
  // Parse company lines (format: "Company1 · Company2 · Company3")
  const parsedLines = lines.map(line => line.split(' · '));
  
  return (
    <div className="clickable-ticker-container">
      {parsedLines.map((companies, lineIndex) => (
        <div key={lineIndex} className="clickable-ticker-line">
          <div className="clickable-ticker-track">
            {/* First set */}
            {companies.map((company) => (
              <button
                key={`${company}-1`}
                type="button"
                className={`clickable-ticker-item ${selectedItems.includes(company) ? 'selected' : ''}`}
                onClick={() => onToggle(company)}
              >
                {company}
              </button>
            ))}
            {/* Duplicate set for seamless loop */}
            {companies.map((company) => (
              <button
                key={`${company}-2`}
                type="button"
                className={`clickable-ticker-item ${selectedItems.includes(company) ? 'selected' : ''}`}
                onClick={() => onToggle(company)}
              >
                {company}
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
  selectedCompanies: string[];
  companyText: string;
  details: string;
  email: string;
}

export function ConciergeIntake() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>({
    selectedCategories: [],
    customText: '',
    selectedCompanies: [],
    companyText: '',
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

  // Submit form and send verification email
  const handleSubmitAndSendEmail = useCallback(async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Combine selected companies with typed company
      const allCompanies = [...data.selectedCompanies];
      if (data.companyText.trim()) {
        allCompanies.push(data.companyText.trim());
      }

      // Submit the form data
      await submitStep1({
        email: data.email,
        call_types: data.selectedCategories,
        avoided_call_text: data.customText || undefined,
        company: allCompanies.length > 0 ? allCompanies.join(', ') : undefined,
        description_text: data.details || undefined,
        ...utmParams,
      });

      // Send verification email
      await sendVerificationCode({ email: data.email });

      track('form_submit');
      track('verification_sent');

      localStorage.removeItem(STORAGE_KEYS.STEP1_DATA);
      localStorage.removeItem(STORAGE_KEYS.STEP1_CURRENT_STEP);

      setStep(4); // Show "check your inbox" screen
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [data, utmParams]);

  // Resend verification email
  const handleResendEmail = useCallback(async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await sendVerificationCode({ email: data.email });
      track('verification_resent');
    } catch (err) {
      console.error('Resend email error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend email.');
    } finally {
      setIsSubmitting(false);
    }
  }, [data.email]);

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
      handleSubmitAndSendEmail();
    }
  }, [step, validateStep1, validateStep2, validateStep3, handleSubmitAndSendEmail]);

  const goBack = useCallback(() => {
    setError('');
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    if (step === 4) setStep(3);
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

  const toggleCompany = (company: string) => {
    setData((prev) => {
      const isSelected = prev.selectedCompanies.includes(company);
      return {
        ...prev,
        selectedCompanies: isSelected
          ? prev.selectedCompanies.filter((c) => c !== company)
          : [...prev.selectedCompanies, company],
      };
    });
  };

  const getStepProgress = () => {
    if (step === 1) return 'Step 1 of 3';
    if (step === 2) return 'Step 2 of 3';
    if (step === 3) return 'Step 3 of 3';
    return ''; // Step 4 (check inbox) doesn't show progress
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
                  value={data.companyText}
                  onChange={(e) => setData((prev) => ({ ...prev, companyText: e.target.value }))}
                  placeholder={COPY.step2CompanyPlaceholder}
                  autoFocus
                />
              </div>

              {/* Company suggestions ticker - clickable */}
              <ClickableCompanyTicker
                lines={[
                  COMPANY_TICKER_LINE1,
                  COMPANY_TICKER_LINE2,
                  COMPANY_TICKER_LINE3,
                ]}
                selectedItems={data.selectedCompanies}
                onToggle={toggleCompany}
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
                <button type="button" className="btn-skip" onClick={goNext}>
                  {COPY.step2Skip}
                </button>
              </div>
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

          {/* Step 4: Check inbox */}
          {step === 4 && (
            <div className="text-center">
              <div className="inbox-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h1 className="title">{COPY.step4Title}</h1>
              <p className="subtitle">{COPY.step4Subtitle} <strong>{data.email}</strong></p>
              <p className="helper" style={{ marginTop: '8px' }}>{COPY.step4Instruction}</p>

              <div className="mt-8">
                <button 
                  type="button" 
                  className="btn-skip" 
                  onClick={handleResendEmail}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : COPY.step4Resend}
                </button>
              </div>

              <button type="button" className="back-link" onClick={goBack}>
                Wrong email? Go back
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
