import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import {
  Globe, Target, Users, Search, Megaphone, Share2, Store, BarChart3,
  AlertTriangle, Clock, TrendingUp, ArrowUpRight,
  Zap, Hash, Link2, ExternalLink, MoveUp, MoveDown, Minus, Star, MapPin,
  Phone, Eye, Activity, Percent, ListTodo, FileText, PhoneCall,
  CheckCircle2, Loader2, LayoutDashboard
} from 'lucide-react';

// ─── Types ───
interface ClienteResumo { id: string; nome: string; status: string; }
interface MarketingReport { periodo_mes: string; visitas_site: number; visitas_organicas: number; visitas_pagas: number; leads_gerados: number; leads_qualificados: number; seguidores_total: number; novos_seguidores: number; engajamento_rate: number; posts_publicados: number; palavras_chave_top10: number; impressoes_ads: number; cliques_ads: number; custo_ads: number; conversoes_ads: number; observacoes: string | null; }
interface SeoKeyword { id: string; palavra_chave: string; posicao_atual: number | null; posicao_anterior: number | null; volume_busca: number; dificuldade: string; status: string; url_rankeada: string | null; }
interface SeoPage { id: string; url: string; titulo: string; visitas_mes: number; visitas_mes_anterior: number; posicao_media: number; impressoes: number; cliques: number; ctr: number; taxa_rejeicao: number; }
interface Anuncio { id: string; plataforma: string; tipo_anuncio: string; titulo: string; investimento: number; impressoes: number; cliques: number; conversoes: number; custo_total: number; status: string; data_inicio: string | null; data_fim: string | null; }
interface SocialAccount { id: string; plataforma: string; username: string | null; url_perfil: string | null; seguidores: number; novos_seguidores_mes: number; engajamento_medio: number; alcance_medio: number; impressoes_mes: number; cliques_mes: number; posts_total: number; }
interface MBProfile { id: string; nome_negocio: string; categoria: string | null; endereco: string | null; cidade: string | null; avaliacao_media: number; total_avaliacoes: number; visualizacoes_busca: number; visualizacoes_maps: number; cliques_site: number; cliques_ligacao: number; cliques_rota: number; fotos_count: number; }
interface MBCompetitor { id: string; nome_concorrente: string; categoria: string | null; avaliacao_media: number; total_avaliacoes: number; distancia_km: number | null; }
interface TarefaPendente { id: string; titulo: string; descricao: string | null; status: string; prioridade: string | null; cliente_id: string; updated_at: string; }

// ─── Constants ───
const tooltipStyle = { background: 'hsl(225, 14%, 13%)', border: '1px solid hsl(225, 12%, 20%)', borderRadius: '10px', boxShadow: '0 8px 30px -8px rgb(0 0 0 / 0.5)', fontSize: '12px', color: 'hsl(210, 20%, 85%)' };
const gridStroke = 'hsl(225, 12%, 18%)';
const axisStroke = 'hsl(215, 10%, 40%)';

