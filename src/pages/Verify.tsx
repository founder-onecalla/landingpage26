import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { track, identify } from '../lib/analytics';

export function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setError('Invalid verification link.');
      track('email_verify_failed', { reason: 'no_token' });
      return;
    }

    // Decode and verify the token
    try {
      const payload = JSON.parse(atob(token));

      // Check if expired
      if (payload.exp && payload.exp < Date.now()) {
        setStatus('error');
        setError('This link has expired. Please request a new one.');
        track('email_verify_failed', { reason: 'expired' });
        return;
      }

      // Token is valid - show success
      setStatus('success');
      if (payload.email) {
        identify(payload.email);
      }
      track('email_verified');
    } catch (e) {
      setStatus('error');
      setError('Invalid verification link.');
      track('email_verify_failed', { reason: 'invalid_token' });
    }
  }, [searchParams]);

  if (status === 'verifying') {
    return (
      <div className="screen-layout">
        <div className="card">
          <div className="text-center">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
            />
            <p className="helper">Verifying...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="screen-layout">
        <div className="card">
          <div className="text-center">
            <h1 className="title">Verification failed</h1>
            <p className="subtitle">{error}</p>
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

  return (
    <div className="screen-layout">
      <div className="card">
        <div className="text-center">
          <div className="mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6C5CE7" strokeWidth="2" className="mx-auto">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="title">Email verified!</h1>
          <p className="subtitle">Thanks for confirming. We'll be in touch soon.</p>
          <div className="mt-8">
            <button className="btn-primary" onClick={() => navigate('/')}>
              Submit another request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
