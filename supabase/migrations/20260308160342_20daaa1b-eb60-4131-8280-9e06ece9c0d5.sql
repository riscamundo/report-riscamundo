
-- Create clientes table
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  razao_social text,
  cnpj text,
  email text,
  telefone text,
  endereco text,
  cidade text,
  estado text,
  status text NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Only master can manage clientes
CREATE POLICY "Master can manage clientes" ON public.clientes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- Authenticated users can read clientes (needed for dropdowns etc)
CREATE POLICY "Authenticated can read clientes" ON public.clientes FOR SELECT TO authenticated
  USING (true);
