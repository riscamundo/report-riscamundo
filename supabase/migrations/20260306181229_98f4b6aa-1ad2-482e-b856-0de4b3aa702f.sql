
-- Fix leads insert policy to require created_by = auth.uid()
DROP POLICY "Authenticated can insert leads" ON public.leads;
CREATE POLICY "Authenticated can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Fix leads update - user can update leads they created, master can update all
DROP POLICY "Authenticated can update leads" ON public.leads;
CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'master'));

-- Fix vendas insert policy to require vendedor = auth.uid()
DROP POLICY "Authenticated can insert vendas" ON public.vendas;
CREATE POLICY "Authenticated can insert vendas" ON public.vendas FOR INSERT TO authenticated WITH CHECK (vendedor = auth.uid());
