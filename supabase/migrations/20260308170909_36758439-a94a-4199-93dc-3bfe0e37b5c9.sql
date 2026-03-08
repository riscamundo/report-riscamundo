
-- Marketing reports table per client per month
CREATE TABLE public.marketing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  periodo_mes date NOT NULL, -- first day of month e.g. 2026-03-01
  
  -- Tráfego & SEO
  visitas_site integer DEFAULT 0,
  visitas_organicas integer DEFAULT 0,
  visitas_pagas integer DEFAULT 0,
  palavras_chave_top10 integer DEFAULT 0,
  
  -- Ads (Google + Meta)
  impressoes_ads integer DEFAULT 0,
  cliques_ads integer DEFAULT 0,
  custo_ads numeric DEFAULT 0,
  conversoes_ads integer DEFAULT 0,
  
  -- Social Media
  seguidores_total integer DEFAULT 0,
  novos_seguidores integer DEFAULT 0,
  engajamento_rate numeric DEFAULT 0, -- percentage
  posts_publicados integer DEFAULT 0,
  
  -- Leads gerados via marketing
  leads_gerados integer DEFAULT 0,
  leads_qualificados integer DEFAULT 0,
  
  -- Observações gerais
  observacoes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(cliente_id, periodo_mes)
);

ALTER TABLE public.marketing_reports ENABLE ROW LEVEL SECURITY;

-- Master can do everything
CREATE POLICY "Master can manage marketing_reports"
  ON public.marketing_reports FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- Clients can read their own reports
CREATE POLICY "Clients can read own marketing_reports"
  ON public.marketing_reports FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_marketing_reports_updated_at
  BEFORE UPDATE ON public.marketing_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
