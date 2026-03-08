
CREATE TABLE public.tarefas_cliente (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'esperando',
  prioridade TEXT DEFAULT 'media',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tarefas_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own tarefas"
  ON public.tarefas_cliente FOR SELECT
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

CREATE POLICY "Master can manage tarefas_cliente"
  ON public.tarefas_cliente FOR ALL
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE TRIGGER set_updated_at_tarefas_cliente
  BEFORE UPDATE ON public.tarefas_cliente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
