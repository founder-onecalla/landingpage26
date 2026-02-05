# OneCalla Intake Funnel

A Typeform-style two-step lead capture funnel with voice transcription.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind
- **Backend**: Supabase (Postgres + Storage + Edge Functions)
- **Email**: Resend
- **Transcription**: OpenAI Whisper

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env

# Run dev server
npm run dev
```

## Environment Variables

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

### Edge Function Secrets (set via Supabase CLI)

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (auto-set) |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `EMAIL_FROM` | From address (e.g., `concierge@onecalla.com`) |
| `APP_BASE_URL` | Production URL (e.g., `https://intake.onecalla.com`) |
| `OPENAI_API_KEY` | OpenAI API key for Whisper transcription |
| `INTAKE_TOKEN_SECRET` | Random 32+ character string for token signing |

## Supabase Setup

### 1. Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

Or manually run the SQL from:
- `supabase/migrations/20240101000000_create_intake_tables.sql`
- `supabase/migrations/20240101000001_create_storage_bucket.sql`

### 2. Set Edge Function Secrets

```bash
# Generate a random secret for token signing
openssl rand -hex 32

# Set all secrets
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set EMAIL_FROM=concierge@onecalla.com
supabase secrets set APP_BASE_URL=https://intake.onecalla.com
supabase secrets set OPENAI_API_KEY=sk-your_key
supabase secrets set INTAKE_TOKEN_SECRET=your_random_secret
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy submit-step1
supabase functions deploy transcribe-audio
supabase functions deploy submit-step2
```

### 4. Run Edge Functions Locally (for development)

```bash
# Start local Supabase (requires Docker)
supabase start

# In a separate terminal, serve functions locally
supabase functions serve --env-file supabase/.env.local
```

Create `supabase/.env.local` with:
```
RESEND_API_KEY=re_your_key
EMAIL_FROM=concierge@onecalla.com
APP_BASE_URL=http://localhost:5173
OPENAI_API_KEY=sk-your_key
INTAKE_TOKEN_SECRET=your_random_secret
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Step 1 intake flow |
| `/concierge-intake` | Alias for Step 1 |
| `/concierge-intake/details?t=TOKEN` | Step 2 details (from email) |

## Data Flow

### Step 1: Initial Intake
1. User answers 3 questions (avoided call, help type, email)
2. Frontend calls `submit-step1` edge function
3. Edge function:
   - Inserts into `lead_intake_step1`
   - Generates signed token (step1_id + 7-day expiry)
   - Sends email via Resend with link to Step 2
4. User sees "Check your email" confirmation

### Step 2: Details Intake
1. User clicks email link with token
2. User answers 4 questions (company, description via voice/text, phone, confirm)
3. For voice:
   - Frontend records audio
   - Calls `transcribe-audio` edge function
   - Edge function uploads to Storage, calls OpenAI Whisper
   - Returns transcript for user to confirm
4. Frontend calls `submit-step2` edge function
5. Edge function:
   - Verifies token signature and expiry
   - Inserts into `lead_intake_step2`
6. User sees "Done" confirmation

## Database Schema

### lead_intake_step1
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| created_at | timestamptz | Auto-generated |
| email | text | Required |
| call_types | text[] | Required, array |
| avoided_call_text | text | Optional |
| utm_* | text | Optional tracking params |

### lead_intake_step2
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| created_at | timestamptz | Auto-generated |
| step1_id | uuid | FK to step1 |
| company | text | Required |
| description_text | text | Required |
| audio_path | text | Storage path if voice used |
| transcript_text | text | Raw transcript if voice used |
| phone | text | Optional |

## End-to-End Test

1. Start dev server: `npm run dev`
2. Open `http://localhost:5173`
3. Complete Step 1 (avoided call, call types, email)
4. Check email for link
5. Click link to open Step 2
6. Complete Step 2 (company, voice/text description, confirm)
7. Verify in Supabase:
   - `lead_intake_step1` has a row
   - `lead_intake_step2` has a row with matching `step1_id`
   - `voice-intake` bucket has audio file (if voice used)

## Security

- Tokens are HMAC-signed with `INTAKE_TOKEN_SECRET`
- Tokens expire after 7 days
- Storage bucket is private (service role only)
- RLS policies restrict direct table access
- All writes go through edge functions

## Design System

| Token | Value |
|-------|-------|
| Background | #0B0D12 |
| Primary text | #F5F7FF |
| Secondary text | #A7B0C0 |
| Accent | #7C5CFF |
| Error | #FF5C7A |
