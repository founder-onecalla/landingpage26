// All user-facing copy. Do not modify without spec approval.

export const COPY = {
  // Step 1 of 3: Category (required)
  step1Title: 'What call are you putting off?',
  step1Subtitle: 'Pick a category, or type your own.',
  step1Placeholder: 'Example: "cancel my gym membership"',
  step1Button: 'Continue',
  step1Error: 'Please choose a category or type your own.',

  // Step 2 of 3: Company + Details (optional)
  step2Title: 'Tell us more (optional)',
  step2Subtitle: 'This helps us handle your call faster.',
  step2CompanyPlaceholder: 'Company name',
  step2DetailsPlaceholder: "What's going on? Any details help...",
  step2Button: 'Continue',

  // Step 3 of 3: Email (required)
  step3Title: 'Where should we send updates?',
  step3Placeholder: 'name@email.com',
  step3Button: 'Submit',
  step3Error: 'Please enter a valid email.',

  // Done screen
  doneTitle: "You're all set!",
  doneSubtext: "We'll follow up over email with next steps.",

  // Shared
  keyboardHint: 'Press Enter to continue',

  // Email (for follow-up)
  emailSubject: "We're working on your call",
  emailHeadline: "We're working on your call",
  emailBody: "Thanks for submitting your request. We'll be in touch soon with updates.",
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

// Categories organized into 3 ticker lines
export const CATEGORY_TICKER_LINE1 = ['Book or reschedule', 'Cancel something', 'Billing issue or dispute'] as const;
export const CATEGORY_TICKER_LINE2 = ['Status tracking', 'Account change', 'Fix a mistake'] as const;
export const CATEGORY_TICKER_LINE3 = ['Escalate to a human', 'Other'] as const;

// Company suggestions ticker (3 lines, exact content and order)
export const COMPANY_TICKER_LINE1 = 'GEICO · Progressive · State Farm · Allstate · Liberty Mutual · Nationwide · Farmers Insurance · Travelers · USAA · AAA Insurance · American Family Insurance · The Hartford · MetLife · Mutual of Omaha · Chubb';
export const COMPANY_TICKER_LINE2 = 'Xfinity · Spectrum · Comcast · Cox · Optimum · AT&T · Verizon · T-Mobile · Verizon Fios · AT&T Fiber · CenturyLink · Frontier · Google Fiber · DirecTV · Dish';
export const COMPANY_TICKER_LINE3 = 'Amazon · Walmart · Target · Apple · Costco · Uber · Lyft · Airbnb · Ticketmaster · StubHub · Booking.com · USPS · UPS · FedEx · Chase';

// Common cases ticker (3 lines, exact content and order)
export const CASES_TICKER_LINE1 = 'Cancel a service and avoid fees · Dispute a charge · Negotiate a bill · Ask for a refund exception · Escalate to a manager · Fix repeated billing errors · Resolve a service complaint · Request a retention offer · Challenge a penalty or late fee · Appeal a decision · Request compensation for delays · Handle a contract cancellation';
export const CASES_TICKER_LINE2 = 'Reset account access · Update payment method · Update account information · Verify identity and unlock account · Change address on file · Replace a card on file · Add or remove an authorized user · Transfer service to a new address · Confirm coverage or plan details · Check claim status with missing info · Report fraud and secure account · Submit required documents';
export const CASES_TICKER_LINE3 = 'Reschedule an appointment · Book an appointment · Cancel an appointment · Check order status · Track a delivery · Confirm store hours · Change a reservation time · Get confirmation of next steps · Set up a callback · Ask about wait time · Request a receipt · Update a booking name';
