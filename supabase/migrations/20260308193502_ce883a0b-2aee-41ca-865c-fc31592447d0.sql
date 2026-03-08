
-- Drop all existing restrictive policies on anuncios
DROP POLICY IF EXISTS "Clients can read own anuncios" ON public.anuncios;
DROP POLICY IF EXISTS "Master can manage anuncios" ON public.anuncios;
DROP POLICY IF EXISTS "Clients can insert own anuncios" ON public.anuncios;

-- Recreate as PERMISSIVE (default) so at least ONE must pass
CREATE POLICY "Clients can read own anuncios"
ON public.anuncios FOR SELECT TO authenticated
USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert own anuncios"
ON public.anuncios FOR INSERT TO authenticated
WITH CHECK (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

CREATE POLICY "Master can manage anuncios"
ON public.anuncios FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'master'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));
