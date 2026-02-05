-- Create lead_intake_step1 table
CREATE TABLE IF NOT EXISTS lead_intake_step1 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL,
  call_types TEXT[] NOT NULL,
  avoided_call_text TEXT NULL,
  utm_source TEXT NULL,
  utm_campaign TEXT NULL,
  utm_adset TEXT NULL,
  utm_ad TEXT NULL
);

-- Create lead_intake_step2 table
CREATE TABLE IF NOT EXISTS lead_intake_step2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  step1_id UUID NOT NULL REFERENCES lead_intake_step1(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  description_text TEXT NOT NULL,
  audio_path TEXT NULL,
  transcript_text TEXT NULL,
  phone TEXT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_step1_email ON lead_intake_step1(email);
CREATE INDEX IF NOT EXISTS idx_step1_created_at ON lead_intake_step1(created_at);
CREATE INDEX IF NOT EXISTS idx_step2_step1_id ON lead_intake_step2(step1_id);

-- Enable Row Level Security
ALTER TABLE lead_intake_step1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_intake_step2 ENABLE ROW LEVEL SECURITY;

-- RLS policies for service role access (edge functions use service role)
-- These allow edge functions to read/write while blocking direct anon access
CREATE POLICY "Service role full access step1"
  ON lead_intake_step1
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access step2"
  ON lead_intake_step2
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
