// All user-facing copy. Do not modify without spec approval.

export const COPY = {
  // Step 1 of 3: Category (required)
  step1Title: 'What calls are you putting off?',
  step1Subtitle: 'Pick one or more, or type your own.',
  step1Placeholder: '',
  step1Button: 'Continue',
  step1Error: 'Please choose a category or type your own.',

  // Step 2 of 3: Company + Details
  step2Title: 'Tell us more',
  step2Subtitle: 'Pick companies or type your own. Add any details.',
  step2CompanyPlaceholder: 'Type another company...',
  step2DetailsPlaceholder: "What's going on? Any details help...",
  step2Button: 'Continue',
  step2Skip: 'Skip this step',

  // Step 3 of 4: Email (required)
  step3Title: 'Where should we send updates?',
  step3Placeholder: 'name@email.com',
  step3Button: 'Submit',
  step3Error: 'Please enter a valid email.',

  // Step 4 of 4: Check inbox
  step4Title: 'Check your inbox',
  step4Subtitle: 'We sent a verification link to',
  step4Instruction: 'Click the link in your email to confirm.',
  step4Resend: "Didn't get it? Resend email",

  // Done screen
  doneTitle: "You're all set!",
  doneSubtext: "We'll follow up over email with next steps.",

  // Shared
  keyboardHint: 'Press Enter to continue',

  // Verification email
  emailSubject: 'Verify your email',
  emailHeadline: 'Verify your email',
  emailBody: 'Click the button below to confirm your email and complete your submission.',
  emailButton: 'Verify my email',
  emailExpiry: 'This link expires in 24 hours.',

  // Intake Page A (Company) - for /details route
  intakeATitle: 'Which company is this call with?',
  intakeAPlaceholder: '',
  intakeAError: 'Company is required',
  intakeAButton: 'Continue',

  // Intake Page B (Details)
  intakeBTitle: "Tell us what's going on.",
  intakeBPlaceholder: 'Type a brief description here…',
  intakeBMicHelper: 'Tap to record',
  intakeBTranscriptLabel: 'Transcript',
  intakeBTranscriptHelper: 'Edit if needed.',
  intakeBTryAgain: 'Try again',
  intakeBError: 'Please describe what you need.',
  intakeBButton: 'Submit',

  // Completion screen
  completionTitle: 'Submitted',
  completionSubtext: "We'll follow up over email.",
  completionButton: 'Submit another request',
} as const;

// Call type categories for Step 1 (exact order)
export const CALL_CATEGORIES = [
  'Book or reschedule',
  'Cancel something',
  'Billing issue or dispute',
  'Status tracking',
  'Account change',
  'Fix a mistake',
  'Escalate to a support manager',
  'Other',
] as const;

// Categories organized into 3 ticker lines
export const CATEGORY_TICKER_LINE1 = ['Book or reschedule', 'Cancel a membership', 'Billing issue or dispute'] as const;
export const CATEGORY_TICKER_LINE2 = ['Status tracking', 'Account change', 'Fix a mistake'] as const;
export const CATEGORY_TICKER_LINE3 = ['Escalate to a support manager', 'Other'] as const;

// Company suggestions ticker (3 lines, exact content and order)
export const COMPANY_TICKER_LINE1 = 'GEICO · Progressive · State Farm · Allstate · Liberty Mutual · Nationwide · Farmers Insurance · Travelers · USAA · AAA Insurance · American Family Insurance · The Hartford · MetLife · Mutual of Omaha · Chubb';
export const COMPANY_TICKER_LINE2 = 'Xfinity · Spectrum · Comcast · Cox · Optimum · AT&T · Verizon · T-Mobile · Verizon Fios · AT&T Fiber · CenturyLink · Frontier · Google Fiber · DirecTV · Dish';
export const COMPANY_TICKER_LINE3 = 'Amazon · Walmart · Target · Apple · Costco · Uber · Lyft · Airbnb · Ticketmaster · StubHub · Booking.com · USPS · UPS · FedEx · Chase';

// Common cases ticker (3 lines, exact content and order)
export const CASES_TICKER_LINE1 = 'Cancel a service and avoid fees · Dispute a charge · Negotiate a bill · Ask for a refund exception · Escalate to a manager · Fix repeated billing errors · Resolve a service complaint · Request a retention offer · Challenge a penalty or late fee · Appeal a decision · Request compensation for delays · Handle a contract cancellation';
export const CASES_TICKER_LINE2 = 'Reset account access · Update payment method · Update account information · Verify identity and unlock account · Change address on file · Replace a card on file · Add or remove an authorized user · Transfer service to a new address · Confirm coverage or plan details · Check claim status with missing info · Report fraud and secure account · Submit required documents';
export const CASES_TICKER_LINE3 = 'Reschedule an appointment · Book an appointment · Cancel an appointment · Check order status · Track a delivery · Confirm store hours · Change a reservation time · Get confirmation of next steps · Set up a callback · Ask about wait time · Request a receipt · Update a booking name';
