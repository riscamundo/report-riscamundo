
-- Tabela de empresas para ativação
CREATE TABLE public.empresas_ativacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  telefone text,
  email text,
  site text,
  endereco text,
  cidade text,
  estado text,
  segmento text,
  observacoes text,
  status text NOT NULL DEFAULT 'ativa',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas_ativacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage empresas_ativacao"
  ON public.empresas_ativacao FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE TRIGGER update_empresas_ativacao_updated_at
  BEFORE UPDATE ON public.empresas_ativacao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar campos ao contatos_ativacao
ALTER TABLE public.contatos_ativacao
  ADD COLUMN whatsapp text,
  ADD COLUMN site text,
  ADD COLUMN empresa_id uuid REFERENCES public.empresas_ativacao(id) ON DELETE SET NULL;
