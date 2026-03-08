
-- Drop old permissive SELECT policies on leads and vendas
DROP POLICY IF EXISTS "Authenticated can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated can read vendas" ON public.vendas;

-- Leads: team sees own, master sees all
CREATE POLICY "Users can read own or master reads all leads"
  ON public.leads FOR SELECT TO authenticated
  USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'master'::app_role));

-- Vendas: team sees own, master sees all
CREATE POLICY "Users can read own or master reads all vendas"
  ON public.vendas FOR SELECT TO authenticated
  USING ((vendedor = auth.uid()) OR has_role(auth.uid(), 'master'::app_role));
