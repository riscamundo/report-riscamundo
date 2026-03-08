
-- Tabela para registrar status de conexões dos tenants
CREATE TABLE public.tenant_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  servico text NOT NULL, -- 'google_business', 'evolution_api', 'whatsapp', 'instagram', 'facebook', etc
  status text NOT NULL DEFAULT 'desconectado', -- 'conectado', 'desconectado', 'erro', 'pendente'
  ultima_sincronizacao timestamp with time zone,
  mensagens_enviadas integer DEFAULT 0,
  mensagens_recebidas integer DEFAULT 0,
  respostas_pendentes integer DEFAULT 0,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_connections ENABLE ROW LEVEL SECURITY;

-- Master pode gerenciar tudo
CREATE POLICY "Master can manage tenant_connections"
  ON public.tenant_connections FOR ALL
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- Equipe/Gestor pode ler
CREATE POLICY "Equipe/Gestor can read tenant_connections"
  ON public.tenant_connections FOR SELECT
  USING (has_role(auth.uid(), 'equipe'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- Clientes podem ler suas próprias conexões
CREATE POLICY "Clients can read own tenant_connections"
  ON public.tenant_connections FOR SELECT
  USING (cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid()));

-- Tabela para uploads de planilhas do Sales Manager
CREATE TABLE public.sales_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_arquivo text NOT NULL,
  tipo text NOT NULL DEFAULT 'contatos', -- 'contatos', 'email_marketing', 'whatsapp'
  status text NOT NULL DEFAULT 'pendente', -- 'pendente', 'processando', 'concluido', 'erro'
  total_registros integer DEFAULT 0,
  registros_processados integer DEFAULT 0,
  resultado jsonb,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage sales_uploads"
  ON public.sales_uploads FOR ALL
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Gestor can manage sales_uploads"
  ON public.sales_uploads FOR ALL
  USING (has_role(auth.uid(), 'gestor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role));

-- Storage bucket para planilhas
INSERT INTO storage.buckets (id, name, public) VALUES ('sales-uploads', 'sales-uploads', false);

CREATE POLICY "Authenticated can upload sales files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sales-uploads');

CREATE POLICY "Authenticated can read sales files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'sales-uploads');