export default function EquipeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('visao');

  // Data per selected client
  const [clientMarketing, setClientMarketing] = useState<MarketingReport[]>([]);
  const [clientKeywords, setClientKeywords] = useState<SeoKeyword[]>([]);
  const [clientPages, setClientPages] = useState<SeoPage[]>([]);
  const [clientAnuncios, setClientAnuncios] = useState<Anuncio[]>([]);
  const [clientSocial, setClientSocial] = useState<SocialAccount[]>([]);
  const [clientMB, setClientMB] = useState<MBProfile | null>(null);
  const [clientComp, setClientComp] = useState<MBCompetitor[]>([]);
  const [clientTarefas, setClientTarefas] = useState<TarefaPendente[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('clientes').select('id, nome, status').eq('status', 'ativo').order('nome');
      const list = (data || []) as ClienteResumo[];
      setClientes(list);
      if (list.length > 0) setSelectedClienteId(list[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const fetchClientData = useCallback(async (cid: string) => {
    if (!cid) return;
    setReportLoading(true);
    const [mkt, kw, pg, an, soc, mb, comp, tar] = await Promise.all([
      supabase.from('marketing_reports').select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: true }),
      supabase.from('seo_keywords').select('*').eq('cliente_id', cid).order('posicao_atual', { ascending: true }),
      supabase.from('seo_pages').select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: false }),
      supabase.from('anuncios').select('*').eq('cliente_id', cid).order('created_at', { ascending: false }),
      supabase.from('social_media_accounts' as any).select('*').eq('cliente_id', cid),
      supabase.from('mybusiness_profiles' as any).select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('mybusiness_competitors' as any).select('*').eq('cliente_id', cid),
      supabase.from('tarefas_cliente').select('*').eq('cliente_id', cid).order('updated_at', { ascending: false }),
    ]);
    setClientMarketing((mkt.data || []) as MarketingReport[]);
    setClientKeywords((kw.data || []) as SeoKeyword[]);
    setClientPages((pg.data || []) as unknown as SeoPage[]);
    setClientAnuncios((an.data || []) as Anuncio[]);
    setClientSocial((soc.data || []) as unknown as SocialAccount[]);
    setClientMB(mb.data as unknown as MBProfile || null);
    setClientComp((comp.data || []) as unknown as MBCompetitor[]);
    setClientTarefas((tar.data || []) as TarefaPendente[]);
    setReportLoading(false);
  }, []);

  useEffect(() => {
    if (selectedClienteId) fetchClientData(selectedClienteId);
  }, [selectedClienteId, fetchClientData]);

  const clienteNome = useMemo(() => clientes.find(c => c.id === selectedClienteId)?.nome || '', [clientes, selectedClienteId]);

  const calcDelta = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;
  const fmtMonth = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' });

  // Executive overview metrics
  const latest = clientMarketing.length > 0 ? clientMarketing[clientMarketing.length - 1] : null;
  const prev = clientMarketing.length > 1 ? clientMarketing[clientMarketing.length - 2] : null;
  const totalAdsAtivos = clientAnuncios.filter(a => a.status === 'ativo').length;
  const kwTop10 = clientKeywords.filter(k => k.posicao_atual && k.posicao_atual <= 10).length;
  const tarefasPend = clientTarefas.filter(t => t.status !== 'pronta').length;
  const tarefasAlta = clientTarefas.filter(t => t.prioridade === 'alta' && t.status !== 'pronta');

  // Alerts
  const alerts = useMemo(() => {
    const a: { icon: typeof AlertTriangle; color: string; bg: string; message: string }[] = [];
    const today = new Date().toISOString().slice(0, 10);

    const kwCaindo = clientKeywords.filter(kw => kw.posicao_atual && kw.posicao_anterior && kw.posicao_atual > kw.posicao_anterior);
    if (kwCaindo.length > 0) a.push({ icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10', message: `${kwCaindo.length} palavra(s)-chave perdendo posição` });

    const lowCtr = clientAnuncios.filter(ad => ad.impressoes > 500 && ad.cliques > 0 && (ad.cliques / ad.impressoes) * 100 < 1);
    if (lowCtr.length > 0) a.push({ icon: Megaphone, color: 'text-warning', bg: 'bg-warning/10', message: `${lowCtr.length} anúncio(s) com CTR abaixo de 1%` });

    const adsExpired = clientAnuncios.filter(ad => ad.data_fim && ad.data_fim <= today && ad.status === 'ativo');
    if (adsExpired.length > 0) a.push({ icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10', message: `${adsExpired.length} anúncio(s) com data fim ultrapassada` });

    if (tarefasAlta.length > 0) a.push({ icon: Zap, color: 'text-destructive', bg: 'bg-destructive/10', message: `${tarefasAlta.length} tarefa(s) de alta prioridade pendente(s)` });

    return a;
  }, [clientKeywords, clientAnuncios, tarefasAlta]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        {/* ═══ HEADER + SELETOR ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display">Painel da Equipe</h1>
            <p className="text-sm text-muted-foreground mt-1">Visualização dos dados do cliente · Somente leitura</p>
          </div>
          <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
            <SelectTrigger className="w-64 h-10">
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clientes.map(c => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {!selectedClienteId ? (
          <Card><CardContent className="p-16 text-center text-muted-foreground">Selecione um cliente para visualizar os dados.</CardContent></Card>
        ) : reportLoading ? (
          <div className="flex items-center justify-center h-60"><div className="text-muted-foreground animate-pulse text-sm">Carregando dados de {clienteNome}...</div></div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} key={selectedClienteId} className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
              <TabsList className="inline-flex h-auto gap-0.5 bg-transparent p-0 border-b border-border/40 w-full min-w-max">
                {[
                  { value: 'visao', icon: LayoutDashboard, label: 'Visão Executiva' },
                  { value: 'marketing', icon: BarChart3, label: 'Marketing Digital' },
                  { value: 'social', icon: Share2, label: 'Social Media' },
                  { value: 'anuncios', icon: Megaphone, label: 'Anúncios' },
                  { value: 'seo', icon: Search, label: 'SEO' },
                  { value: 'tarefas', icon: ListTodo, label: 'Tarefas' },
                ].map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <TabsTrigger key={tab.value} value={tab.value}
                      className="relative gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] font-medium text-muted-foreground/70 transition-all duration-200 hover:text-foreground hover:bg-muted/30 data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                      <TabIcon className="h-4 w-4" /><span className="whitespace-nowrap">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* ══════ VISÃO EXECUTIVA ══════ */}
            <TabsContent value="visao" className="space-y-6">
              {/* Alerts */}
              {alerts.length > 0 && (
                <Card className="executive-card border-warning/15 bg-warning/[0.02]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
                      <AlertTriangle className="h-4 w-4 text-warning" /> Alertas
                      <Badge className="ml-auto bg-warning/20 text-warning border-0 text-[10px]">{alerts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {alerts.map((alert, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card">
                          <div className={`p-1.5 rounded-lg ${alert.bg}`}><alert.icon className={`h-3.5 w-3.5 ${alert.color}`} /></div>
                          <p className="text-sm flex-1">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* KPIs */}
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StaggerItem>
                  <Card className="executive-card border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-xl bg-primary/10"><Globe className="h-4 w-4 text-primary" /></div>
                        {prev && latest && <span className={`text-xs font-medium ${calcDelta(latest.visitas_site, prev.visitas_site) >= 0 ? 'text-accent' : 'text-destructive'}`}>{calcDelta(latest.visitas_site, prev.visitas_site) > 0 ? '+' : ''}{calcDelta(latest.visitas_site, prev.visitas_site).toFixed(0)}%</span>}
                      </div>
                      <div className="mt-3"><p className="text-xs text-muted-foreground">Visitas ao Site</p><p className="text-xl font-bold">{latest?.visitas_site?.toLocaleString('pt-BR') || '—'}</p></div>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card className="executive-card border-l-4 border-l-accent">
                    <CardContent className="p-4">
                      <div className="p-2 rounded-xl bg-accent/10 w-fit"><Target className="h-4 w-4 text-accent" /></div>
                      <div className="mt-3"><p className="text-xs text-muted-foreground">Leads Gerados</p><p className="text-xl font-bold">{latest?.leads_gerados || '—'}</p></div>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card className="executive-card border-l-4 border-l-warning">
                    <CardContent className="p-4">
                      <div className="p-2 rounded-xl bg-warning/10 w-fit"><Megaphone className="h-4 w-4 text-warning" /></div>
                      <div className="mt-3"><p className="text-xs text-muted-foreground">Anúncios Ativos</p><p className="text-xl font-bold">{totalAdsAtivos}</p></div>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card className="executive-card border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="p-2 rounded-xl bg-primary/10 w-fit"><Search className="h-4 w-4 text-primary" /></div>
                      <div className="mt-3"><p className="text-xs text-muted-foreground">Keywords Top 10</p><p className="text-xl font-bold">{kwTop10}</p></div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>

              {/* Quick overview cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="executive-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3"><Share2 className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Social Media</p></div>
                    {clientSocial.length > 0 ? (
                      <div className="space-y-2">
                        {(clientSocial as SocialAccount[]).slice(0, 3).map(acc => (
                          <div key={acc.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{acc.plataforma}</span>
                            <span className="font-medium">{(acc.seguidores || 0).toLocaleString('pt-BR')} seg.</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted-foreground">Sem dados</p>}
                  </CardContent>
                </Card>
                <Card className="executive-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3"><Store className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Google Meu Negócio</p></div>
                    {clientMB ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Avaliação</span><span className="font-medium flex items-center gap-1"><Star className="h-3 w-3 text-warning fill-warning" />{clientMB.avaliacao_media?.toFixed(1)} ({clientMB.total_avaliacoes})</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Viz. Busca</span><span className="font-medium">{(clientMB.visualizacoes_busca || 0).toLocaleString('pt-BR')}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Cliques Site</span><span className="font-medium">{(clientMB.cliques_site || 0).toLocaleString('pt-BR')}</span></div>
                      </div>
                    ) : <p className="text-xs text-muted-foreground">Sem dados</p>}
                  </CardContent>
                </Card>
                <Card className="executive-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3"><ListTodo className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Tarefas</p></div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Pendentes</span><span className="font-medium">{tarefasPend}</span></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Alta prioridade</span><span className="font-medium text-destructive">{tarefasAlta.length}</span></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{clientTarefas.length}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Traffic chart */}
              {clientMarketing.length > 1 && (
                <Card className="executive-card">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Evolução do Tráfego</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={clientMarketing.map(m => ({ mes: fmtMonth(m.periodo_mes), organico: m.visitas_organicas, pago: m.visitas_pagas, total: m.visitas_site }))}>
                        <defs>
                          <linearGradient id="eqGradOrg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(160, 50%, 45%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(160, 50%, 45%)" stopOpacity={0}/></linearGradient>
                          <linearGradient id="eqGradPago" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                        <YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend fontSize={11} />
                        <Area type="monotone" dataKey="organico" name="Orgânico" stroke="hsl(160, 50%, 45%)" fill="url(#eqGradOrg)" strokeWidth={2} />
                        <Area type="monotone" dataKey="pago" name="Pago" stroke="hsl(42, 70%, 55%)" fill="url(#eqGradPago)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ══════ MARKETING DIGITAL ══════ */}
            <TabsContent value="marketing" className="space-y-6">
              {!latest ? (
                <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum relatório de marketing para {clienteNome}.</CardContent></Card>
              ) : (() => {
                const trafegoData = clientMarketing.map(m => ({ mes: fmtMonth(m.periodo_mes), organico: m.visitas_organicas, pago: m.visitas_pagas, total: m.visitas_site }));
                const leadsData = clientMarketing.map(m => ({ mes: fmtMonth(m.periodo_mes), gerados: m.leads_gerados, qualificados: m.leads_qualificados }));
                return (
                  <>
                    <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StaggerItem><Card><CardContent className="p-4"><div className="flex items-start justify-between"><div className="p-2 rounded-xl bg-primary/10"><Globe className="h-4 w-4 text-primary" /></div>{prev && <span className={`text-xs font-medium ${calcDelta(latest.visitas_site, prev.visitas_site) >= 0 ? 'text-accent' : 'text-destructive'}`}>{calcDelta(latest.visitas_site, prev.visitas_site) > 0 ? '+' : ''}{calcDelta(latest.visitas_site, prev.visitas_site).toFixed(0)}%</span>}</div><div className="mt-3"><p className="text-xs text-muted-foreground">Visitas</p><p className="text-xl font-bold">{latest.visitas_site?.toLocaleString('pt-BR')}</p></div></CardContent></Card></StaggerItem>
                      <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Target className="h-4 w-4 text-primary" /></div><div className="mt-3"><p className="text-xs text-muted-foreground">Leads</p><p className="text-xl font-bold">{latest.leads_gerados}</p></div></CardContent></Card></StaggerItem>
                      <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Users className="h-4 w-4 text-primary" /></div><div className="mt-3"><p className="text-xs text-muted-foreground">Seguidores</p><p className="text-xl font-bold">{latest.seguidores_total?.toLocaleString('pt-BR')}</p></div></CardContent></Card></StaggerItem>
                      <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Percent className="h-4 w-4 text-primary" /></div><div className="mt-3"><p className="text-xs text-muted-foreground">Engajamento</p><p className="text-xl font-bold">{latest.engajamento_rate?.toFixed(1)}%</p></div></CardContent></Card></StaggerItem>
                    </StaggerContainer>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {trafegoData.length > 1 && (
                        <Card className="executive-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Tráfego</CardTitle></CardHeader><CardContent>
                          <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={trafegoData}>
                              <defs><linearGradient id="mktGradOrg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(160, 50%, 45%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(160, 50%, 45%)" stopOpacity={0}/></linearGradient><linearGradient id="mktGradPago" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0}/></linearGradient></defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} /><XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} /><YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend fontSize={11} />
                              <Area type="monotone" dataKey="organico" name="Orgânico" stroke="hsl(160, 50%, 45%)" fill="url(#mktGradOrg)" strokeWidth={2} />
                              <Area type="monotone" dataKey="pago" name="Pago" stroke="hsl(42, 70%, 55%)" fill="url(#mktGradPago)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent></Card>
                      )}
                      {leadsData.length > 1 && (
                        <Card className="executive-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Leads</CardTitle></CardHeader><CardContent>
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={leadsData}>
                              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} /><XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} /><YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend fontSize={11} />
                              <Bar dataKey="gerados" name="Gerados" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={16} />
                              <Bar dataKey="qualificados" name="Qualificados" fill="hsl(160, 50%, 45%)" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent></Card>
                      )}
                    </div>
                    {latest.observacoes && (
                      <Card className="executive-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Observações</p><p className="text-sm">{latest.observacoes}</p></CardContent></Card>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            {/* ══════ SOCIAL MEDIA ══════ */}
            <TabsContent value="social" className="space-y-6">
              {clientSocial.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhuma conta de mídia social cadastrada para {clienteNome}.</CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(clientSocial as SocialAccount[]).map(acc => (
                    <Card key={acc.id} className="executive-card">
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Share2 className="h-4 w-4 text-primary" /> {acc.plataforma}{acc.username && <span className="text-xs text-muted-foreground font-normal">@{acc.username}</span>}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Seguidores</p><p className="text-lg font-bold">{(acc.seguidores || 0).toLocaleString('pt-BR')}</p></div>
                          <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Novos/Mês</p><p className="text-lg font-bold text-accent">+{(acc.novos_seguidores_mes || 0).toLocaleString('pt-BR')}</p></div>
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Engajamento</p><p className="text-lg font-bold">{(acc.engajamento_medio || 0).toFixed(1)}%</p></div>
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Alcance</p><p className="text-lg font-bold">{(acc.alcance_medio || 0).toLocaleString('pt-BR')}</p></div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                          <div><p className="font-medium text-foreground">{acc.posts_total || 0}</p><p>Posts</p></div>
                          <div><p className="font-medium text-foreground">{(acc.impressoes_mes || 0).toLocaleString('pt-BR')}</p><p>Impressões</p></div>
                          <div><p className="font-medium text-foreground">{(acc.cliques_mes || 0).toLocaleString('pt-BR')}</p><p>Cliques</p></div>
                        </div>
                        {acc.url_perfil && <a href={acc.url_perfil} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-primary flex items-center gap-1 hover:underline"><ExternalLink className="h-3 w-3" />Ver perfil</a>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ══════ ANÚNCIOS ══════ */}
            <TabsContent value="anuncios" className="space-y-6">
              {clientAnuncios.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum anúncio cadastrado para {clienteNome}.</CardContent></Card>
              ) : (() => {
                const totalInvest = clientAnuncios.reduce((s, a) => s + a.investimento, 0);
                const totalCliq = clientAnuncios.reduce((s, a) => s + (a.cliques || 0), 0);
                const totalConv = clientAnuncios.reduce((s, a) => s + (a.conversoes || 0), 0);
                const totalImp = clientAnuncios.reduce((s, a) => s + (a.impressoes || 0), 0);
                const byPlatform: Record<string, Anuncio[]> = {};
                clientAnuncios.forEach(a => { if (!byPlatform[a.plataforma]) byPlatform[a.plataforma] = []; byPlatform[a.plataforma].push(a); });

                return (
                  <>
                    <Card className="executive-card bg-gradient-to-br from-primary/5 via-card to-accent/5 border-primary/20">
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Activity className="h-4 w-4 text-primary" /> Análise Geral<Badge className="ml-auto bg-primary/10 text-primary border-0 text-[10px]">{clientAnuncios.length} anúncios</Badge></CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase mb-1">Investimento</p><p className="text-lg font-bold text-primary">R$ {totalInvest.toLocaleString('pt-BR')}</p></div>
                          <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase mb-1">Impressões</p><p className="text-lg font-bold">{totalImp.toLocaleString('pt-BR')}</p></div>
                          <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase mb-1">Cliques</p><p className="text-lg font-bold">{totalCliq.toLocaleString('pt-BR')}</p></div>
                          <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase mb-1">CTR</p><p className="text-lg font-bold">{totalImp > 0 ? ((totalCliq / totalImp) * 100).toFixed(2) : '0'}%</p></div>
                          <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase mb-1">Conversões</p><p className="text-lg font-bold text-accent">{totalConv}</p></div>
                        </div>
                      </CardContent>
                    </Card>
                    {Object.entries(byPlatform).map(([plat, ads]) => (
                      <Card key={plat} className="executive-card">
                        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Megaphone className="h-4 w-4 text-primary" /> {plat.charAt(0).toUpperCase() + plat.slice(1)}<Badge variant="outline" className="ml-auto text-[10px]">{ads.length}</Badge></CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {ads.map(a => (
                              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{a.titulo}</p><p className="text-[11px] text-muted-foreground">{a.tipo_anuncio} · R$ {a.investimento?.toLocaleString('pt-BR')}</p></div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                  <span>{(a.impressoes || 0).toLocaleString('pt-BR')} imp</span>
                                  <span>{(a.cliques || 0).toLocaleString('pt-BR')} cliques</span>
                                  <span className="text-accent font-medium">{a.conversoes || 0} conv</span>
                                  <Badge variant="outline" className={`text-[10px] ${a.status === 'ativo' ? 'text-accent border-accent' : 'text-muted-foreground'}`}>{a.status}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                );
              })()}
            </TabsContent>

            {/* ══════ SEO ══════ */}
            <TabsContent value="seo" className="space-y-6">
              {clientKeywords.length === 0 && clientPages.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum dado de SEO cadastrado para {clienteNome}.</CardContent></Card>
              ) : (
                <>
                  {clientKeywords.length > 0 && (
                    <Card className="executive-card">
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Hash className="h-4 w-4 text-primary" /> Palavras-Chave<Badge variant="outline" className="ml-auto text-[10px]">{clientKeywords.length}</Badge></CardTitle></CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b text-xs text-muted-foreground"><th className="text-left py-2 pr-4">Palavra-Chave</th><th className="text-center py-2 px-2">Posição</th><th className="text-center py-2 px-2">Anterior</th><th className="text-center py-2 px-2">Volume</th><th className="text-center py-2 px-2">Dif.</th><th className="text-left py-2 pl-2">Δ</th></tr></thead>
                            <tbody>
                              {clientKeywords.map(kw => {
                                const delta = kw.posicao_anterior && kw.posicao_atual ? kw.posicao_anterior - kw.posicao_atual : 0;
                                return (
                                  <tr key={kw.id} className="border-b border-border/30 hover:bg-muted/20">
                                    <td className="py-2 pr-4 font-medium">{kw.palavra_chave}</td>
                                    <td className="text-center py-2 px-2"><span className={`font-bold ${kw.posicao_atual && kw.posicao_atual <= 10 ? 'text-accent' : ''}`}>{kw.posicao_atual || '—'}</span></td>
                                    <td className="text-center py-2 px-2 text-muted-foreground">{kw.posicao_anterior || '—'}</td>
                                    <td className="text-center py-2 px-2">{kw.volume_busca?.toLocaleString('pt-BR')}</td>
                                    <td className="text-center py-2 px-2"><Badge variant="outline" className="text-[10px]">{kw.dificuldade}</Badge></td>
                                    <td className="py-2 pl-2 flex items-center gap-1">
                                      {delta > 0 ? <MoveUp className="h-3 w-3 text-accent" /> : delta < 0 ? <MoveDown className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3 text-muted-foreground" />}
                                      <span className={`text-xs ${delta > 0 ? 'text-accent' : delta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{delta !== 0 ? Math.abs(delta) : '='}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {clientPages.length > 0 && (
                    <Card className="executive-card">
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Link2 className="h-4 w-4 text-primary" /> Páginas<Badge variant="outline" className="ml-auto text-[10px]">{clientPages.length}</Badge></CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {clientPages.slice(0, 15).map(pg => {
                            const delta = pg.visitas_mes - (pg.visitas_mes_anterior || 0);
                            return (
                              <div key={pg.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{pg.titulo}</p><p className="text-[11px] text-muted-foreground truncate">{pg.url}</p></div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                                  <span>{pg.visitas_mes?.toLocaleString('pt-BR')} visitas</span>
                                  <span>Pos. {pg.posicao_media?.toFixed(1)}</span>
                                  <span>CTR {pg.ctr?.toFixed(1)}%</span>
                                  <span className={delta > 0 ? 'text-accent' : delta < 0 ? 'text-destructive' : ''}>{delta > 0 ? '+' : ''}{delta}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ══════ TAREFAS ══════ */}
            <TabsContent value="tarefas" className="space-y-6">
              {clientTarefas.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhuma tarefa cadastrada para {clienteNome}.</CardContent></Card>
              ) : (
                <>
                  <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StaggerItem><Card className="executive-card border-l-4 border-l-destructive"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-destructive/10"><Zap className="h-4 w-4 text-destructive" /></div><div><p className="text-xs text-muted-foreground">Alta Prioridade</p><p className="text-2xl font-bold">{clientTarefas.filter(t => t.prioridade === 'alta' && t.status !== 'pronta').length}</p></div></CardContent></Card></StaggerItem>
                    <StaggerItem><Card className="executive-card border-l-4 border-l-primary"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-primary/10"><Loader2 className="h-4 w-4 text-primary" /></div><div><p className="text-xs text-muted-foreground">Em Andamento</p><p className="text-2xl font-bold">{clientTarefas.filter(t => t.status === 'fazendo').length}</p></div></CardContent></Card></StaggerItem>
                    <StaggerItem><Card className="executive-card border-l-4 border-l-warning"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-warning/10"><Clock className="h-4 w-4 text-warning" /></div><div><p className="text-xs text-muted-foreground">Esperando</p><p className="text-2xl font-bold">{clientTarefas.filter(t => t.status === 'esperando').length}</p></div></CardContent></Card></StaggerItem>
                    <StaggerItem><Card className="executive-card border-l-4 border-l-accent"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-accent/10"><CheckCircle2 className="h-4 w-4 text-accent" /></div><div><p className="text-xs text-muted-foreground">Concluídas</p><p className="text-2xl font-bold">{clientTarefas.filter(t => t.status === 'pronta').length}</p></div></CardContent></Card></StaggerItem>
                  </StaggerContainer>

                  <Card className="executive-card">
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><ListTodo className="h-4 w-4 text-primary" /> Todas as Tarefas<Badge variant="outline" className="ml-auto text-[10px]">{clientTarefas.length}</Badge></CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {clientTarefas.map(t => (
                          <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${t.prioridade === 'alta' && t.status !== 'pronta' ? 'bg-destructive/5 border-destructive/10' : t.status === 'pronta' ? 'bg-accent/5 border-accent/10 opacity-60' : 'hover:bg-muted/20'}`}>
                            <div className={`p-1.5 rounded-lg ${t.status === 'pronta' ? 'bg-accent/10' : t.prioridade === 'alta' ? 'bg-destructive/10' : t.status === 'fazendo' ? 'bg-primary/10' : 'bg-muted/30'}`}>
                              {t.status === 'pronta' ? <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> : t.prioridade === 'alta' ? <Zap className="h-3.5 w-3.5 text-destructive" /> : t.status === 'fazendo' ? <Loader2 className="h-3.5 w-3.5 text-primary" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${t.status === 'pronta' ? 'line-through text-muted-foreground' : ''}`}>{t.titulo}</p>
                              {t.descricao && <p className="text-[11px] text-muted-foreground truncate">{t.descricao}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {t.prioridade && <Badge variant="outline" className={`text-[10px] ${t.prioridade === 'alta' ? 'text-destructive border-destructive' : t.prioridade === 'media' ? 'text-warning border-warning' : 'text-muted-foreground'}`}>{t.prioridade}</Badge>}
                              <Badge variant="outline" className={`text-[10px] ${t.status === 'pronta' ? 'text-accent border-accent' : t.status === 'fazendo' ? 'text-primary border-primary' : 'text-muted-foreground'}`}>{t.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}
