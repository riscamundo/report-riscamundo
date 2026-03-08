
-- Anuncios table: stores individual ads per platform
CREATE TABLE public.anuncios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  plataforma text NOT NULL CHECK (plataforma IN ('google', 'meta', 'linkedin', 'tiktok')),
  tipo_anuncio text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  palavras_chave text[],
  investimento numeric NOT NULL DEFAULT 0,
  impressoes integer DEFAULT 0,
  cliques integer DEFAULT 0,
  conversoes integer DEFAULT 0,
  custo_total numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'ativo',
  data_inicio date,
  data_fim date,
  url_destino text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own anuncios"
  ON public.anuncios FOR SELECT
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

CREATE POLICY "Master can manage anuncios"
  ON public.anuncios FOR ALL
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_anuncios_updated_at
  BEFORE UPDATE ON public.anuncios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
