
-- Add 'cliente' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';

-- Add user_id to clientes table to link with auth
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS: clients can read their own record
CREATE POLICY "Clients can read own record" ON public.clientes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Create trigger: auto-assign 'cliente' role and link clientes on signup
CREATE OR REPLACE FUNCTION public.handle_client_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cliente_id uuid;
BEGIN
  -- Check if email matches a clientes record without user_id
  SELECT id INTO _cliente_id FROM public.clientes
    WHERE email = NEW.email AND user_id IS NULL
    LIMIT 1;

  IF _cliente_id IS NOT NULL THEN
    -- Link client record to user
    UPDATE public.clientes SET user_id = NEW.id WHERE id = _cliente_id;
    -- Assign 'cliente' role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_client
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_client_signup();

-- Create vendas_cliente view for clients to see their purchases
CREATE OR REPLACE VIEW public.vendas_cliente
WITH (security_invoker=on) AS
  SELECT v.id, v.data_venda, v.valor_venda, v.status, v.forma_pagamento,
         p.nome_procedimento, p.categoria
  FROM public.vendas v
  LEFT JOIN public.procedimentos p ON p.id = v.procedimento_vendido
  LEFT JOIN public.leads l ON l.id = v.lead_id
  LEFT JOIN public.clientes c ON c.email = (SELECT email FROM auth.users WHERE id = l.created_by)
  WHERE c.user_id = auth.uid()
     OR v.lead_id IN (
       SELECT ld.id FROM public.leads ld
       JOIN public.clientes cl ON cl.user_id = auth.uid()
     );
