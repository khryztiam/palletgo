-- Forzar recarga de políticas RLS
-- Deshabilitar RLS (temporal)
ALTER TABLE public.list_users DISABLE ROW LEVEL SECURITY;

-- Esperar y reabilitar
ALTER TABLE public.list_users ENABLE ROW LEVEL SECURITY;

-- Verificar que las políticas siguen presentes
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'list_users'
ORDER BY policyname;
