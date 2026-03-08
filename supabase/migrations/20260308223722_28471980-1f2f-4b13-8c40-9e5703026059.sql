-- Allow equipe/gestor to read all vendas (read-only)
CREATE POLICY "Equipe/Gestor can read vendas"
  ON public.vendas FOR SELECT
  USING (has_role(auth.uid(), 'equipe'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- Allow equipe/gestor to read all leads
CREATE POLICY "Equipe/Gestor can read leads"
  ON public.leads FOR SELECT
  USING (has_role(auth.uid(), 'equipe'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));