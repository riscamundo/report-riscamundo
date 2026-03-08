
CREATE TABLE public.contatos_ativacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  origem text DEFAULT 'manual',
  motivo_inatividade text,
  ultimo_contato date,
  proximo_contato date,
  status text NOT NULL DEFAULT 'pendente',
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contatos_ativacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage contatos_ativacao"
  ON public.contatos_ativacao FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE TRIGGER update_contatos_ativacao_updated_at
  BEFORE UPDATE ON public.contatos_ativacao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
