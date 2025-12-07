-- Add meta JSONB column to usage_log table
ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS meta JSONB;
