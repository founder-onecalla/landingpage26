import posthog from 'posthog-js';

type AnalyticsEvent =
  | 'step1_view'
  | 'step1_complete'
  | 'step2_view'
  | 'step2_complete'
  | 'step2_skip'
  | 'step3_view'
  | 'step3_submit'
  | 'email_sent'
  | 'email_verified'
  | 'form_complete';

// Initialize PostHog
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

export const initAnalytics = (): void => {
  if (initialized || !POSTHOG_KEY) {
    if (!POSTHOG_KEY) {
      console.warn('[Analytics] PostHog key not configured');
    }
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });

  initialized = true;
  console.log('[Analytics] PostHog initialized');
};

export const track = (
  event: AnalyticsEvent | string,
  properties?: Record<string, unknown>
): void => {
  console.log('[Analytics]', event, properties);

  if (POSTHOG_KEY && initialized) {
    posthog.capture(event, properties);
  }
};

export const identify = (email: string): void => {
  if (POSTHOG_KEY && initialized) {
    posthog.identify(email, { email });
  }
};
