-- ============================================
-- Database Indexes for Production Performance
-- Execute these in Supabase SQL Editor
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

-- Index for organization filtering (if column exists)
-- CREATE INDEX IF NOT EXISTS idx_routes_organization 
-- ON routes(organization);


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

-- Index for active users (only if column exists)
-- Uncomment if you have is_active column:
-- CREATE INDEX IF NOT EXISTS idx_users_is_active 
-- ON users(is_active);

-- Composite index for organization + role (only if organization column exists)
-- Uncomment if you have organization column:
-- CREATE INDEX IF NOT EXISTS idx_users_org_role 
-- ON users(organization, role);


-- Products Table Indexes
-- ============================================

-- Index for product code searches (exact match)
CREATE INDEX IF NOT EXISTS idx_products_code 
ON products(code);

-- Full-text search index for product names (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS idx_products_name_search 
ON products USING gin(to_tsvector('spanish', name));

-- Index for search_string if it exists
-- CREATE INDEX IF NOT EXISTS idx_products_search_string 
-- ON products(search_string);


-- ============================================
-- Verify Indexes
-- ============================================
-- Run this query to verify all indexes were created:
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
*/


-- ============================================
-- Performance Statistics (Optional)
-- ============================================
-- Enable query statistics to monitor performance
-- ALTER TABLE routes SET (autovacuum_enabled = true);
-- ALTER TABLE return_items SET (autovacuum_enabled = true);
-- ALTER TABLE users SET (autovacuum_enabled = true);
-- ALTER TABLE products SET (autovacuum_enabled = true);


-- ============================================
-- Notes
-- ============================================
-- 1. These indexes will significantly improve query performance for:
--    - Dashboard loading (date-based route queries)
--    - Return item searches (by route, invoice, product)
--    - User authentication and filtering
--    - Product searches
--
-- 2. Monitor index usage with:
--    SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
--
-- 3. If any index is not being used, consider dropping it to save space
--
-- 4. Rebuild indexes periodically for optimal performance:
--    REINDEX TABLE routes;
--    REINDEX TABLE return_items;
