
-- Add cliente_id to procedimentos (nullable for backward compat with global procedimentos)
ALTER TABLE public.procedimentos ADD COLUMN cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX idx_procedimentos_cliente_id ON public.procedimentos(cliente_id);
