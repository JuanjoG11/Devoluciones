-- Migration: Performance Optimizations
-- This script adds indexes and RPC functions to handle high data volumes efficiently.

-- 1. Create Indexes for faster lookups and filtering
CREATE INDEX IF NOT EXISTS idx_return_items_route_id ON public.return_items(route_id);
CREATE INDEX IF NOT EXISTS idx_return_items_created_at ON public.return_items(created_at);
CREATE INDEX IF NOT EXISTS idx_routes_date ON public.routes(date);
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(search_string gin_trgm_ops); -- Requires pg_trgm extension

-- 2. Enable pg_trgm for fuzzy search if not enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 3. Optimization: Database function for dashboard stats
-- This avoids fetching all records to just show a summary.
CREATE OR REPLACE FUNCTION get_dashboard_stats(target_date DATE)
RETURNS TABLE (
  active_routes_count BIGINT,
  total_returns_count BIGINT,
  total_returns_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.routes WHERE date = target_date) as active_routes_count,
    (SELECT COUNT(*) FROM public.return_items ri JOIN public.routes r ON ri.route_id = r.id WHERE r.date = target_date) as total_returns_count,
    (SELECT COALESCE(SUM(total), 0) FROM public.return_items ri JOIN public.routes r ON ri.route_id = r.id WHERE r.date = target_date) as total_returns_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
