-- SQL Script to cleanup old Base64 evidence and maintain database performance
-- This script will clear the 'evidence' column only for records that still have Base64 strings.
-- It keeps records that have URLs (Supabase Storage).

-- 1. Create a backup table (Optional but recommended)
-- CREATE TABLE return_items_backup AS SELECT * FROM return_items;

-- 2. Clear Base64 strings (starting with 'data:image') but keep URLs (starting with 'http')
UPDATE return_items
SET evidence = NULL
WHERE evidence LIKE 'data:image%';

-- 3. Optimization: Vacuum the table to reclaim space (Run this in the SQL Editor)
-- VACUUM FULL return_items;

-- Note: After running this, old returns will no longer show the photo in the admin panel, 
-- but the database size will be significantly reduced.
