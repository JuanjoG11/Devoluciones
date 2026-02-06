-- ============================================
-- SQL to Fix Users Table Schema
-- Execute this in the Supabase SQL Editor
-- ============================================

-- 1. Add missing columns if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'auxiliar',
ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT 'TAT',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123';

-- 2. Ensure username is UNIQUE (Required for upsert to work)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- 3. Update Products Table for Soft Deletes
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Notify success
DO $$ 
BEGIN 
    RAISE NOTICE 'Database schema fixed successfully (Users and Products).';
END $$;
