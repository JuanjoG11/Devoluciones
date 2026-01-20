-- ============================================
-- SQL for Resale (Reventas) Functionality
-- Execute this in the Supabase SQL Editor
-- ============================================

-- Add new columns to return_items table
ALTER TABLE return_items 
ADD COLUMN IF NOT EXISTS is_resale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resale_customer_code TEXT,
ADD COLUMN IF NOT EXISTS resale_timestamp TIMESTAMPTZ;

-- Create an index to optimize the Refacturación view
CREATE INDEX IF NOT EXISTS idx_return_items_resale 
ON return_items(is_resale) 
WHERE is_resale = true;

-- Notify that columns are added
DO $$ 
BEGIN 
    RAISE NOTICE 'Resale columns added successfully to return_items table.';
END $$;
