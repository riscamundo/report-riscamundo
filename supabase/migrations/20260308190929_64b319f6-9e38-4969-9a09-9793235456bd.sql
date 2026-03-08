
-- SEO Keywords tracking table
CREATE TABLE public.seo_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  palavra_chave TEXT NOT NULL,
  posicao_atual INTEGER,
  posicao_anterior INTEGER,
  volume_busca INTEGER DEFAULT 0,
  url_rankeada TEXT,
  dificuldade TEXT DEFAULT 'media',
  status TEXT DEFAULT 'monitorando',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SEO Pages tracking table
CREATE TABLE public.seo_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  titulo TEXT NOT NULL,
  visitas_mes INTEGER DEFAULT 0,
  visitas_mes_anterior INTEGER DEFAULT 0,
  posicao_media NUMERIC DEFAULT 0,
  impressoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  taxa_rejeicao NUMERIC DEFAULT 0,
  tempo_medio_pagina TEXT,
  status TEXT DEFAULT 'ativo',
  periodo_mes DATE NOT NULL DEFAULT (date_trunc('month', now()))::date,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- RLS: Clients can read own SEO data
CREATE POLICY "Clients can read own seo_keywords"
  ON public.seo_keywords FOR SELECT
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

CREATE POLICY "Clients can read own seo_pages"
  ON public.seo_pages FOR SELECT
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

-- RLS: Master can manage all SEO data
CREATE POLICY "Master can manage seo_keywords"
  ON public.seo_keywords FOR ALL
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Master can manage seo_pages"
  ON public.seo_pages FOR ALL
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Updated_at triggers
CREATE TRIGGER set_updated_at_seo_keywords
  BEFORE UPDATE ON public.seo_keywords
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_seo_pages
  BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
