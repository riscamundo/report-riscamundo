
-- Notifications table
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'info',
  titulo text NOT NULL,
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  desativada boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 days')
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage notificacoes" ON public.notificacoes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- Function to auto-create notifications
CREATE OR REPLACE FUNCTION public.notify_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _titulo text;
  _mensagem text;
  _tipo text := 'info';
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'clientes' THEN
      _titulo := 'Novo Cliente';
      _mensagem := 'Cliente "' || NEW.nome || '" foi adicionado.';
      _tipo := 'cliente';
    WHEN 'leads' THEN
      _titulo := 'Novo Lead';
      _mensagem := 'Lead "' || NEW.nome || '" foi adicionado.';
      _tipo := 'lead';
    WHEN 'vendas' THEN
      _titulo := 'Nova Venda';
      _mensagem := 'Venda de R$ ' || NEW.valor_venda || ' registrada.';
      _tipo := 'venda';
    WHEN 'anuncios' THEN
      _titulo := 'Novo Anúncio';
      _mensagem := 'Anúncio "' || NEW.titulo || '" foi criado.';
      _tipo := 'anuncio';
    WHEN 'campanhas' THEN
      _titulo := 'Nova Campanha';
      _mensagem := 'Campanha "' || NEW.nome_campanha || '" foi criada.';
      _tipo := 'campanha';
    WHEN 'contatos_ativacao' THEN
      _titulo := 'Novo Contato';
      _mensagem := 'Contato "' || NEW.nome || '" foi adicionado.';
      _tipo := 'contato';
    WHEN 'empresas_ativacao' THEN
      _titulo := 'Nova Empresa';
      _mensagem := 'Empresa "' || NEW.nome || '" foi adicionada.';
      _tipo := 'empresa';
    WHEN 'procedimentos' THEN
      _titulo := 'Novo Procedimento';
      _mensagem := 'Procedimento "' || NEW.nome_procedimento || '" foi adicionado.';
      _tipo := 'procedimento';
    ELSE
      _titulo := 'Nova atividade';
      _mensagem := 'Um novo registro foi criado em ' || TG_TABLE_NAME;
  END CASE;

  INSERT INTO public.notificacoes (tipo, titulo, mensagem) VALUES (_tipo, _titulo, _mensagem);
  RETURN NEW;
END;
$$;

-- Create triggers on key tables
CREATE TRIGGER notify_new_cliente AFTER INSERT ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.notify_on_insert();
CREATE TRIGGER notify_new_lead AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.notify_on_insert();
CREATE TRIGGER notify_new_venda AFTER INSERT ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.notify_on_insert();
CREATE TRIGGER notify_new_anuncio AFTER INSERT ON public.anuncios FOR EACH ROW EXECUTE FUNCTION public.notify_on_insert();
CREATE TRIGGER notify_new_campanha AFTER INSERT ON public.campanhas FOR EACH ROW EXECUTE FUNCTION public.notify_on_insert();
CREATE TRIGGER notify_new_contato AFTER INSERT ON public.contatos_ativacao FOR EACH ROW EXECUTE FUNCTION public.notify_on_insert();
CREATE TRIGGER notify_new_empresa AFTER INSERT ON public.empresas_ativacao FOR EACH ROW EXECUTE FUNCTION public.notify_on_insert();
CREATE TRIGGER notify_new_procedimento AFTER INSERT ON public.procedimentos FOR EACH ROW EXECUTE FUNCTION public.notify_on_insert();
