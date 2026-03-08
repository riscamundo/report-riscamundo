-- Allow equipe and gestor users to read client marketing/performance data

-- marketing_reports
CREATE POLICY "Equipe/Gestor can read marketing_reports"
ON public.marketing_reports FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- seo_keywords
CREATE POLICY "Equipe/Gestor can read seo_keywords"
ON public.seo_keywords FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- seo_pages
CREATE POLICY "Equipe/Gestor can read seo_pages"
ON public.seo_pages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- anuncios
CREATE POLICY "Equipe/Gestor can read anuncios"
ON public.anuncios FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- social_media_accounts
CREATE POLICY "Equipe/Gestor can read social_media"
ON public.social_media_accounts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- tarefas_cliente
CREATE POLICY "Equipe/Gestor can read tarefas_cliente"
ON public.tarefas_cliente FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- contatos_ativacao
CREATE POLICY "Equipe/Gestor can read contatos_ativacao"
ON public.contatos_ativacao FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- mybusiness_profiles
CREATE POLICY "Equipe/Gestor can read mybusiness_profiles"
ON public.mybusiness_profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- mybusiness_competitors
CREATE POLICY "Equipe/Gestor can read mybusiness_competitors"
ON public.mybusiness_competitors FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- ad_studies
CREATE POLICY "Equipe/Gestor can read ad_studies"
ON public.ad_studies FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));

-- financeiro
CREATE POLICY "Equipe/Gestor can read financeiro"
ON public.financeiro FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'equipe') OR has_role(auth.uid(), 'gestor'));