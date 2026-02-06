-- ============================================
-- SQL to Add Verified Column to Return Items
-- Execute this in the Supabase SQL Editor
-- ============================================

-- Add verified column to return_items if it doesn't exist
ALTER TABLE public.return_items 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Add an index for quick filtering of verified/unverified returns
CREATE INDEX IF NOT EXISTS idx_return_items_verified ON return_items(verified);

-- Notify success
DO $$ 
BEGIN 
    RAISE NOTICE 'Verified column added successfully to return_items.';
END $$;
