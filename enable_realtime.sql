-- Habilitar Realtime para la tabla return_items
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Habilitar replicación para return_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_items;

-- 2. Habilitar replicación para routes (para alertas de rutas finalizadas)
ALTER PUBLICATION supabase_realtime ADD TABLE public.routes;

-- 3. Verificar que se habilitaron correctamente
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
