
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('master', 'equipe');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'equipe',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Master can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'master'));

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Master can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'master'));

-- Procedimentos table
CREATE TABLE public.procedimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_procedimento TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('facial', 'capilar', 'combo_premium')),
  ticket_medio NUMERIC NOT NULL DEFAULT 0,
  margem_estimada NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  prioridade_vendas TEXT NOT NULL DEFAULT 'media' CHECK (prioridade_vendas IN ('alta', 'media', 'baixa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read procedimentos" ON public.procedimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Master can manage procedimentos" ON public.procedimentos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'master'));

-- Campanhas table
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal TEXT NOT NULL,
  nome_campanha TEXT NOT NULL,
  procedimento_foco UUID REFERENCES public.procedimentos(id),
  investimento NUMERIC NOT NULL DEFAULT 0,
  periodo_inicio DATE,
  periodo_fim DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'encerrado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read campanhas" ON public.campanhas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Master can manage campanhas" ON public.campanhas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'master'));

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  origem TEXT,
  campanha_id UUID REFERENCES public.campanhas(id),
  procedimento_interesse UUID REFERENCES public.procedimentos(id),
  nivel_interesse TEXT NOT NULL DEFAULT 'medio' CHECK (nivel_interesse IN ('baixo', 'medio', 'alto')),
  status_funil TEXT NOT NULL DEFAULT 'novo' CHECK (status_funil IN ('novo', 'qualificado', 'avaliacao', 'venda', 'perdido')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Master can delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'master'));

-- Vendas table
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id),
  procedimento_vendido UUID REFERENCES public.procedimentos(id),
  valor_venda NUMERIC NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  vendedor UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'fechado' CHECK (status IN ('fechado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read vendas" ON public.vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert vendas" ON public.vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Master can manage vendas" ON public.vendas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'master'));

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_procedimentos_updated_at BEFORE UPDATE ON public.procedimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON public.campanhas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
