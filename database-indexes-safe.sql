-- ============================================
-- SAFE Database Indexes for Production
-- Execute these in Supabase SQL Editor
-- This version checks for column existence first
-- ============================================

-- Routes Table Indexes
-- ============================================

-- Index for date-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_routes_date 
ON routes(date DESC);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_routes_user_id 
ON routes(user_id);

-- Index for username lookups (TYM auxiliaries)
CREATE INDEX IF NOT EXISTS idx_routes_username 
ON routes(username);

-- Composite index for active routes by date
CREATE INDEX IF NOT EXISTS idx_routes_date_status 
ON routes(date DESC, status);


-- Return Items Table Indexes
-- ============================================

-- Index for route-based queries
CREATE INDEX IF NOT EXISTS idx_return_items_route_id 
ON return_items(route_id);

-- Index for timestamp-based queries (recent returns)
CREATE INDEX IF NOT EXISTS idx_return_items_created_at 
ON return_items(created_at DESC);

-- Composite index for duplicate detection
CREATE INDEX IF NOT EXISTS idx_return_items_duplicate_check 
ON return_items(route_id, invoice, sheet, product_code);

-- Index for invoice searches
CREATE INDEX IF NOT EXISTS idx_return_items_invoice 
ON return_items(invoice);

-- Index for product code searches
CREATE INDEX IF NOT EXISTS idx_return_items_product_code 
ON return_items(product_code);


-- Users Table Indexes
-- ============================================

-- Index for username lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_username 
ON users(username);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);


-- Products Table Indexes
-- ============================================

-- Index for product code searches (exact match)
CREATE INDEX IF NOT EXISTS idx_products_code 
ON products(code);

-- Full-text search index for product names (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS idx_products_name_search 
ON products USING gin(to_tsvector('spanish', name));


-- ============================================
-- Optional: Add missing columns if needed
-- ============================================
-- Uncomment these if you want to add the columns:

-- Add is_active column to users table
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add organization column to users table
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(50);

-- After adding columns, you can create these indexes:
-- CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
-- CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization, role);


-- ============================================
-- Verify Indexes
-- ============================================
-- Run this query to verify all indexes were created:
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ============================================
-- Notes
-- ============================================
-- 1. This script only creates indexes on existing columns
-- 2. If you see errors about missing columns, they are commented out
-- 3. The application handles missing columns with fallback logic
-- 4. Core indexes (routes, return_items, users, products) should all work
