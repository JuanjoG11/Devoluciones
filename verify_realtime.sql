-- Verificar configuración de Realtime
-- Ejecuta esto en Supabase SQL Editor para diagnosticar

-- 1. Verificar que las tablas están en la publicación
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 2. Verificar políticas RLS en return_items
SELECT * FROM pg_policies WHERE tablename = 'return_items';

-- 3. Verificar si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('return_items', 'routes');

-- 4. Probar inserción manual (para verificar que la tabla funciona)
-- Descomenta y ejecuta si quieres probar:
-- INSERT INTO public.return_items (route_id, invoice, product_name, quantity, total, reason)
-- VALUES (NULL, 'TEST-001', 'Producto de prueba', 1, 1000, 'Prueba realtime');
