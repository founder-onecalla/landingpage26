-- Add other_text column to lead_intake_step1 table
-- This stores the user's custom text when they select "Other" category

ALTER TABLE lead_intake_step1
ADD COLUMN IF NOT EXISTS other_text text;
