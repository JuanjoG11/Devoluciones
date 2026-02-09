-- ============================================
-- SQL for Size (Tallas) Functionality & Table Setup
-- Execute this in the Supabase SQL Editor
-- ============================================

-- 1. Create routes table if it doesn't exist (Dependency for return_items)
CREATE TABLE IF NOT EXISTS public.routes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    username TEXT,
    user_name TEXT,
    date DATE DEFAULT CURRENT_DATE,
    start_time TIME,
    end_time TIME,
    status TEXT DEFAULT 'active',
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create return_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.return_items (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT REFERENCES public.routes(id),
    invoice TEXT,
    sheet TEXT,
    product_code TEXT,
    product_name TEXT,
    quantity INTEGER,
    total NUMERIC,
    reason TEXT,
    evidence TEXT,
    is_resale BOOLEAN DEFAULT false,
    resale_customer_code TEXT,
    resale_timestamp TIMESTAMPTZ,
    verified BOOLEAN DEFAULT false,
    size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure columns exist if the table was created previously
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS is_resale BOOLEAN DEFAULT false;
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS resale_customer_code TEXT;
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS resale_timestamp TIMESTAMPTZ;
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- 4. Notify success
DO $$ 
BEGIN 
    RAISE NOTICE 'Database schema for returns and sizes verified successfully.';
END $$;
