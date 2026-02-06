-- ============================================
-- SQL for Products Table setup
-- Execute this in the Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price BIGINT NOT NULL,
    organization TEXT NOT NULL DEFAULT 'TAT',
    search_string TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for all authenticated users)
CREATE POLICY "Allow authenticated read access" 
ON public.products 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow admins all access
-- Replace 'admin' with your actual admin role name if different
CREATE POLICY "Allow admin all access" 
ON public.products 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Index for searches
CREATE INDEX IF NOT EXISTS idx_products_search_string ON products(search_string);
CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organization);

-- Notify that table is ready
DO $$ 
BEGIN 
    RAISE NOTICE 'Products table set up successfully.';
END $$;
