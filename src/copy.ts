// All user-facing copy. Do not modify without spec approval.

export const COPY = {
  // Step 1 of 2
  step1Progress: 'Step 1 of 2',
  step1Title: 'What call are you putting off?',
  step1Subtitle: 'Pick a category, or type your own.',
  step1Placeholder: 'Example: "cancel my gym membership"',
  step1Button: 'Continue',
  step1Error: 'Please choose a category or type your own.',

  // Step 2 of 2
  step2Progress: 'Step 2 of 2',
  step2Title: 'Where should we send next steps?',
  step2Placeholder: 'name@email.com',
  step2Button: 'Send me next steps',
  step2Error: 'Please enter a valid email.',

  // Confirmation screen
  confirmationText: 'Check your email for next steps.',
  confirmationLink: 'Or click here for next step',

  // Intake Page A (Company)
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

  // Shared
  keyboardHint: 'Press Enter to continue',

  // Email (locked copy)
  emailSubject: 'One quick step so we can handle your call',
  emailHeadline: 'One quick step so we can handle your call',
  emailBody: 'Thanks for reaching out. We just need a few more details to get your call handled.',
  emailButton: 'Complete 2-minute intake',
  emailExpiry: 'This link expires in 7 days.',
} as const;

// Call type categories for Step 1 (exact order)
export const CALL_CATEGORIES = [
  'Book or reschedule',
  'Cancel something',
  'Billing issue or dispute',
  'Status tracking',
  'Account change',
  'Fix a mistake',
  'Escalate to a human',
  'Other',
] as const;

// Company suggestions ticker (3 lines, exact content and order)
export const COMPANY_TICKER_LINE1 = 'GEICO · Progressive · State Farm · Allstate · Liberty Mutual · Nationwide · Farmers Insurance · Travelers · USAA · AAA Insurance · American Family Insurance · The Hartford · MetLife · Mutual of Omaha · Chubb';
export const COMPANY_TICKER_LINE2 = 'Xfinity · Spectrum · Comcast · Cox · Optimum · AT&T · Verizon · T-Mobile · Verizon Fios · AT&T Fiber · CenturyLink · Frontier · Google Fiber · DirecTV · Dish';
export const COMPANY_TICKER_LINE3 = 'Amazon · Walmart · Target · Apple · Costco · Uber · Lyft · Airbnb · Ticketmaster · StubHub · Booking.com · USPS · UPS · FedEx · Chase';

// Common cases ticker (3 lines, exact content and order)
export const CASES_TICKER_LINE1 = 'Cancel a service and avoid fees · Dispute a charge · Negotiate a bill · Ask for a refund exception · Escalate to a manager · Fix repeated billing errors · Resolve a service complaint · Request a retention offer · Challenge a penalty or late fee · Appeal a decision · Request compensation for delays · Handle a contract cancellation';
export const CASES_TICKER_LINE2 = 'Reset account access · Update payment method · Update account information · Verify identity and unlock account · Change address on file · Replace a card on file · Add or remove an authorized user · Transfer service to a new address · Confirm coverage or plan details · Check claim status with missing info · Report fraud and secure account · Submit required documents';
export const CASES_TICKER_LINE3 = 'Reschedule an appointment · Book an appointment · Cancel an appointment · Check order status · Track a delivery · Confirm store hours · Change a reservation time · Get confirmation of next steps · Set up a callback · Ask about wait time · Request a receipt · Update a booking name';
