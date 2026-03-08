
CREATE TABLE public.ad_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  plataforma text NOT NULL,
  segmento text,
  produto text,
  objetivo text DEFAULT 'Conversão',
  resultado text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own ad_studies"
ON public.ad_studies FOR SELECT TO authenticated
USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert own ad_studies"
ON public.ad_studies FOR INSERT TO authenticated
WITH CHECK (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

CREATE POLICY "Master can manage ad_studies"
ON public.ad_studies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'master'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));
