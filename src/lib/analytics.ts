type AnalyticsEvent =
  | 'step1_view'
  | 'step1_step_completed_1'
  | 'step1_step_completed_2'
  | 'step1_step_completed_3'
  | 'step1_submit'
  | 'email_sent'
  | 'step2_view'
  | 'audio_record_start'
  | 'audio_record_complete'
  | 'audio_transcribed'
  | 'step2_submit';

export const track = (
  event: AnalyticsEvent | string,
  properties?: Record<string, unknown>
): void => {
  console.log('[Analytics]', event, properties);

  // Optional: send to analytics service
  // if (window.gtag) {
  //   window.gtag('event', event, properties);
  // }
};
