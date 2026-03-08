
-- 1. Add 'gestor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor' AFTER 'master';

-- 2. Create equipes table
CREATE TABLE public.equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  gestor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;

-- 3. Create equipe_members join table
CREATE TABLE public.equipe_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(equipe_id, user_id)
);

ALTER TABLE public.equipe_members ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function: check if user is gestor of another user's equipe
CREATE OR REPLACE FUNCTION public.is_gestor_of(_gestor_id uuid, _member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipe_members em
    JOIN public.equipes e ON e.id = em.equipe_id
    WHERE e.gestor_id = _gestor_id AND em.user_id = _member_id
  )
$$;

-- 5. Security definer function: check if user is in same equipe as another user
CREATE OR REPLACE FUNCTION public.in_same_equipe(_user_a uuid, _user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipe_members em1
    JOIN public.equipe_members em2 ON em1.equipe_id = em2.equipe_id
    WHERE em1.user_id = _user_a AND em2.user_id = _user_b
  )
$$;

-- 6. RLS for equipes: master sees all, gestor sees own
CREATE POLICY "Master can manage equipes" ON public.equipes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Gestor can read own equipes" ON public.equipes FOR SELECT TO authenticated
  USING (gestor_id = auth.uid());

-- 7. RLS for equipe_members: master manages, gestor reads own equipe members
CREATE POLICY "Master can manage equipe_members" ON public.equipe_members FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Gestor can read own equipe members" ON public.equipe_members FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.equipes e WHERE e.id = equipe_id AND e.gestor_id = auth.uid())
  );

CREATE POLICY "Users can read own membership" ON public.equipe_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 8. Update leads SELECT policy: add gestor visibility
DROP POLICY IF EXISTS "Users can read own or master reads all leads" ON public.leads;
CREATE POLICY "Leads visibility by role" ON public.leads FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'master'::app_role)
    OR is_gestor_of(auth.uid(), created_by)
  );

-- 9. Update vendas SELECT policy: add gestor visibility
DROP POLICY IF EXISTS "Users can read own or master reads all vendas" ON public.vendas;
CREATE POLICY "Vendas visibility by role" ON public.vendas FOR SELECT TO authenticated
  USING (
    vendedor = auth.uid()
    OR has_role(auth.uid(), 'master'::app_role)
    OR is_gestor_of(auth.uid(), vendedor)
  );

-- 10. Update leads UPDATE policy to include gestor
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can update leads" ON public.leads FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'master'::app_role)
    OR is_gestor_of(auth.uid(), created_by)
  );
