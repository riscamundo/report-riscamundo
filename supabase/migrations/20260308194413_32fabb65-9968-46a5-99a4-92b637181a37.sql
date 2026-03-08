
-- Social media accounts per client
CREATE TABLE public.social_media_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  plataforma text NOT NULL,
  username text,
  url_perfil text,
  seguidores integer DEFAULT 0,
  seguindo integer DEFAULT 0,
  posts_total integer DEFAULT 0,
  engajamento_medio numeric DEFAULT 0,
  alcance_medio integer DEFAULT 0,
  impressoes_mes integer DEFAULT 0,
  cliques_mes integer DEFAULT 0,
  novos_seguidores_mes integer DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own social_media" ON public.social_media_accounts FOR SELECT TO authenticated
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));
CREATE POLICY "Master manage social_media" ON public.social_media_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- MyBusiness profiles
CREATE TABLE public.mybusiness_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome_negocio text NOT NULL,
  categoria text,
  endereco text,
  cidade text,
  estado text,
  telefone text,
  website text,
  avaliacao_media numeric DEFAULT 0,
  total_avaliacoes integer DEFAULT 0,
  visualizacoes_busca integer DEFAULT 0,
  visualizacoes_maps integer DEFAULT 0,
  cliques_site integer DEFAULT 0,
  cliques_ligacao integer DEFAULT 0,
  cliques_rota integer DEFAULT 0,
  fotos_count integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  periodo_mes date DEFAULT (date_trunc('month', now()))::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mybusiness_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own mybusiness" ON public.mybusiness_profiles FOR SELECT TO authenticated
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));
CREATE POLICY "Master manage mybusiness" ON public.mybusiness_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- MyBusiness competitors
CREATE TABLE public.mybusiness_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome_concorrente text NOT NULL,
  categoria text,
  avaliacao_media numeric DEFAULT 0,
  total_avaliacoes integer DEFAULT 0,
  endereco text,
  distancia_km numeric,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mybusiness_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own competitors" ON public.mybusiness_competitors FOR SELECT TO authenticated
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));
CREATE POLICY "Master manage competitors" ON public.mybusiness_competitors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- Financeiro / billing records
CREATE TABLE public.financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'mensalidade',
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  data_vencimento date NOT NULL,
  data_pagamento date,
  status text NOT NULL DEFAULT 'pendente',
  metodo_pagamento text,
  numero_boleto text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own financeiro" ON public.financeiro FOR SELECT TO authenticated
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));
CREATE POLICY "Master manage financeiro" ON public.financeiro FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- Add mensalidade_valor to clientes for default billing amount
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS mensalidade_valor numeric DEFAULT 0;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS acesso_liberado boolean DEFAULT true;
