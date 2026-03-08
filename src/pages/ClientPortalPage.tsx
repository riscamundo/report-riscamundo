import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import KeywordResearchAgent from '@/components/KeywordResearchAgent';
import TaskAnalyzerAgent from '@/components/TaskAnalyzerAgent';
import { toast } from 'sonner';
import {
  User, ShoppingBag, CreditCard, Clock, LogOut, CheckCircle2, AlertCircle,
  CalendarDays, DollarSign, FileText, TrendingUp, Globe, MousePointerClick,
  MessageSquare, Target, BarChart3, Users, Eye, ArrowUpRight, ArrowDownRight,
  Megaphone, Layers, Hash, Percent, Zap, PieChart as PieChartIcon,
  Search, ExternalLink, MoveUp, MoveDown, Minus, Link2,
  ListTodo, Circle, Loader2, CheckCircle, AlertTriangle, Plus, Sparkles, Send,
  MapPin, Star, Phone, Share2, Store, Activity, Wallet, Receipt, Lock, Unlock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

// ─── Types ───
interface ClienteData { id: string; nome: string; razao_social: string | null; cnpj: string | null; email: string | null; telefone: string | null; cidade: string | null; estado: string | null; status: string; }
interface VendaCliente { id: string; data_venda: string; valor_venda: number; status: string; forma_pagamento: string | null; nome_procedimento: string | null; categoria: string | null; }
interface MarketingReport { id: string; periodo_mes: string; visitas_site: number; visitas_organicas: number; visitas_pagas: number; palavras_chave_top10: number; impressoes_ads: number; cliques_ads: number; custo_ads: number; conversoes_ads: number; seguidores_total: number; novos_seguidores: number; engajamento_rate: number; posts_publicados: number; leads_gerados: number; leads_qualificados: number; observacoes: string | null; }
interface SeoKeyword { id: string; palavra_chave: string; posicao_atual: number | null; posicao_anterior: number | null; volume_busca: number; url_rankeada: string | null; dificuldade: string; status: string; }
interface SeoPage { id: string; url: string; titulo: string; visitas_mes: number; visitas_mes_anterior: number; posicao_media: number; impressoes: number; cliques: number; ctr: number; taxa_rejeicao: number; tempo_medio_pagina: string | null; status: string; periodo_mes: string; }
interface TarefaCliente { id: string; titulo: string; descricao: string | null; status: string; prioridade: string; created_at: string; updated_at: string; }
interface Anuncio { id: string; plataforma: string; tipo_anuncio: string; titulo: string; descricao: string | null; palavras_chave: string[] | null; investimento: number; impressoes: number; cliques: number; conversoes: number; custo_total: number; status: string; data_inicio: string | null; data_fim: string | null; url_destino: string | null; observacoes: string | null; created_at: string; }
interface AdStudy { id: string; plataforma: string; segmento: string | null; produto: string | null; objetivo: string | null; resultado: string; created_at: string; }
interface SocialMediaAccount { id: string; plataforma: string; username: string | null; url_perfil: string | null; seguidores: number; seguindo: number; posts_total: number; engajamento_medio: number; alcance_medio: number; impressoes_mes: number; cliques_mes: number; novos_seguidores_mes: number; observacoes: string | null; }
interface MyBusinessProfile { id: string; nome_negocio: string; categoria: string | null; endereco: string | null; cidade: string | null; estado: string | null; telefone: string | null; website: string | null; avaliacao_media: number; total_avaliacoes: number; visualizacoes_busca: number; visualizacoes_maps: number; cliques_site: number; cliques_ligacao: number; cliques_rota: number; fotos_count: number; posts_count: number; periodo_mes: string; }
interface MyBusinessCompetitor { id: string; nome_concorrente: string; categoria: string | null; avaliacao_media: number; total_avaliacoes: number; endereco: string | null; distancia_km: number | null; observacoes: string | null; }
interface FinanceiroRecord { id: string; tipo: string; descricao: string | null; valor: number; data_vencimento: string; data_pagamento: string | null; status: string; metodo_pagamento: string | null; numero_boleto: string | null; observacoes: string | null; created_at: string; }

// ─── Constants ───
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  fechado: { label: 'Concluído', color: 'text-accent', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'text-warning', icon: Clock },
  cancelado: { label: 'Cancelado', color: 'text-destructive', icon: AlertCircle },
};
const paymentLabels: Record<string, string> = { pix: 'PIX', cartao_credito: 'Cartão de Crédito', cartao_debito: 'Cartão de Débito', boleto: 'Boleto', financiamento: 'Financiamento' };
const categoriaLabels: Record<string, string> = { facial: 'Facial', capilar: 'Capilar', combo_premium: 'Combo Premium' };
const COLORS = ['hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(262, 52%, 56%)', 'hsl(38, 92%, 50%)', 'hsl(340, 75%, 55%)'];
const tooltipStyle = { background: '#fff', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', fontSize: '13px' };

type Platform = 'google' | 'meta' | 'linkedin' | 'tiktok';
const PLATFORMS: { id: Platform; label: string; color: string; icon: string; types: string[] }[] = [
  { id: 'google', label: 'Google Ads', color: 'hsl(217, 91%, 60%)', icon: '🔍', types: ['Search', 'Display', 'Shopping', 'Video (YouTube)', 'Performance Max', 'Discovery'] },
  { id: 'meta', label: 'Meta Ads', color: 'hsl(217, 89%, 50%)', icon: '📘', types: ['Imagem', 'Vídeo', 'Carrossel', 'Stories', 'Reels', 'Collection'] },
  { id: 'linkedin', label: 'LinkedIn Ads', color: 'hsl(207, 90%, 40%)', icon: '💼', types: ['Sponsored Content', 'Message Ads', 'Text Ads', 'Dynamic Ads', 'Video Ads'] },
  { id: 'tiktok', label: 'TikTok Ads', color: 'hsl(340, 75%, 55%)', icon: '🎵', types: ['In-Feed', 'TopView', 'Branded Hashtag', 'Spark Ads', 'Brand Takeover'] },
];

export default function ClientPortalPage() {
  const { user, signOut, isMaster } = useAuth();
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [vendas, setVendas] = useState<VendaCliente[]>([]);
  const [marketing, setMarketing] = useState<MarketingReport[]>([]);
  const [seoKeywords, setSeoKeywords] = useState<SeoKeyword[]>([]);
  const [seoPages, setSeoPages] = useState<SeoPage[]>([]);
  const [tarefas, setTarefas] = useState<TarefaCliente[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [adStudies, setAdStudies] = useState<AdStudy[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialMediaAccount[]>([]);
  const [mybusiness, setMybusiness] = useState<MyBusinessProfile | null>(null);
  const [competitors, setCompetitors] = useState<MyBusinessCompetitor[]>([]);
  const [financeiro, setFinanceiro] = useState<FinanceiroRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showNewTarefa, setShowNewTarefa] = useState(false);
  
  
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all');

  // New tarefa form
  const [newTarefa, setNewTarefa] = useState({ titulo: '', descricao: '', prioridade: 'media', contexto: '' });
  const [savingTarefa, setSavingTarefa] = useState(false);

  // Anuncio form removed — clients only view ads

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [clienteRes, vendasRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('vendas_cliente' as any).select('*') as any,
      ]);
      setCliente(clienteRes.data as ClienteData | null);
      setVendas((vendasRes.data || []) as VendaCliente[]);

      if (clienteRes.data?.id) {
        const cid = clienteRes.data.id;
        const [mktRes, kwRes, pgRes, tarefasRes, anunciosRes, studiesRes, socialRes, mbRes, compRes, finRes] = await Promise.all([
          supabase.from('marketing_reports').select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: true }),
          supabase.from('seo_keywords').select('*').eq('cliente_id', cid).order('posicao_atual', { ascending: true }),
          supabase.from('seo_pages').select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: false }),
          supabase.from('tarefas_cliente').select('*').eq('cliente_id', cid).order('created_at', { ascending: false }),
          supabase.from('anuncios').select('*').eq('cliente_id', cid).order('created_at', { ascending: false }),
          supabase.from('ad_studies' as any).select('*').eq('cliente_id', cid).order('created_at', { ascending: false }),
          supabase.from('social_media_accounts' as any).select('*').eq('cliente_id', cid),
          supabase.from('mybusiness_profiles' as any).select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('mybusiness_competitors' as any).select('*').eq('cliente_id', cid),
          supabase.from('financeiro' as any).select('*').eq('cliente_id', cid).order('data_vencimento', { ascending: false }),
        ]);
        setMarketing((mktRes.data || []) as MarketingReport[]);
        setSeoKeywords((kwRes.data || []) as SeoKeyword[]);
        setSeoPages((pgRes.data || []) as SeoPage[]);
        setTarefas((tarefasRes.data || []) as TarefaCliente[]);
        setAnuncios((anunciosRes.data || []) as Anuncio[]);
        setAdStudies((studiesRes.data || []) as unknown as AdStudy[]);
        setSocialAccounts((socialRes.data || []) as unknown as SocialMediaAccount[]);
        setMybusiness((mbRes.data as unknown as MyBusinessProfile) || null);
        setCompetitors((compRes.data || []) as unknown as MyBusinessCompetitor[]);
        setFinanceiro((finRes.data || []) as unknown as FinanceiroRecord[]);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // ─── Handlers ───
  const handleSaveTarefa = async () => {
    if (!cliente || !newTarefa.titulo.trim()) return;
    setSavingTarefa(true);
    const descricaoFinal = [newTarefa.contexto ? `[${newTarefa.contexto}]` : '', newTarefa.descricao].filter(Boolean).join(' ');
    const { error } = await supabase.from('tarefas_cliente').insert({
      cliente_id: cliente.id,
      titulo: newTarefa.titulo,
      descricao: descricaoFinal || null,
      prioridade: newTarefa.prioridade,
      status: 'esperando',
    });
    if (error) { toast.error('Erro ao criar tarefa'); console.error(error); }
    else {
      toast.success('Tarefa criada!');
      setShowNewTarefa(false);
      setNewTarefa({ titulo: '', descricao: '', prioridade: 'media', contexto: '' });
      // Refresh
      const { data } = await supabase.from('tarefas_cliente').select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false });
      setTarefas((data || []) as TarefaCliente[]);
    }
    setSavingTarefa(false);
  };


  // Studies per platform
  const studiesByPlatform = useMemo(() => {
    const map: Record<Platform, AdStudy[]> = { google: [], meta: [], linkedin: [], tiktok: [] };
    adStudies.forEach(s => { if (map[s.plataforma as Platform]) map[s.plataforma as Platform].push(s); });
    return map;
  }, [adStudies]);

  // ─── Derived metrics ───
  const concluidos = vendas.filter(v => v.status === 'fechado');
  const totalGasto = concluidos.reduce((s, v) => s + v.valor_venda, 0);
  const totalProcedimentos = concluidos.length;
  const pendentes = vendas.filter(v => v.status === 'pendente');
  const ticketMedio = totalProcedimentos > 0 ? totalGasto / totalProcedimentos : 0;

  const categoriaBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    concluidos.forEach(v => { const cat = v.categoria || 'outros'; if (!map[cat]) map[cat] = { count: 0, total: 0 }; map[cat].count++; map[cat].total += v.valor_venda; });
    return Object.entries(map).map(([key, val]) => ({ name: categoriaLabels[key] || key.charAt(0).toUpperCase() + key.slice(1), value: val.count, total: val.total }));
  }, [concluidos]);

  const monthlySpending = useMemo(() => {
    const map: Record<string, number> = {};
    concluidos.forEach(v => { const month = v.data_venda.slice(0, 7); map[month] = (map[month] || 0) + v.valor_venda; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ mes: new Date(month + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), valor: total }));
  }, [concluidos]);

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    concluidos.forEach(v => { const pm = v.forma_pagamento || 'outros'; map[pm] = (map[pm] || 0) + 1; });
    return Object.entries(map).map(([key, val]) => ({ name: paymentLabels[key] || key, value: val }));
  }, [concluidos]);

  // Marketing metrics
  const latestMkt = marketing.length > 0 ? marketing[marketing.length - 1] : null;
  const prevMkt = marketing.length > 1 ? marketing[marketing.length - 2] : null;
  const calcDelta = (current: number, previous: number) => { if (previous === 0) return current > 0 ? 100 : 0; return ((current - previous) / previous) * 100; };
  const formatMonth = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' });
  const formatMonthFull = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const trafegoData = marketing.map(m => ({ mes: formatMonth(m.periodo_mes), organico: m.visitas_organicas, pago: m.visitas_pagas, total: m.visitas_site }));
  const leadsData = marketing.map(m => ({ mes: formatMonth(m.periodo_mes), gerados: m.leads_gerados, qualificados: m.leads_qualificados }));
  const socialData = marketing.map(m => ({ mes: formatMonth(m.periodo_mes), seguidores: m.seguidores_total, engajamento: m.engajamento_rate, posts: m.posts_publicados }));
  const trafficPie = latestMkt ? [
    { name: 'Orgânico', value: latestMkt.visitas_organicas },
    { name: 'Pago', value: latestMkt.visitas_pagas },
    { name: 'Outros', value: Math.max(0, latestMkt.visitas_site - latestMkt.visitas_organicas - latestMkt.visitas_pagas) },
  ].filter(d => d.value > 0) : [];

  // Anúncios per platform
  const anunciosByPlatform = useMemo(() => {
    const map: Record<Platform, Anuncio[]> = { google: [], meta: [], linkedin: [], tiktok: [] };
    anuncios.forEach(a => { if (map[a.plataforma as Platform]) map[a.plataforma as Platform].push(a); });
    return map;
  }, [anuncios]);

  const platformStats = useMemo(() => {
    return PLATFORMS.map(p => {
      const ads = anunciosByPlatform[p.id];
      return {
        ...p,
        count: ads.length,
        totalInvestido: ads.reduce((s, a) => s + a.investimento, 0),
        totalCliques: ads.reduce((s, a) => s + a.cliques, 0),
        totalConversoes: ads.reduce((s, a) => s + a.conversoes, 0),
        totalImpressoes: ads.reduce((s, a) => s + a.impressoes, 0),
      };
    });
  }, [anunciosByPlatform]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 max-w-6xl mx-auto">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Helper: open create task dialog with context
  const openCreateTarefa = (contexto: string) => {
    setNewTarefa({ titulo: '', descricao: '', prioridade: 'media', contexto });
    setShowNewTarefa(true);
  };

  const CreateTaskButton = ({ contexto }: { contexto: string }) => (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => openCreateTarefa(contexto)}>
      <Plus className="h-3.5 w-3.5" /> Criar Tarefa
    </Button>
  );

  const MktKPI = ({ label, value, icon: Icon, delta, prefix }: { label: string; value: string; icon: React.ElementType; delta?: number; prefix?: string }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-xl bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
          {delta !== undefined && delta !== 0 && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${delta > 0 ? 'text-accent' : 'text-destructive'}`}>
              {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta).toFixed(0)}%
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{prefix}{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  const currentPlatformAds = activePlatform === 'all' ? anuncios : anunciosByPlatform[activePlatform];
  const currentPlatformInfo = activePlatform === 'all' ? null : PLATFORMS.find(p => p.id === activePlatform)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><User className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-sm font-bold tracking-wide">RISCAMUNDO</h1>
              <p className="text-xs text-muted-foreground">Portal do Cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{cliente?.nome || user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <AnimatedPage>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Olá, {cliente?.nome || 'Cliente'} 👋</h2>
            <p className="text-muted-foreground text-sm mt-1">Acompanhe seus resultados de marketing, anúncios e performance digital.</p>
          </div>

          {/* ═══════════ DASHBOARD SUMMARY ═══════════ */}
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StaggerItem><MktKPI label="Visitas ao Site" value={latestMkt?.visitas_site?.toLocaleString('pt-BR') || '0'} icon={Globe} delta={prevMkt ? calcDelta(latestMkt!.visitas_site, prevMkt.visitas_site) : undefined} /></StaggerItem>
            <StaggerItem><MktKPI label="Leads Gerados" value={latestMkt?.leads_gerados?.toString() || '0'} icon={Target} delta={prevMkt ? calcDelta(latestMkt!.leads_gerados, prevMkt.leads_gerados) : undefined} /></StaggerItem>
            <StaggerItem><MktKPI label="Seguidores" value={latestMkt?.seguidores_total?.toLocaleString('pt-BR') || '0'} icon={Users} delta={prevMkt ? calcDelta(latestMkt!.seguidores_total, prevMkt.seguidores_total) : undefined} /></StaggerItem>
            <StaggerItem><MktKPI label="Palavras Top 10" value={seoKeywords.filter(k => k.posicao_atual && k.posicao_atual <= 10).length.toString()} icon={Search} /></StaggerItem>
            <StaggerItem><MktKPI label="Anúncios Ativos" value={anuncios.filter(a => a.status === 'ativo').length.toString()} icon={Megaphone} /></StaggerItem>
            <StaggerItem><MktKPI label="Tarefas Pendentes" value={tarefas.filter(t => t.status !== 'pronta').length.toString()} icon={ListTodo} /></StaggerItem>
          </StaggerContainer>

          <Tabs defaultValue="marketing" className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
              <TabsList className="inline-flex h-auto gap-0.5 bg-transparent p-0 border-b border-border/40 w-full min-w-max">
                {[
                  { value: 'marketing', icon: BarChart3, label: 'Marketing' },
                  { value: 'anuncios', icon: Megaphone, label: 'Anúncios' },
                  { value: 'seo', icon: Search, label: 'SEO' },
                  { value: 'social', icon: Share2, label: 'Mídias Sociais' },
                  { value: 'mybusiness', icon: Store, label: 'MyBusiness' },
                  { value: 'tarefas', icon: ListTodo, label: 'Tarefas' },
                  { value: 'financeiro', icon: Wallet, label: 'Financeiro' },
                  { value: 'dados', icon: User, label: 'Meus Dados' },
                  { value: 'procedimentos', icon: ShoppingBag, label: 'Procedimentos' },
                ].map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="relative gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] font-medium text-muted-foreground/70 transition-all duration-200 hover:text-foreground hover:bg-muted/30 data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      <TabIcon className="h-4 w-4" />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

          {/* Quick summary charts */}
          {(latestMkt || anuncios.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trafegoData.length > 1 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Tráfego Recente</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={trafegoData.slice(-6)}>
                        <defs><linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/></linearGradient></defs>
                        <Area type="monotone" dataKey="total" stroke="hsl(217, 91%, 60%)" fill="url(#dashGrad)" strokeWidth={2} />
                        <Tooltip contentStyle={tooltipStyle} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              {leadsData.length > 1 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Leads Recentes</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={leadsData.slice(-6)}>
                        <Bar dataKey="gerados" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={14} />
                        <Bar dataKey="qualificados" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} barSize={14} />
                        <Tooltip contentStyle={tooltipStyle} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              {anuncios.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Investimento Ads</CardTitle></CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={platformStats.filter(p => p.totalInvestido > 0)} dataKey="totalInvestido" nameKey="label" cx="50%" cy="50%" outerRadius={50} innerRadius={30} paddingAngle={3} strokeWidth={0} fontSize={9}
                          label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {platformStats.filter(p => p.totalInvestido > 0).map((p, i) => <Cell key={i} fill={p.color} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}


            {/* ═══════════ TAREFAS TAB ═══════════ */}
            <TabsContent value="tarefas" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Suas Tarefas</h3>
                <Button size="sm" className="gap-1.5" onClick={() => openCreateTarefa('Tarefas')}><Plus className="h-4 w-4" /> Nova Tarefa</Button>
              </div>

              {tarefas.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ListTodo className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="text-sm font-semibold mb-1">Nenhuma tarefa ainda</h3>
                    <p className="text-sm text-muted-foreground">Clique em "Nova Tarefa" para criar sua primeira.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Tarefas KPIs */}
                  {(() => {
                    const fazendo = tarefas.filter(t => t.status === 'fazendo').length;
                    const esperando = tarefas.filter(t => t.status === 'esperando').length;
                    const pronta = tarefas.filter(t => t.status === 'pronta').length;
                    const verificar = tarefas.filter(t => t.status === 'verificar').length;
                    return (
                      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StaggerItem><Card className="border-l-4 border-l-primary"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-primary/10"><Loader2 className="h-4 w-4 text-primary" /></div><div><p className="text-xs text-muted-foreground">Fazendo</p><p className="text-xl font-bold">{fazendo}</p></div></CardContent></Card></StaggerItem>
                        <StaggerItem><Card className="border-l-4 border-l-warning"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-warning/10"><Circle className="h-4 w-4 text-warning" /></div><div><p className="text-xs text-muted-foreground">Esperando</p><p className="text-xl font-bold">{esperando}</p></div></CardContent></Card></StaggerItem>
                        <StaggerItem><Card className="border-l-4 border-l-accent"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-accent/10"><CheckCircle className="h-4 w-4 text-accent" /></div><div><p className="text-xs text-muted-foreground">Pronta</p><p className="text-xl font-bold">{pronta}</p></div></CardContent></Card></StaggerItem>
                        <StaggerItem><Card className="border-l-4 border-l-[hsl(var(--chart-3))]"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-chart-3/10"><AlertTriangle className="h-4 w-4 text-[hsl(var(--chart-3))]" /></div><div><p className="text-xs text-muted-foreground">Verificar</p><p className="text-xl font-bold">{verificar}</p></div></CardContent></Card></StaggerItem>
                      </StaggerContainer>
                    );
                  })()}

                  {/* Tarefas grouped by status */}
                  {(['fazendo', 'esperando', 'verificar', 'pronta'] as const).map(status => {
                    const items = tarefas.filter(t => t.status === status);
                    if (items.length === 0) return null;
                    const config: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
                      fazendo: { label: 'Fazendo', icon: Loader2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
                      esperando: { label: 'Esperando', icon: Circle, color: 'text-warning', bg: 'bg-warning/5 border-warning/20' },
                      pronta: { label: 'Pronta', icon: CheckCircle, color: 'text-accent', bg: 'bg-accent/5 border-accent/20' },
                      verificar: { label: 'Verificar', icon: AlertTriangle, color: 'text-[hsl(var(--chart-3))]', bg: 'bg-chart-3/5 border-[hsl(var(--chart-3))]/20' },
                    };
                    const c = config[status]; const StatusIcon = c.icon;
                    return (
                      <Card key={status}>
                        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><StatusIcon className={`h-4 w-4 ${c.color}`} /> {c.label}<Badge variant="outline" className="ml-auto text-xs">{items.length}</Badge></CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {items.map(t => (
                              <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-lg border ${c.bg} transition-colors`}>
                                <div className="flex items-start gap-3">
                                  <StatusIcon className={`h-4 w-4 ${c.color} mt-0.5 shrink-0`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{t.titulo}</p>
                                    {t.descricao && <p className="text-xs text-muted-foreground mt-1">{t.descricao}</p>}
                                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                                      <CalendarDays className="h-3 w-3" />{new Date(t.created_at).toLocaleDateString('pt-BR')}
                                      {t.prioridade && t.prioridade !== 'media' && (
                                        <Badge variant="outline" className={`text-[10px] py-0 ${t.prioridade === 'alta' ? 'text-destructive border-destructive' : 'text-muted-foreground'}`}>
                                          {t.prioridade === 'alta' ? 'Alta' : 'Baixa'}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              )}
            </TabsContent>

            {/* ═══════════ ANÚNCIOS TAB ═══════════ */}
            <TabsContent value="anuncios" className="space-y-6">
              <div className="flex justify-end"><CreateTaskButton contexto="Anúncios" /></div>
              {/* ── Análise Geral ── */}
              {anuncios.length > 0 && (() => {
                const totalInvest = anuncios.reduce((s, a) => s + a.investimento, 0);
                const totalCusto = anuncios.reduce((s, a) => s + a.custo_total, 0);
                const totalImp = anuncios.reduce((s, a) => s + a.impressoes, 0);
                const totalCliq = anuncios.reduce((s, a) => s + a.cliques, 0);
                const totalConv = anuncios.reduce((s, a) => s + a.conversoes, 0);
                const ctrGeral = totalImp > 0 ? ((totalCliq / totalImp) * 100).toFixed(2) : '0.00';
                const cpcGeral = totalCliq > 0 ? (totalCusto / totalCliq).toFixed(2) : '—';
                const cpaGeral = totalConv > 0 ? (totalCusto / totalConv).toFixed(2) : '—';
                return (
                  <Card className="bg-gradient-to-br from-primary/5 via-card to-accent/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" /> Análise Geral — Todas as Plataformas
                        <Badge className="ml-auto bg-primary/10 text-primary border-0 text-[10px]">{anuncios.length} anúncios</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Investimento</p>
                          <p className="text-lg font-bold text-primary">R$ {totalInvest.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Custo Total</p>
                          <p className="text-lg font-bold">R$ {totalCusto.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Impressões</p>
                          <p className="text-lg font-bold">{totalImp.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cliques</p>
                          <p className="text-lg font-bold">{totalCliq.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CTR</p>
                          <p className="text-lg font-bold">{ctrGeral}%</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CPC Médio</p>
                          <p className="text-lg font-bold">{cpcGeral !== '—' ? `R$ ${cpcGeral}` : '—'}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Conversões</p>
                          <p className="text-lg font-bold text-accent">{totalConv}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-lg font-semibold">Anúncios por Plataforma</h3>
              </div>

              {/* Platform filter buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activePlatform === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePlatform('all')}
                  className="text-xs gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5" /> Todas ({anuncios.length})
                </Button>
                {platformStats.map(p => (
                  <Button
                    key={p.id}
                    variant={activePlatform === p.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActivePlatform(activePlatform === p.id ? 'all' : p.id)}
                    className="text-xs gap-1.5"
                  >
                    <span>{p.icon}</span> {p.label} ({p.count})
                  </Button>
                ))}
              </div>

              {/* Platform summary cards */}
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {platformStats.map(p => (
                  <StaggerItem key={p.id}>
                    <Card className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{p.icon}</span>
                          <span className="text-sm font-semibold">{p.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <div><span className="text-muted-foreground">Anúncios:</span> <span className="font-bold">{p.count}</span></div>
                          <div><span className="text-muted-foreground">Invest:</span> <span className="font-bold">R$ {p.totalInvestido.toLocaleString('pt-BR')}</span></div>
                          <div><span className="text-muted-foreground">Cliques:</span> <span className="font-bold">{p.totalCliques.toLocaleString('pt-BR')}</span></div>
                          <div><span className="text-muted-foreground">Conv:</span> <span className="font-bold">{p.totalConversoes}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Ads list */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {currentPlatformInfo ? (
                      <><span className="text-lg">{currentPlatformInfo.icon}</span> {currentPlatformInfo.label}</>
                    ) : (
                      <><Layers className="h-4 w-4 text-primary" /> Todos os Anúncios</>
                    )}
                    <Badge variant="outline" className="ml-auto">{currentPlatformAds.length} anúncios</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentPlatformAds.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Nenhum anúncio {currentPlatformInfo ? `em ${currentPlatformInfo.label}` : ''} ainda.</p>
                      <p className="text-xs mt-1">Seus anúncios aparecerão aqui quando cadastrados.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentPlatformAds.map(ad => {
                        const ctr = ad.impressoes > 0 ? ((ad.cliques / ad.impressoes) * 100).toFixed(2) : '0.00';
                        const cpc = ad.cliques > 0 ? (ad.custo_total / ad.cliques).toFixed(2) : '—';
                        return (
                          <motion.div key={ad.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="text-sm font-semibold truncate">{ad.titulo}</p>
                                  {activePlatform === 'all' && <Badge className="text-[10px] shrink-0 bg-muted text-muted-foreground border-0">{PLATFORMS.find(p => p.id === ad.plataforma)?.icon} {PLATFORMS.find(p => p.id === ad.plataforma)?.label}</Badge>}
                                  <Badge variant="outline" className="text-[10px] shrink-0">{ad.tipo_anuncio}</Badge>
                                  <Badge variant={ad.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                                    {ad.status === 'ativo' ? 'Ativo' : ad.status === 'pausado' ? 'Pausado' : 'Finalizado'}
                                  </Badge>
                                </div>
                                {ad.descricao && <p className="text-xs text-muted-foreground mb-2">{ad.descricao}</p>}
                                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> R$ {ad.investimento.toLocaleString('pt-BR')}</span>
                                  {ad.data_inicio && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(ad.data_inicio).toLocaleDateString('pt-BR')}{ad.data_fim ? ` - ${new Date(ad.data_fim).toLocaleDateString('pt-BR')}` : ''}</span>}
                                  {ad.url_destino && <a href={ad.url_destino} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Link</a>}
                                </div>
                                {ad.palavras_chave && ad.palavras_chave.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {ad.palavras_chave.slice(0, 5).map((kw, i) => <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{kw}</Badge>)}
                                    {ad.palavras_chave.length > 5 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{ad.palavras_chave.length - 5}</Badge>}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0 space-y-1">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                                  <span className="text-muted-foreground">Imp:</span><span className="font-semibold text-right">{ad.impressoes.toLocaleString('pt-BR')}</span>
                                  <span className="text-muted-foreground">Cliques:</span><span className="font-semibold text-right">{ad.cliques.toLocaleString('pt-BR')}</span>
                                  <span className="text-muted-foreground">CTR:</span><span className="font-semibold text-right">{ctr}%</span>
                                  <span className="text-muted-foreground">CPC:</span><span className="font-semibold text-right">R$ {cpc}</span>
                                  <span className="text-muted-foreground">Conv:</span><span className="font-semibold text-right">{ad.conversoes}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* ── Saved AI studies ── */}
              {(() => {
                const currentStudies = activePlatform === 'all' ? adStudies : studiesByPlatform[activePlatform];
                if (currentStudies.length === 0) return null;
                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Estudos Salvos {currentPlatformInfo ? `— ${currentPlatformInfo.label}` : ''}
                        <Badge variant="outline" className="ml-auto">{currentStudies.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentStudies.map((study, idx) => (
                        <details key={study.id} className="group rounded-lg border p-3 hover:bg-muted/20 transition-colors">
                          <summary className="flex items-center gap-3 cursor-pointer list-none">
                            <Sparkles className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Estudo #{currentStudies.length - idx}</span>
                                {activePlatform === 'all' && <Badge variant="outline" className="text-[10px]">{study.plataforma}</Badge>}
                                {study.segmento && <Badge variant="outline" className="text-[10px]">{study.segmento}</Badge>}
                                {study.produto && <Badge variant="outline" className="text-[10px]">{study.produto}</Badge>}
                                {study.objetivo && <Badge variant="secondary" className="text-[10px]">{study.objetivo}</Badge>}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(study.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <span className="text-xs text-muted-foreground group-open:hidden">Expandir</span>
                            <span className="text-xs text-muted-foreground hidden group-open:inline">Recolher</span>
                          </summary>
                          <div className="mt-3 pt-3 border-t prose prose-sm max-w-none text-sm whitespace-pre-wrap">{study.resultado}</div>
                        </details>
                      ))}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Investment by platform chart */}
              {anuncios.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Investimento por Plataforma</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={platformStats.filter(p => p.totalInvestido > 0)} dataKey="totalInvestido" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={4} strokeWidth={0}
                            label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                            {platformStats.filter(p => p.totalInvestido > 0).map((p, i) => <Cell key={i} fill={p.color} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Performance por Plataforma</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={platformStats.filter(p => p.count > 0)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                          <XAxis dataKey="label" fontSize={10} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend fontSize={10} />
                          <Bar dataKey="totalCliques" name="Cliques" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={16} />
                          <Bar dataKey="totalConversoes" name="Conversões" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* ═══════════ SEO TAB ═══════════ */}
            <TabsContent value="seo" className="space-y-6">
              <div className="flex justify-end"><CreateTaskButton contexto="SEO" /></div>
              {/* Keyword Research Agent - only for master */}
              {isMaster && <KeywordResearchAgent clienteNome={cliente?.nome} />}

              {seoKeywords.length === 0 && seoPages.length === 0 ? (
                <Card><CardContent className="p-12 text-center"><Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><h3 className="text-sm font-semibold mb-1">SEO & Palavras-Chave</h3><p className="text-sm text-muted-foreground">Seus dados de SEO aparecerão aqui em breve.</p></CardContent></Card>
              ) : (
                <>
                  {(() => {
                    const kwTop10 = seoKeywords.filter(k => k.posicao_atual && k.posicao_atual <= 10).length;
                    const kwTop3 = seoKeywords.filter(k => k.posicao_atual && k.posicao_atual <= 3).length;
                    const kwTotal = seoKeywords.length;
                    const avgPos = seoKeywords.filter(k => k.posicao_atual).length > 0 ? seoKeywords.filter(k => k.posicao_atual).reduce((s, k) => s + (k.posicao_atual || 0), 0) / seoKeywords.filter(k => k.posicao_atual).length : 0;
                    const improved = seoKeywords.filter(k => k.posicao_atual && k.posicao_anterior && k.posicao_atual < k.posicao_anterior).length;
                    const declined = seoKeywords.filter(k => k.posicao_atual && k.posicao_anterior && k.posicao_atual > k.posicao_anterior).length;
                    return (
                      <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <StaggerItem><MktKPI label="Palavras Rastreadas" value={kwTotal.toString()} icon={Hash} /></StaggerItem>
                        <StaggerItem><MktKPI label="Top 3" value={kwTop3.toString()} icon={Target} /></StaggerItem>
                        <StaggerItem><MktKPI label="Top 10" value={kwTop10.toString()} icon={TrendingUp} /></StaggerItem>
                        <StaggerItem><MktKPI label="Posição Média" value={avgPos.toFixed(1)} icon={BarChart3} /></StaggerItem>
                        <StaggerItem><MktKPI label="Subiram" value={improved.toString()} icon={ArrowUpRight} /></StaggerItem>
                        <StaggerItem><MktKPI label="Caíram" value={declined.toString()} icon={ArrowDownRight} /></StaggerItem>
                      </StaggerContainer>
                    );
                  })()}

                  {/* Word Cloud */}
                  {seoKeywords.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Hash className="h-4 w-4 text-primary" /> Nuvem de Palavras-Chave</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center justify-center gap-2 py-4">
                          {seoKeywords.map(kw => {
                            const maxVol = Math.max(...seoKeywords.map(k => k.volume_busca || 1));
                            const ratio = (kw.volume_busca || 1) / maxVol;
                            const fontSize = Math.max(0.7, 0.7 + ratio * 1.8);
                            const opacity = Math.max(0.4, 0.3 + ratio * 0.7);
                            const posColor = !kw.posicao_atual ? 'text-muted-foreground' : kw.posicao_atual <= 3 ? 'text-accent' : kw.posicao_atual <= 10 ? 'text-primary' : kw.posicao_atual <= 20 ? 'text-foreground' : 'text-muted-foreground';
                            return (
                              <span key={kw.id} className={`${posColor} font-semibold cursor-default transition-transform hover:scale-110`} style={{ fontSize: `${fontSize}rem`, opacity }} title={`Posição: ${kw.posicao_atual || '—'} | Volume: ${kw.volume_busca}/mês`}>
                                {kw.palavra_chave}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground border-t pt-2 mt-2">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Top 3</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Top 10</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-foreground" /> Top 20</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> 20+</span>
                          <span className="ml-2">Tamanho = volume de busca</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {seoKeywords.length > 0 && (() => {
                    const distribution = [
                      { range: '1-3', count: seoKeywords.filter(k => k.posicao_atual && k.posicao_atual <= 3).length },
                      { range: '4-10', count: seoKeywords.filter(k => k.posicao_atual && k.posicao_atual > 3 && k.posicao_atual <= 10).length },
                      { range: '11-20', count: seoKeywords.filter(k => k.posicao_atual && k.posicao_atual > 10 && k.posicao_atual <= 20).length },
                      { range: '21-50', count: seoKeywords.filter(k => k.posicao_atual && k.posicao_atual > 20 && k.posicao_atual <= 50).length },
                      { range: '50+', count: seoKeywords.filter(k => k.posicao_atual && k.posicao_atual > 50).length },
                    ].filter(d => d.count > 0);
                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Distribuição de Posições</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart data={distribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                                <XAxis dataKey="range" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                                <YAxis fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} palavras`, 'Quantidade']} />
                                <Bar dataKey="count" name="Palavras" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} barSize={40} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> Por Dificuldade</CardTitle></CardHeader>
                          <CardContent className="flex items-center justify-center">
                            {(() => {
                              const diffData = [
                                { name: 'Fácil', value: seoKeywords.filter(k => k.dificuldade === 'facil').length },
                                { name: 'Média', value: seoKeywords.filter(k => k.dificuldade === 'media').length },
                                { name: 'Difícil', value: seoKeywords.filter(k => k.dificuldade === 'dificil').length },
                              ].filter(d => d.value > 0);
                              return diffData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                  <PieChart><Pie data={diffData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={4} strokeWidth={0} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>{diffData.map((_, i) => <Cell key={i} fill={[COLORS[1], COLORS[3], COLORS[0]][i]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
                                </ResponsiveContainer>
                              ) : <p className="text-xs text-muted-foreground">Sem dados</p>;
                            })()}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}

                  {seoKeywords.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Hash className="h-4 w-4 text-primary" /> Palavras-Chave Monitoradas</CardTitle></CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b bg-muted/30">
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Palavra-Chave</th>
                              <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Posição</th>
                              <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Variação</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Volume</th>
                              <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Dificuldade</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">URL</th>
                            </tr></thead>
                            <tbody>
                              {seoKeywords.map(kw => {
                                const diff = kw.posicao_anterior && kw.posicao_atual ? kw.posicao_anterior - kw.posicao_atual : 0;
                                const diffColor = diff > 0 ? 'text-accent' : diff < 0 ? 'text-destructive' : 'text-muted-foreground';
                                const DiffIcon = diff > 0 ? MoveUp : diff < 0 ? MoveDown : Minus;
                                const diffLabels: Record<string, { label: string; color: string }> = {
                                  facil: { label: 'Fácil', color: 'bg-accent/10 text-accent border-accent/30' },
                                  media: { label: 'Média', color: 'bg-warning/10 text-warning border-warning/30' },
                                  dificil: { label: 'Difícil', color: 'bg-destructive/10 text-destructive border-destructive/30' },
                                };
                                const d = diffLabels[kw.dificuldade] || diffLabels.media;
                                return (
                                  <tr key={kw.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="p-3 font-medium">{kw.palavra_chave}</td>
                                    <td className="p-3 text-center">{kw.posicao_atual ? <Badge variant="outline" className={`text-xs ${kw.posicao_atual <= 3 ? 'text-accent border-accent' : kw.posicao_atual <= 10 ? 'text-primary border-primary' : ''}`}>#{kw.posicao_atual}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                                    <td className="p-3 text-center"><span className={`inline-flex items-center gap-0.5 text-xs font-medium ${diffColor}`}><DiffIcon className="h-3 w-3" />{Math.abs(diff)}</span></td>
                                    <td className="p-3 text-right text-muted-foreground">{kw.volume_busca.toLocaleString('pt-BR')}/mês</td>
                                    <td className="p-3 text-center"><Badge variant="outline" className={`text-[10px] ${d.color}`}>{d.label}</Badge></td>
                                    <td className="p-3 hidden md:table-cell">{kw.url_rankeada ? <a href={kw.url_rankeada} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 max-w-[200px] truncate"><ExternalLink className="h-3 w-3 shrink-0" />{kw.url_rankeada.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}</a> : <span className="text-xs text-muted-foreground">—</span>}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {seoPages.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> Principais Páginas do Site</CardTitle></CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b bg-muted/30">
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Página</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Visitas</th>
                              <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Variação</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Impressões</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Cliques</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">CTR</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Pos. Média</th>
                            </tr></thead>
                            <tbody>
                              {seoPages.map(pg => {
                                const delta = pg.visitas_mes_anterior > 0 ? ((pg.visitas_mes - pg.visitas_mes_anterior) / pg.visitas_mes_anterior) * 100 : 0;
                                return (
                                  <tr key={pg.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="p-3"><div className="font-medium text-sm truncate max-w-[250px]">{pg.titulo}</div><a href={pg.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5 max-w-[250px] truncate"><ExternalLink className="h-2.5 w-2.5 shrink-0" />{pg.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 50)}</a></td>
                                    <td className="p-3 text-right font-semibold">{pg.visitas_mes.toLocaleString('pt-BR')}</td>
                                    <td className="p-3 text-center">{delta !== 0 && <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${delta > 0 ? 'text-accent' : 'text-destructive'}`}>{delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(delta).toFixed(0)}%</span>}</td>
                                    <td className="p-3 text-right hidden md:table-cell text-muted-foreground">{pg.impressoes.toLocaleString('pt-BR')}</td>
                                    <td className="p-3 text-right hidden md:table-cell text-muted-foreground">{pg.cliques.toLocaleString('pt-BR')}</td>
                                    <td className="p-3 text-right hidden lg:table-cell"><Badge variant="outline" className={`text-[10px] ${pg.ctr >= 5 ? 'text-accent border-accent' : ''}`}>{Number(pg.ctr).toFixed(1)}%</Badge></td>
                                    <td className="p-3 text-right hidden lg:table-cell"><Badge variant="outline" className={`text-[10px] ${Number(pg.posicao_media) <= 10 ? 'text-primary border-primary' : ''}`}>#{Number(pg.posicao_media).toFixed(1)}</Badge></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ═══════════ MARKETING TAB ═══════════ */}
            <TabsContent value="marketing" className="space-y-6">
              <div className="flex justify-end"><CreateTaskButton contexto="Marketing" /></div>
              {marketing.length === 0 ? (
                <Card><CardContent className="p-12 text-center"><BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><h3 className="text-sm font-semibold mb-1">Marketing Digital</h3><p className="text-sm text-muted-foreground">Seus relatórios de marketing aparecerão aqui em breve.</p></CardContent></Card>
              ) : (
                <>
                  <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StaggerItem><MktKPI label="Visitas/Mês" value={latestMkt!.visitas_site.toLocaleString('pt-BR')} icon={Globe} delta={prevMkt ? calcDelta(latestMkt!.visitas_site, prevMkt.visitas_site) : undefined} /></StaggerItem>
                    <StaggerItem><MktKPI label="Leads Gerados" value={latestMkt!.leads_gerados.toString()} icon={Target} delta={prevMkt ? calcDelta(latestMkt!.leads_gerados, prevMkt.leads_gerados) : undefined} /></StaggerItem>
                    <StaggerItem><MktKPI label="Investimento Ads" value={latestMkt!.custo_ads.toLocaleString('pt-BR')} icon={MousePointerClick} prefix="R$ " /></StaggerItem>
                    <StaggerItem><MktKPI label="Conversões" value={latestMkt!.conversoes_ads.toString()} icon={CheckCircle2} delta={prevMkt ? calcDelta(latestMkt!.conversoes_ads, prevMkt.conversoes_ads) : undefined} /></StaggerItem>
                    <StaggerItem><MktKPI label="Seguidores" value={latestMkt!.seguidores_total.toLocaleString('pt-BR')} icon={Users} delta={prevMkt ? calcDelta(latestMkt!.seguidores_total, prevMkt.seguidores_total) : undefined} /></StaggerItem>
                    <StaggerItem><MktKPI label="Engajamento" value={`${latestMkt!.engajamento_rate}%`} icon={MessageSquare} delta={prevMkt ? calcDelta(latestMkt!.engajamento_rate, prevMkt.engajamento_rate) : undefined} /></StaggerItem>
                  </StaggerContainer>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2">
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Evolução de Tráfego</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={trafegoData}>
                            <defs>
                              <linearGradient id="colorOrg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0}/></linearGradient>
                              <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                            <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <YAxis fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="organico" name="Orgânico" stroke="hsl(160, 84%, 39%)" fill="url(#colorOrg)" strokeWidth={2} />
                            <Area type="monotone" dataKey="pago" name="Pago" stroke="hsl(217, 91%, 60%)" fill="url(#colorPago)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Fontes de Tráfego</CardTitle></CardHeader>
                      <CardContent className="flex items-center justify-center">
                        {trafficPie.length > 0 ? (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart><Pie data={trafficPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={4} strokeWidth={0} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>{trafficPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
                          </ResponsiveContainer>
                        ) : <p className="text-xs text-muted-foreground">Sem dados</p>}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Geração de Leads</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={leadsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                            <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <YAxis fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="gerados" name="Gerados" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} barSize={18} />
                            <Bar dataKey="qualificados" name="Qualificados" fill="hsl(160, 84%, 39%)" radius={[6, 6, 0, 0]} barSize={18} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Evolução Redes Sociais</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={socialData}>
                            <defs><linearGradient id="colorSeg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(262, 52%, 56%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(262, 52%, 56%)" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                            <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <YAxis fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="seguidores" name="Seguidores" stroke="hsl(262, 52%, 56%)" fill="url(#colorSeg)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {latestMkt?.observacoes && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Resumo do Mês</CardTitle></CardHeader>
                      <CardContent><p className="text-sm text-muted-foreground whitespace-pre-line">{latestMkt.observacoes}</p></CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ═══════════ MÍDIAS SOCIAIS TAB ═══════════ */}
            <TabsContent value="social" className="space-y-6">
              <div className="flex justify-end"><CreateTaskButton contexto="Mídias Sociais" /></div>
              {socialAccounts.length === 0 ? (
                <Card><CardContent className="p-12 text-center"><Share2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><h3 className="text-sm font-semibold mb-1">Mídias Sociais</h3><p className="text-sm text-muted-foreground">Suas contas de mídias sociais aparecerão aqui quando cadastradas pela equipe.</p></CardContent></Card>
              ) : (
                <>
                  <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {socialAccounts.map(acc => {
                      const platformIcons: Record<string, string> = { instagram: '📸', facebook: '📘', linkedin: '💼', tiktok: '🎵', youtube: '▶️', twitter: '🐦', pinterest: '📌' };
                      return (
                        <StaggerItem key={acc.id}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <span className="text-lg">{platformIcons[acc.plataforma.toLowerCase()] || '🌐'}</span>
                                {acc.plataforma}
                                {acc.username && <Badge variant="outline" className="text-[10px]">@{acc.username}</Badge>}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="p-2 rounded-lg bg-muted/50"><p className="text-[10px] text-muted-foreground">Seguidores</p><p className="font-bold">{acc.seguidores.toLocaleString('pt-BR')}</p></div>
                                <div className="p-2 rounded-lg bg-muted/50"><p className="text-[10px] text-muted-foreground">Novos/mês</p><p className="font-bold text-accent">+{acc.novos_seguidores_mes.toLocaleString('pt-BR')}</p></div>
                                <div className="p-2 rounded-lg bg-muted/50"><p className="text-[10px] text-muted-foreground">Engajamento</p><p className="font-bold">{acc.engajamento_medio}%</p></div>
                                <div className="p-2 rounded-lg bg-muted/50"><p className="text-[10px] text-muted-foreground">Posts</p><p className="font-bold">{acc.posts_total}</p></div>
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                                <div className="p-1.5 rounded bg-primary/5"><p className="text-muted-foreground">Alcance</p><p className="font-semibold">{acc.alcance_medio.toLocaleString('pt-BR')}</p></div>
                                <div className="p-1.5 rounded bg-primary/5"><p className="text-muted-foreground">Impressões</p><p className="font-semibold">{acc.impressoes_mes.toLocaleString('pt-BR')}</p></div>
                                <div className="p-1.5 rounded bg-primary/5"><p className="text-muted-foreground">Cliques</p><p className="font-semibold">{acc.cliques_mes.toLocaleString('pt-BR')}</p></div>
                              </div>
                              {acc.url_perfil && <a href={acc.url_perfil} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Ver perfil</a>}
                            </CardContent>
                          </Card>
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>

                  {/* Combined social chart */}
                  {socialAccounts.length > 1 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Comparativo entre Plataformas</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={socialAccounts.map(a => ({ nome: a.plataforma, seguidores: a.seguidores, engajamento: a.engajamento_medio }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                            <XAxis dataKey="nome" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <YAxis fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend fontSize={10} />
                            <Bar dataKey="seguidores" name="Seguidores" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ═══════════ MYBUSINESS TAB ═══════════ */}
            <TabsContent value="mybusiness" className="space-y-6">
              <div className="flex justify-end"><CreateTaskButton contexto="MyBusiness" /></div>
              {!mybusiness ? (
                <Card><CardContent className="p-12 text-center"><Store className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><h3 className="text-sm font-semibold mb-1">Google MyBusiness</h3><p className="text-sm text-muted-foreground">Dados do seu perfil MyBusiness aparecerão aqui quando configurados pela equipe.</p></CardContent></Card>
              ) : (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> {mybusiness.nome_negocio}</CardTitle>
                      {mybusiness.categoria && <p className="text-xs text-muted-foreground">{mybusiness.categoria}</p>}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {mybusiness.endereco && <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {mybusiness.endereco}{mybusiness.cidade ? `, ${mybusiness.cidade}` : ''}{mybusiness.estado ? ` - ${mybusiness.estado}` : ''}</span>}
                        {mybusiness.telefone && <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {mybusiness.telefone}</span>}
                        {mybusiness.website && <a href={mybusiness.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><Globe className="h-3.5 w-3.5" /> Website</a>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-4 w-4 ${i <= Math.round(mybusiness.avaliacao_media) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />)}
                        </div>
                        <span className="text-sm font-bold">{mybusiness.avaliacao_media.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({mybusiness.total_avaliacoes} avaliações)</span>
                      </div>
                    </CardContent>
                  </Card>

                  <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StaggerItem><MktKPI label="Visualiz. Busca" value={mybusiness.visualizacoes_busca.toLocaleString('pt-BR')} icon={Search} /></StaggerItem>
                    <StaggerItem><MktKPI label="Visualiz. Maps" value={mybusiness.visualizacoes_maps.toLocaleString('pt-BR')} icon={MapPin} /></StaggerItem>
                    <StaggerItem><MktKPI label="Cliques Site" value={mybusiness.cliques_site.toLocaleString('pt-BR')} icon={Globe} /></StaggerItem>
                    <StaggerItem><MktKPI label="Ligações" value={mybusiness.cliques_ligacao.toLocaleString('pt-BR')} icon={Phone} /></StaggerItem>
                    <StaggerItem><MktKPI label="Rotas" value={mybusiness.cliques_rota.toLocaleString('pt-BR')} icon={MapPin} /></StaggerItem>
                    <StaggerItem><MktKPI label="Fotos" value={mybusiness.fotos_count.toString()} icon={Eye} /></StaggerItem>
                  </StaggerContainer>

                  {/* Competitors box */}
                  {competitors.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Concorrentes</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Your business vs competitors */}
                          <div className="p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">{mybusiness.nome_negocio}</span><Badge className="text-[10px]">Você</Badge></div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= Math.round(mybusiness.avaliacao_media) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />)}</div>
                                <span className="text-sm font-bold">{mybusiness.avaliacao_media.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({mybusiness.total_avaliacoes})</span>
                              </div>
                            </div>
                          </div>
                          {competitors.map(comp => (
                            <div key={comp.id} className="p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{comp.nome_concorrente}</p>
                                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                    {comp.categoria && <span>{comp.categoria}</span>}
                                    {comp.distancia_km != null && <span>· {comp.distancia_km.toFixed(1)} km</span>}
                                    {comp.endereco && <span>· {comp.endereco}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= Math.round(comp.avaliacao_media) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />)}</div>
                                  <span className="text-sm font-bold">{comp.avaliacao_media.toFixed(1)}</span>
                                  <span className="text-xs text-muted-foreground">({comp.total_avaliacoes})</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Rating comparison chart */}
                        <div className="mt-4">
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={[{ nome: mybusiness.nome_negocio.slice(0, 15), nota: mybusiness.avaliacao_media, avaliacoes: mybusiness.total_avaliacoes }, ...competitors.map(c => ({ nome: c.nome_concorrente.slice(0, 15), nota: c.avaliacao_media, avaliacoes: c.total_avaliacoes }))]} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" horizontal={false} />
                              <XAxis type="number" domain={[0, 5]} fontSize={10} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="nome" width={100} fontSize={10} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [name === 'nota' ? `${v.toFixed(1)} ⭐` : v, name === 'nota' ? 'Nota' : 'Avaliações']} />
                              <Bar dataKey="nota" fill="hsl(38, 92%, 50%)" radius={[0, 6, 6, 0]} barSize={16} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ═══════════ FINANCEIRO TAB ═══════════ */}
            <TabsContent value="financeiro" className="space-y-6">
              <div className="flex justify-end"><CreateTaskButton contexto="Financeiro" /></div>
              {financeiro.length === 0 ? (
                <Card><CardContent className="p-12 text-center"><Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><h3 className="text-sm font-semibold mb-1">Financeiro</h3><p className="text-sm text-muted-foreground">Nenhum registro financeiro encontrado.</p></CardContent></Card>
              ) : (
                <>
                  {(() => {
                    const total = financeiro.reduce((s, f) => s + f.valor, 0);
                    const pago = financeiro.filter(f => f.status === 'pago').reduce((s, f) => s + f.valor, 0);
                    const pendente = financeiro.filter(f => f.status === 'pendente').reduce((s, f) => s + f.valor, 0);
                    const vencido = financeiro.filter(f => f.status === 'pendente' && new Date(f.data_vencimento) < new Date()).length;
                    return (
                      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StaggerItem><MktKPI label="Total" value={total.toLocaleString('pt-BR')} icon={Receipt} prefix="R$ " /></StaggerItem>
                        <StaggerItem><MktKPI label="Pago" value={pago.toLocaleString('pt-BR')} icon={CheckCircle2} prefix="R$ " /></StaggerItem>
                        <StaggerItem><MktKPI label="Pendente" value={pendente.toLocaleString('pt-BR')} icon={Clock} prefix="R$ " /></StaggerItem>
                        <StaggerItem><Card className={vencido > 0 ? 'border-destructive/30' : ''}><CardContent className="p-4"><div className="flex items-start justify-between"><div className="p-2 rounded-xl bg-destructive/10"><AlertTriangle className="h-4 w-4 text-destructive" /></div></div><div className="mt-3"><p className="text-xs text-muted-foreground">Vencidos</p><p className="text-xl font-bold text-destructive">{vencido}</p></div></CardContent></Card></StaggerItem>
                      </StaggerContainer>
                    );
                  })()}

                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Histórico de Cobranças</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b bg-muted/30">
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Descrição</th>
                            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Valor</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Vencimento</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Status</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Pagamento</th>
                          </tr></thead>
                          <tbody>
                            {financeiro.map(f => {
                              const isOverdue = f.status === 'pendente' && new Date(f.data_vencimento) < new Date();
                              const statusMap: Record<string, { label: string; color: string }> = {
                                pago: { label: 'Pago', color: 'bg-accent/10 text-accent border-accent/30' },
                                pendente: { label: isOverdue ? 'Vencido' : 'Pendente', color: isOverdue ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-warning/10 text-warning border-warning/30' },
                                cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground' },
                              };
                              const st = statusMap[f.status] || statusMap.pendente;
                              return (
                                <tr key={f.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                  <td className="p-3">
                                    <p className="font-medium">{f.descricao || f.tipo}</p>
                                    {f.numero_boleto && <p className="text-[10px] text-muted-foreground">Boleto: {f.numero_boleto}</p>}
                                  </td>
                                  <td className="p-3 text-right font-semibold">R$ {f.valor.toLocaleString('pt-BR')}</td>
                                  <td className="p-3 text-center text-muted-foreground">{new Date(f.data_vencimento).toLocaleDateString('pt-BR')}</td>
                                  <td className="p-3 text-center"><Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge></td>
                                  <td className="p-3 text-center hidden md:table-cell text-muted-foreground text-xs">{f.data_pagamento ? new Date(f.data_pagamento).toLocaleDateString('pt-BR') : '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="dados">
              {cliente && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Meus Dados</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Nome', value: cliente.nome },
                        { label: 'Razão Social', value: cliente.razao_social },
                        { label: 'CNPJ', value: cliente.cnpj },
                        { label: 'Email', value: cliente.email },
                        { label: 'Telefone', value: cliente.telefone },
                        { label: 'Localização', value: cliente.cidade && cliente.estado ? `${cliente.cidade} / ${cliente.estado}` : null },
                      ].filter(x => x.value).map(item => (
                        <div key={item.label} className="flex flex-col">
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════ PROCEDIMENTOS TAB ═══════════ */}
            <TabsContent value="procedimentos" className="space-y-6">
              <div className="flex justify-end"><CreateTaskButton contexto="Procedimentos" /></div>
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StaggerItem><Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2.5 rounded-xl bg-primary/10"><ShoppingBag className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Procedimentos</p><p className="text-xl font-bold">{totalProcedimentos}</p></div></CardContent></Card></StaggerItem>
                <StaggerItem><Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2.5 rounded-xl bg-accent/10"><DollarSign className="h-5 w-5 text-accent" /></div><div><p className="text-xs text-muted-foreground">Total Investido</p><p className="text-xl font-bold">R$ {totalGasto.toLocaleString('pt-BR')}</p></div></CardContent></Card></StaggerItem>
                <StaggerItem><Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2.5 rounded-xl bg-chart-3/10"><Hash className="h-5 w-5 text-[hsl(var(--chart-3))]" /></div><div><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="text-xl font-bold">R$ {ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p></div></CardContent></Card></StaggerItem>
                <StaggerItem><Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2.5 rounded-xl bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-xl font-bold">{pendentes.length}</p></div></CardContent></Card></StaggerItem>
              </StaggerContainer>

              {concluidos.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Investimento Mensal</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={monthlySpending}>
                          <defs><linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                          <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                          <YAxis fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                          <Area type="monotone" dataKey="valor" name="Investimento" stroke="hsl(217, 91%, 60%)" fill="url(#colorValor)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Por Categoria</CardTitle></CardHeader>
                    <CardContent className="flex items-center justify-center">
                      {categoriaBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart><Pie data={categoriaBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={4} strokeWidth={0} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>{categoriaBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string, props: any) => [`${v} procedimentos (R$ ${props.payload.total.toLocaleString('pt-BR')})`, name]} /></PieChart>
                        </ResponsiveContainer>
                      ) : <p className="text-xs text-muted-foreground">Sem dados</p>}
                    </CardContent>
                  </Card>
                </div>
              )}

              {paymentBreakdown.length > 1 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Formas de Pagamento</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {paymentBreakdown.map((pm, i) => (
                        <div key={pm.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border">
                          <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-sm font-medium">{pm.name}</span>
                          <Badge variant="outline" className="text-xs">{pm.value}x</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {pendentes.length > 0 && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-warning" /> Atendimentos em Andamento</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendentes.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                          <div>
                            <p className="text-sm font-medium">{v.nome_procedimento || 'Procedimento'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <CalendarDays className="h-3 w-3" />{new Date(v.data_venda).toLocaleDateString('pt-BR')}
                              {v.categoria && <><span>·</span><Layers className="h-3 w-3" />{categoriaLabels[v.categoria] || v.categoria}</>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">R$ {v.valor_venda.toLocaleString('pt-BR')}</p>
                            <Badge variant="outline" className="text-warning border-warning text-[10px]">Pendente</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Histórico Completo</CardTitle></CardHeader>
                <CardContent>
                  {vendas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Nenhum procedimento registrado ainda.</p></div>
                  ) : (
                    <div className="space-y-2">
                      {vendas.sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime()).map(v => {
                        const st = statusConfig[v.status] || statusConfig.fechado;
                        const StIcon = st.icon;
                        return (
                          <motion.div key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <StIcon className={`h-4 w-4 ${st.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{v.nome_procedimento || 'Procedimento'}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarDays className="h-3 w-3" />{new Date(v.data_venda).toLocaleDateString('pt-BR')}
                                {v.categoria && <><span>·</span><Badge variant="outline" className="text-[10px] py-0 px-1.5">{categoriaLabels[v.categoria] || v.categoria}</Badge></>}
                                {v.forma_pagamento && <><span>·</span><CreditCard className="h-3 w-3" />{paymentLabels[v.forma_pagamento] || v.forma_pagamento}</>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold">R$ {v.valor_venda.toLocaleString('pt-BR')}</p>
                              <Badge variant="outline" className={`text-[10px] ${st.color} border-current`}>{st.label}</Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AnimatedPage>

      {/* ── Create Task Dialog (global) ── */}
      <Dialog open={showNewTarefa} onOpenChange={setShowNewTarefa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Nova Tarefa
              {newTarefa.contexto && <Badge variant="outline" className="text-xs text-primary border-primary/40">{newTarefa.contexto}</Badge>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Título *</Label><Input value={newTarefa.titulo} onChange={e => setNewTarefa(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Enviar material atualizado" /></div>
            <div><Label>Descrição</Label><Textarea value={newTarefa.descricao} onChange={e => setNewTarefa(p => ({ ...p, descricao: e.target.value }))} placeholder="Detalhes opcionais..." rows={3} /></div>
            <div><Label>Prioridade</Label>
              <Select value={newTarefa.prioridade} onValueChange={v => setNewTarefa(p => ({ ...p, prioridade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveTarefa} disabled={savingTarefa || !newTarefa.titulo.trim()} className="w-full">
              {savingTarefa ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : 'Criar Tarefa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Floating WhatsApp Button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <div className="bg-card border border-border/60 rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-medium text-foreground">Alguma dúvida? 💬</p>
        </div>
        <a
          href="https://wa.me/5511941646249?text=Ol%C3%A1%2C%20venho%20do%20REPORTS"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white px-5 py-3 rounded-2xl shadow-lg shadow-[hsl(142,70%,45%)]/30 transition-all hover:scale-105 hover:shadow-xl"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="text-sm font-semibold">Chame por aqui</span>
        </a>
      </div>
    </div>
  );
}
