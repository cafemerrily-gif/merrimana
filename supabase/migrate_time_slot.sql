-- Add time_slot column to sales table (HH:00 format, nullable for legacy records)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS time_slot TEXT;
