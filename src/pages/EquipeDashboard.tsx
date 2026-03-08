import { useEffect, useState, useMemo, useCallback } from 'react';
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
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import {
  Globe, Target, Users, Search, Megaphone, Share2, Store, BarChart3,
  AlertTriangle, Clock, CalendarDays, TrendingUp, ArrowUpRight, ArrowDownRight,
  Zap, Hash, Link2, ExternalLink, MoveUp, MoveDown, Minus, Star, MapPin,
  Phone, Eye, Activity, Percent, ListTodo, FileText, UserX, PhoneCall,
  Sparkles, CheckCircle2, Loader2
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
interface TarefaPendente { id: string; titulo: string; status: string; prioridade: string | null; cliente_id: string; updated_at: string; }
interface ContatoAtivacao { id: string; nome: string; telefone: string | null; email: string | null; status: string; proximo_contato: string | null; motivo_inatividade: string | null; whatsapp: string | null; }

// ─── Constants ───
const COLORS = ['hsl(42, 70%, 55%)', 'hsl(160, 50%, 45%)', 'hsl(262, 40%, 55%)', 'hsl(200, 60%, 50%)', 'hsl(340, 55%, 55%)'];
const tooltipStyle = { background: 'hsl(225, 14%, 13%)', border: '1px solid hsl(225, 12%, 20%)', borderRadius: '10px', boxShadow: '0 8px 30px -8px rgb(0 0 0 / 0.5)', fontSize: '12px', color: 'hsl(210, 20%, 85%)' };
const gridStroke = 'hsl(225, 12%, 18%)';
const axisStroke = 'hsl(215, 10%, 40%)';

// ─── Alert logic ───
interface ProactiveAlert { icon: typeof AlertTriangle; color: string; bg: string; message: string; area: string; }

function generateAlerts(
  clientes: ClienteResumo[],
  clienteMap: Map<string, string>,
  allAnuncios: any[],
  allKeywords: any[],
  allTarefas: TarefaPendente[],
  allContatos: ContatoAtivacao[],
  allMarketing: Map<string, any[]>,
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // Tarefas com prioridade alta
  const tarefasAlta = allTarefas.filter(t => t.prioridade === 'alta' && t.status !== 'pronta');
  if (tarefasAlta.length > 0) {
    alerts.push({ icon: Zap, color: 'text-destructive', bg: 'bg-destructive/10', message: `${tarefasAlta.length} tarefa(s) de alta prioridade pendente(s)`, area: 'Tarefas' });
  }

  // Contatos para hoje
  const contatosHoje = allContatos.filter(c => c.proximo_contato && c.proximo_contato <= today && c.status === 'pendente');
  if (contatosHoje.length > 0) {
    alerts.push({ icon: PhoneCall, color: 'text-warning', bg: 'bg-warning/10', message: `${contatosHoje.length} contato(s) para ligar hoje`, area: 'Prospecção' });
  }

  // Keywords caindo de posição
  const kwCaindo = allKeywords.filter((kw: any) => kw.posicao_atual && kw.posicao_anterior && kw.posicao_atual > kw.posicao_anterior);
  if (kwCaindo.length > 0) {
    alerts.push({ icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10', message: `${kwCaindo.length} palavra(s)-chave perdendo posição`, area: 'SEO' });
  }

  // Anúncios com CTR baixo (<1%)
  const lowCtr = allAnuncios.filter((a: any) => a.impressoes > 500 && a.cliques > 0 && (a.cliques / a.impressoes) * 100 < 1);
  if (lowCtr.length > 0) {
    alerts.push({ icon: Megaphone, color: 'text-warning', bg: 'bg-warning/10', message: `${lowCtr.length} anúncio(s) com CTR abaixo de 1%`, area: 'Anúncios' });
  }

  // Anúncios expirados/expirando
  const adsExpiring = allAnuncios.filter((a: any) => a.data_fim && a.data_fim <= today && a.status === 'ativo');
  if (adsExpiring.length > 0) {
    alerts.push({ icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10', message: `${adsExpiring.length} anúncio(s) com data fim ultrapassada`, area: 'Anúncios' });
  }

  // Clientes sem relatório recente de marketing
  const currentMonth = new Date().toISOString().slice(0, 7);
  const prevMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
  clientes.forEach(c => {
    const mktData = allMarketing.get(c.id) || [];
    if (mktData.length === 0) return;
    const lastReport = mktData[mktData.length - 1];
    if (lastReport && lastReport.periodo_mes < prevMonth) {
      alerts.push({ icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted/20', message: `${c.nome}: sem relatório de marketing desde ${new Date(lastReport.periodo_mes + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}`, area: 'Marketing' });
    }
  });

  return alerts;
}

export default function EquipeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [tarefas, setTarefas] = useState<TarefaPendente[]>([]);
  const [contatos, setContatos] = useState<ContatoAtivacao[]>([]);
  const [allAnuncios, setAllAnuncios] = useState<Anuncio[]>([]);
  const [allKeywords, setAllKeywords] = useState<SeoKeyword[]>([]);
  const [allMarketingMap, setAllMarketingMap] = useState<Map<string, any[]>>(new Map());

  // Client reports
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [clientMarketing, setClientMarketing] = useState<MarketingReport[]>([]);
  const [clientKeywords, setClientKeywords] = useState<SeoKeyword[]>([]);
  const [clientPages, setClientPages] = useState<SeoPage[]>([]);
  const [clientAnuncios, setClientAnuncios] = useState<Anuncio[]>([]);
  const [clientSocial, setClientSocial] = useState<SocialAccount[]>([]);
  const [clientMB, setClientMB] = useState<MBProfile | null>(null);
  const [clientComp, setClientComp] = useState<MBCompetitor[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Client name map
  const clienteMap = useMemo(() => new Map(clientes.map(c => [c.id, c.nome])), [clientes]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [cRes, tRes, ctRes, anRes, kwRes] = await Promise.all([
        supabase.from('clientes').select('id, nome, status').eq('status', 'ativo').order('nome'),
        supabase.from('tarefas_cliente').select('id, titulo, status, prioridade, cliente_id, updated_at').neq('status', 'pronta').order('updated_at', { ascending: true }).limit(50),
        supabase.from('contatos_ativacao' as any).select('id, nome, telefone, email, status, proximo_contato, motivo_inatividade, whatsapp').order('proximo_contato', { ascending: true }).limit(50),
        supabase.from('anuncios').select('id, plataforma, tipo_anuncio, titulo, investimento, impressoes, cliques, conversoes, custo_total, status, data_inicio, data_fim').order('created_at', { ascending: false }).limit(200),
        supabase.from('seo_keywords').select('id, palavra_chave, posicao_atual, posicao_anterior, volume_busca, dificuldade, status, url_rankeada, cliente_id').order('posicao_atual', { ascending: true }),
      ]);
      setClientes((cRes.data || []) as ClienteResumo[]);
      setTarefas((tRes.data || []) as TarefaPendente[]);
      setContatos((ctRes.data || []) as unknown as ContatoAtivacao[]);
      setAllAnuncios((anRes.data || []) as Anuncio[]);
      setAllKeywords((kwRes.data || []) as unknown as SeoKeyword[]);

      // Fetch marketing per client for alerts
      if (cRes.data && cRes.data.length > 0) {
        const { data: mktAll } = await supabase.from('marketing_reports').select('cliente_id, periodo_mes').order('periodo_mes', { ascending: true });
        const map = new Map<string, any[]>();
        (mktAll || []).forEach((m: any) => {
          if (!map.has(m.cliente_id)) map.set(m.cliente_id, []);
          map.get(m.cliente_id)!.push(m);
        });
        setAllMarketingMap(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const fetchClientReports = useCallback(async (cid: string) => {
    if (!cid) return;
    setReportLoading(true);
    const [mkt, kw, pg, an, soc, mb, comp] = await Promise.all([
      supabase.from('marketing_reports').select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: true }),
      supabase.from('seo_keywords').select('*').eq('cliente_id', cid).order('posicao_atual', { ascending: true }),
      supabase.from('seo_pages').select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: false }),
      supabase.from('anuncios').select('*').eq('cliente_id', cid).order('created_at', { ascending: false }),
      supabase.from('social_media_accounts' as any).select('*').eq('cliente_id', cid),
      supabase.from('mybusiness_profiles' as any).select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('mybusiness_competitors' as any).select('*').eq('cliente_id', cid),
    ]);
    setClientMarketing((mkt.data || []) as MarketingReport[]);
    setClientKeywords((kw.data || []) as SeoKeyword[]);
    setClientPages((pg.data || []) as unknown as SeoPage[]);
    setClientAnuncios((an.data || []) as Anuncio[]);
    setClientSocial((soc.data || []) as unknown as SocialAccount[]);
    setClientMB(mb.data as unknown as MBProfile || null);
    setClientComp((comp.data || []) as unknown as MBCompetitor[]);
    setReportLoading(false);
  }, []);

  useEffect(() => {
    if (selectedClienteId) fetchClientReports(selectedClienteId);
  }, [selectedClienteId, fetchClientReports]);

  // Proactive alerts
  const alerts = useMemo(() => generateAlerts(clientes, clienteMap, allAnuncios, allKeywords, tarefas, contatos, allMarketingMap), [clientes, clienteMap, allAnuncios, allKeywords, tarefas, contatos, allMarketingMap]);

  // Daily work
  const today = new Date().toISOString().slice(0, 10);
  const contatosHoje = contatos.filter(c => c.proximo_contato && c.proximo_contato <= today && c.status === 'pendente');
  const tarefasUrgentes = tarefas.filter(t => t.prioridade === 'alta');
  const tarefasFazendo = tarefas.filter(t => t.status === 'fazendo');

  // Per-client summary
  const clientSummaries = useMemo(() => {
    return clientes.map(c => {
      const mktData = allMarketingMap.get(c.id);
      const latest = mktData && mktData.length > 0 ? mktData[mktData.length - 1] : null;
      const ads = allAnuncios.filter((a: any) => a.cliente_id === c.id);
      const kws = allKeywords.filter((k: any) => k.cliente_id === c.id);
      const kwTop10 = kws.filter((k: any) => k.posicao_atual && k.posicao_atual <= 10).length;
      const adsAtivos = ads.filter((a: any) => a.status === 'ativo').length;
      const tarefasPend = tarefas.filter(t => t.cliente_id === c.id).length;

      return { ...c, latestMkt: latest, totalAds: ads.length, adsAtivos, kwTotal: kws.length, kwTop10, tarefasPend };
    });
  }, [clientes, allMarketingMap, allAnuncios, allKeywords, tarefas]);

  const calcDelta = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;
  const fmtMonth = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' });

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
        {/* ═══ HEADER ═══ */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight font-display">Painel de Marketing Digital</h1>
          <p className="text-sm text-muted-foreground mt-1">Webmaster · Tráfego · Automação · {clientes.length} clientes ativos</p>
        </div>

        {/* ═══ SEÇÃO 1: PAINEL DO DIA ═══ */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20"><CalendarDays className="h-5 w-5 text-primary" /></div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight font-display">Painel do Dia</h2>
            <p className="text-xs text-muted-foreground">Prioridades e ações imediatas para hoje</p>
          </div>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StaggerItem>
            <Card className="executive-card border-l-4 border-l-destructive">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-destructive/10"><Zap className="h-4 w-4 text-destructive" /></div>
                <div><p className="text-xs text-muted-foreground">Urgentes</p><p className="text-2xl font-bold">{tarefasUrgentes.length}</p></div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="executive-card border-l-4 border-l-primary">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10"><Loader2 className="h-4 w-4 text-primary" /></div>
                <div><p className="text-xs text-muted-foreground">Em Andamento</p><p className="text-2xl font-bold">{tarefasFazendo.length}</p></div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="executive-card border-l-4 border-l-warning">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-warning/10"><PhoneCall className="h-4 w-4 text-warning" /></div>
                <div><p className="text-xs text-muted-foreground">Contatos Hoje</p><p className="text-2xl font-bold">{contatosHoje.length}</p></div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="executive-card border-l-4 border-l-accent">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10"><ListTodo className="h-4 w-4 text-accent" /></div>
                <div><p className="text-xs text-muted-foreground">Total Pendentes</p><p className="text-2xl font-bold">{tarefas.length}</p></div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Tarefas urgentes + Contatos hoje */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="executive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
                <Zap className="h-4 w-4 text-destructive" /> Tarefas Prioritárias
                <Badge variant="destructive" className="ml-auto text-[10px]">{tarefasUrgentes.length + tarefasFazendo.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {[...tarefasUrgentes, ...tarefasFazendo].length > 0 ? (
                <div className="space-y-2">
                  {[...tarefasUrgentes, ...tarefasFazendo].slice(0, 8).map(t => (
                    <div key={t.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${t.prioridade === 'alta' ? 'bg-destructive/5 border-destructive/10' : 'bg-primary/5 border-primary/10'}`}>
                      <div className={`p-1.5 rounded-lg ${t.prioridade === 'alta' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        {t.prioridade === 'alta' ? <Zap className="h-3.5 w-3.5 text-destructive" /> : <Loader2 className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.titulo}</p>
                        <p className="text-[11px] text-muted-foreground">{clienteMap.get(t.cliente_id) || 'Cliente'} · {t.status}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${t.prioridade === 'alta' ? 'text-destructive border-destructive' : 'text-primary border-primary'}`}>
                        {t.prioridade === 'alta' ? 'Urgente' : 'Fazendo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma tarefa urgente ✅</div>
              )}
            </CardContent>
          </Card>

          <Card className="executive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
                <PhoneCall className="h-4 w-4 text-warning" /> Contatos para Hoje
                <Badge className="ml-auto text-[10px] bg-warning/20 text-warning border-0">{contatosHoje.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contatosHoje.length > 0 ? (
                <div className="space-y-2">
                  {contatosHoje.slice(0, 8).map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-warning/5 border border-warning/10">
                      <div className="p-1.5 rounded-lg bg-warning/10"><PhoneCall className="h-3.5 w-3.5 text-warning" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.nome}</p>
                        <p className="text-[11px] text-muted-foreground">{c.telefone || c.email || 'Sem contato'} · {c.motivo_inatividade || 'Prospecto'}</p>
                      </div>
                      {c.whatsapp && (
                        <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">Nenhum contato agendado para hoje</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══ SEÇÃO 2: ALERTAS PROATIVOS ═══ */}
        {alerts.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-warning/10 ring-1 ring-warning/20"><AlertTriangle className="h-5 w-5 text-warning" /></div>
              <div className="flex-1">
                <h2 className="text-lg font-bold tracking-tight font-display">Alertas & Atenção</h2>
                <p className="text-xs text-muted-foreground">Pontos que precisam de ação ou monitoramento</p>
              </div>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            <Card className="mb-8 executive-card border-warning/15 bg-warning/[0.02]">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {alerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card">
                      <div className={`p-1.5 rounded-lg ${alert.bg}`}><alert.icon className={`h-3.5 w-3.5 ${alert.color}`} /></div>
                      <p className="text-sm flex-1">{alert.message}</p>
                      <Badge variant="outline" className="text-[10px]">{alert.area}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ═══ SEÇÃO 3: RESUMO POR CLIENTE ═══ */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20"><Users className="h-5 w-5 text-primary" /></div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight font-display">Performance por Cliente</h2>
            <p className="text-xs text-muted-foreground">Resumo rápido de cada cliente ativo</p>
          </div>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {clientSummaries.map(c => (
            <Card key={c.id} className="executive-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedClienteId(c.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{c.nome.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{c.adsAtivos} ads ativos · {c.kwTotal} keywords</p>
                  </div>
                  {c.tarefasPend > 0 && <Badge variant="outline" className="text-[10px] text-warning border-warning">{c.tarefasPend} tarefas</Badge>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">Top 10</p>
                    <p className="text-sm font-bold text-accent">{c.kwTop10}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">Anúncios</p>
                    <p className="text-sm font-bold">{c.totalAds}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">Leads</p>
                    <p className="text-sm font-bold">{c.latestMkt?.leads_gerados || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {clientSummaries.length === 0 && (
            <Card className="col-span-full"><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum cliente ativo encontrado.</CardContent></Card>
          )}
        </div>

        {/* ═══ SEÇÃO 4: REPORTS DETALHADOS ═══ */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20"><BarChart3 className="h-5 w-5 text-primary" /></div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight font-display">Reports Detalhados</h2>
            <p className="text-xs text-muted-foreground">Selecione um cliente para ver os relatórios completos</p>
          </div>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        <div className="mb-6">
          <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
            <SelectTrigger className="w-72 h-10"><SelectValue placeholder="Selecione um cliente..." /></SelectTrigger>
            <SelectContent>
              {clientes.map(c => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {selectedClienteId && (
          reportLoading ? (
            <div className="flex items-center justify-center h-40"><div className="text-muted-foreground animate-pulse text-sm">Carregando reports...</div></div>
          ) : (
            <Tabs defaultValue="marketing" className="space-y-6 mb-8">
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                <TabsList className="inline-flex h-auto gap-0.5 bg-transparent p-0 border-b border-border/40 w-full min-w-max">
                  {[
                    { value: 'marketing', icon: BarChart3, label: 'Marketing' },
                    { value: 'anuncios', icon: Megaphone, label: 'Anúncios' },
                    { value: 'seo', icon: Search, label: 'SEO' },
                    { value: 'social', icon: Share2, label: 'Mídias Sociais' },
                    { value: 'mybusiness', icon: Store, label: 'MyBusiness' },
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

              {/* ── MARKETING ── */}
              <TabsContent value="marketing" className="space-y-6">
                {(() => {
                  const latest = clientMarketing.length > 0 ? clientMarketing[clientMarketing.length - 1] : null;
                  const prev = clientMarketing.length > 1 ? clientMarketing[clientMarketing.length - 2] : null;
                  const trafegoData = clientMarketing.map(m => ({ mes: fmtMonth(m.periodo_mes), organico: m.visitas_organicas, pago: m.visitas_pagas, total: m.visitas_site }));
                  const leadsData = clientMarketing.map(m => ({ mes: fmtMonth(m.periodo_mes), gerados: m.leads_gerados, qualificados: m.leads_qualificados }));
                  const socialData = clientMarketing.map(m => ({ mes: fmtMonth(m.periodo_mes), seguidores: m.seguidores_total, posts: m.posts_publicados }));

                  if (!latest) return <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum relatório de marketing para este cliente.</CardContent></Card>;

                  return (
                    <>
                      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StaggerItem><Card><CardContent className="p-4"><div className="flex items-start justify-between"><div className="p-2 rounded-xl bg-primary/10"><Globe className="h-4 w-4 text-primary" /></div>{prev && <span className={`text-xs font-medium ${calcDelta(latest.visitas_site, prev.visitas_site) > 0 ? 'text-accent' : 'text-destructive'}`}>{calcDelta(latest.visitas_site, prev.visitas_site) > 0 ? '+' : ''}{calcDelta(latest.visitas_site, prev.visitas_site).toFixed(0)}%</span>}</div><div className="mt-3"><p className="text-xs text-muted-foreground">Visitas</p><p className="text-xl font-bold">{latest.visitas_site?.toLocaleString('pt-BR')}</p></div></CardContent></Card></StaggerItem>
                        <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Target className="h-4 w-4 text-primary" /></div><div className="mt-3"><p className="text-xs text-muted-foreground">Leads</p><p className="text-xl font-bold">{latest.leads_gerados}</p></div></CardContent></Card></StaggerItem>
                        <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Users className="h-4 w-4 text-primary" /></div><div className="mt-3"><p className="text-xs text-muted-foreground">Seguidores</p><p className="text-xl font-bold">{latest.seguidores_total?.toLocaleString('pt-BR')}</p></div></CardContent></Card></StaggerItem>
                        <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Percent className="h-4 w-4 text-primary" /></div><div className="mt-3"><p className="text-xs text-muted-foreground">Engajamento</p><p className="text-xl font-bold">{latest.engajamento_rate?.toFixed(1)}%</p></div></CardContent></Card></StaggerItem>
                      </StaggerContainer>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {trafegoData.length > 1 && (
                          <Card className="executive-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Tráfego</CardTitle></CardHeader><CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                              <AreaChart data={trafegoData}>
                                <defs><linearGradient id="eqGradOrg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(160, 50%, 45%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(160, 50%, 45%)" stopOpacity={0}/></linearGradient><linearGradient id="eqGradPago" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} /><XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} /><YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend fontSize={11} />
                                <Area type="monotone" dataKey="organico" name="Orgânico" stroke="hsl(160, 50%, 45%)" fill="url(#eqGradOrg)" strokeWidth={2} />
                                <Area type="monotone" dataKey="pago" name="Pago" stroke="hsl(42, 70%, 55%)" fill="url(#eqGradPago)" strokeWidth={2} />
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
                    </>
                  );
                })()}
              </TabsContent>

              {/* ── ANÚNCIOS ── */}
              <TabsContent value="anuncios" className="space-y-6">
                {clientAnuncios.length === 0 ? (
                  <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum anúncio cadastrado.</CardContent></Card>
                ) : (() => {
                  const totalInvest = clientAnuncios.reduce((s, a) => s + a.investimento, 0);
                  const totalCliq = clientAnuncios.reduce((s, a) => s + (a.cliques || 0), 0);
                  const totalConv = clientAnuncios.reduce((s, a) => s + (a.conversoes || 0), 0);
                  const totalImp = clientAnuncios.reduce((s, a) => s + (a.impressoes || 0), 0);
                  const totalCusto = clientAnuncios.reduce((s, a) => s + (a.custo_total || 0), 0);
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

              {/* ── SEO ── */}
              <TabsContent value="seo" className="space-y-6">
                {clientKeywords.length === 0 && clientPages.length === 0 ? (
                  <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum dado de SEO cadastrado.</CardContent></Card>
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

              {/* ── MÍDIAS SOCIAIS ── */}
              <TabsContent value="social" className="space-y-6">
                {clientSocial.length === 0 ? (
                  <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhuma conta de mídia social cadastrada.</CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clientSocial.map(acc => (
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

              {/* ── MYBUSINESS ── */}
              <TabsContent value="mybusiness" className="space-y-6">
                {!clientMB ? (
                  <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum perfil do Google Meu Negócio cadastrado.</CardContent></Card>
                ) : (
                  <>
                    <Card className="executive-card">
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Store className="h-4 w-4 text-primary" /> {clientMB.nome_negocio}{clientMB.categoria && <Badge variant="outline" className="ml-2 text-[10px]">{clientMB.categoria}</Badge>}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Avaliação</p><p className="text-xl font-bold flex items-center justify-center gap-1"><Star className="h-4 w-4 text-warning fill-warning" />{clientMB.avaliacao_media?.toFixed(1)}</p><p className="text-[10px] text-muted-foreground">{clientMB.total_avaliacoes} avaliações</p></div>
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Busca</p><p className="text-xl font-bold">{(clientMB.visualizacoes_busca || 0).toLocaleString('pt-BR')}</p></div>
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Maps</p><p className="text-xl font-bold">{(clientMB.visualizacoes_maps || 0).toLocaleString('pt-BR')}</p></div>
                          <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Cliques Site</p><p className="text-xl font-bold text-accent">{(clientMB.cliques_site || 0).toLocaleString('pt-BR')}</p></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
                          <div className="p-2 rounded-lg bg-muted/20"><Phone className="h-3 w-3 mx-auto mb-1" /><p className="font-medium text-foreground">{clientMB.cliques_ligacao || 0}</p><p>Ligações</p></div>
                          <div className="p-2 rounded-lg bg-muted/20"><MapPin className="h-3 w-3 mx-auto mb-1" /><p className="font-medium text-foreground">{clientMB.cliques_rota || 0}</p><p>Rotas</p></div>
                          <div className="p-2 rounded-lg bg-muted/20"><Eye className="h-3 w-3 mx-auto mb-1" /><p className="font-medium text-foreground">{clientMB.fotos_count || 0}</p><p>Fotos</p></div>
                        </div>
                        {clientMB.endereco && <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><MapPin className="h-3 w-3" />{clientMB.endereco}{clientMB.cidade ? `, ${clientMB.cidade}` : ''}</p>}
                      </CardContent>
                    </Card>
                    {clientComp.length > 0 && (
                      <Card className="executive-card">
                        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Target className="h-4 w-4 text-primary" /> Concorrentes<Badge variant="outline" className="ml-auto text-[10px]">{clientComp.length}</Badge></CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {clientComp.map(comp => (
                              <div key={comp.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{comp.nome_concorrente}</p><p className="text-[11px] text-muted-foreground">{comp.categoria || 'Sem categoria'}{comp.distancia_km ? ` · ${comp.distancia_km}km` : ''}</p></div>
                                <div className="flex items-center gap-2 text-xs shrink-0"><Star className="h-3 w-3 text-warning fill-warning" /><span className="font-bold">{comp.avaliacao_media?.toFixed(1)}</span><span className="text-muted-foreground">({comp.total_avaliacoes})</span></div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          )
        )}

      </AnimatedPage>
    </DashboardLayout>
  );
}
