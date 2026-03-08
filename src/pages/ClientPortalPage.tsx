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
  const { user, signOut } = useAuth();
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [vendas, setVendas] = useState<VendaCliente[]>([]);
  const [marketing, setMarketing] = useState<MarketingReport[]>([]);
  const [seoKeywords, setSeoKeywords] = useState<SeoKeyword[]>([]);
  const [seoPages, setSeoPages] = useState<SeoPage[]>([]);
  const [tarefas, setTarefas] = useState<TarefaCliente[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [adStudies, setAdStudies] = useState<AdStudy[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showNewTarefa, setShowNewTarefa] = useState(false);
  const [showNewAnuncio, setShowNewAnuncio] = useState(false);
  
  const [activePlatform, setActivePlatform] = useState<Platform>('google');

  // New tarefa form
  const [newTarefa, setNewTarefa] = useState({ titulo: '', descricao: '', prioridade: 'media' });
  const [savingTarefa, setSavingTarefa] = useState(false);

  // New anuncio form
  const [newAnuncio, setNewAnuncio] = useState({ plataforma: 'google' as Platform, tipo_anuncio: '', titulo: '', descricao: '', investimento: '', data_inicio: '', data_fim: '', url_destino: '' });
  const [savingAnuncio, setSavingAnuncio] = useState(false);

  // AI generator
  const [aiForm, setAiForm] = useState({ segmento: '', produto: '', objetivo: 'Conversão' });
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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
        const [mktRes, kwRes, pgRes, tarefasRes, anunciosRes, studiesRes] = await Promise.all([
          supabase.from('marketing_reports').select('*').eq('cliente_id', clienteRes.data.id).order('periodo_mes', { ascending: true }),
          supabase.from('seo_keywords').select('*').eq('cliente_id', clienteRes.data.id).order('posicao_atual', { ascending: true }),
          supabase.from('seo_pages').select('*').eq('cliente_id', clienteRes.data.id).order('periodo_mes', { ascending: false }),
          supabase.from('tarefas_cliente').select('*').eq('cliente_id', clienteRes.data.id).order('created_at', { ascending: false }),
          supabase.from('anuncios').select('*').eq('cliente_id', clienteRes.data.id).order('created_at', { ascending: false }),
          supabase.from('ad_studies' as any).select('*').eq('cliente_id', clienteRes.data.id).order('created_at', { ascending: false }),
        ]);
        setMarketing((mktRes.data || []) as MarketingReport[]);
        setSeoKeywords((kwRes.data || []) as SeoKeyword[]);
        setSeoPages((pgRes.data || []) as SeoPage[]);
        setTarefas((tarefasRes.data || []) as TarefaCliente[]);
        setAnuncios((anunciosRes.data || []) as Anuncio[]);
        setAdStudies((studiesRes.data || []) as unknown as AdStudy[]);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // ─── Handlers ───
  const handleSaveTarefa = async () => {
    if (!cliente || !newTarefa.titulo.trim()) return;
    setSavingTarefa(true);
    const { error } = await supabase.from('tarefas_cliente').insert({
      cliente_id: cliente.id,
      titulo: newTarefa.titulo,
      descricao: newTarefa.descricao || null,
      prioridade: newTarefa.prioridade,
      status: 'esperando',
    });
    if (error) { toast.error('Erro ao criar tarefa'); console.error(error); }
    else {
      toast.success('Tarefa criada!');
      setShowNewTarefa(false);
      setNewTarefa({ titulo: '', descricao: '', prioridade: 'media' });
      // Refresh
      const { data } = await supabase.from('tarefas_cliente').select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false });
      setTarefas((data || []) as TarefaCliente[]);
    }
    setSavingTarefa(false);
  };

  const handleSaveAnuncio = async () => {
    if (!cliente || !newAnuncio.titulo.trim() || !newAnuncio.tipo_anuncio) return;
    setSavingAnuncio(true);
    const { error } = await supabase.from('anuncios').insert({
      cliente_id: cliente.id,
      plataforma: newAnuncio.plataforma,
      tipo_anuncio: newAnuncio.tipo_anuncio,
      titulo: newAnuncio.titulo,
      descricao: newAnuncio.descricao || null,
      investimento: parseFloat(newAnuncio.investimento) || 0,
      data_inicio: newAnuncio.data_inicio || null,
      data_fim: newAnuncio.data_fim || null,
      url_destino: newAnuncio.url_destino || null,
    });
    if (error) { toast.error('Erro ao criar anúncio'); console.error(error); }
    else {
      toast.success('Anúncio criado!');
      setShowNewAnuncio(false);
      setNewAnuncio({ plataforma: 'google', tipo_anuncio: '', titulo: '', descricao: '', investimento: '', data_inicio: '', data_fim: '', url_destino: '' });
      const { data } = await supabase.from('anuncios').select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false });
      setAnuncios((data || []) as Anuncio[]);
    }
    setSavingAnuncio(false);
  };

  const handleAiGenerate = async () => {
    if (!cliente) return;
    setAiLoading(true);
    setAiResult('');
    try {
      const platformAds = anuncios.filter(a => a.plataforma === activePlatform);
      const existingKeywords = platformAds.flatMap(a => a.palavras_chave || []);
      const platformInfo = PLATFORMS.find(p => p.id === activePlatform);

      const { data, error } = await supabase.functions.invoke('ad-generator', {
        body: {
          plataforma: activePlatform,
          tipo_anuncio: platformInfo?.types[0] || '',
          segmento: aiForm.segmento,
          produto: aiForm.produto,
          objetivo: aiForm.objetivo,
          palavras_chave_atuais: existingKeywords,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const suggestions = data.suggestions || 'Nenhuma sugestão gerada.';
      setAiResult(suggestions);

      // Save to ad_studies
      const { error: saveErr } = await supabase.from('ad_studies' as any).insert({
        cliente_id: cliente.id,
        plataforma: activePlatform,
        segmento: aiForm.segmento || null,
        produto: aiForm.produto || null,
        objetivo: aiForm.objetivo,
        resultado: suggestions,
      } as any);
      if (saveErr) { console.error('Error saving study:', saveErr); }
      else {
        // Refresh studies
        const { data: newStudies } = await supabase.from('ad_studies' as any).select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false });
        setAdStudies((newStudies || []) as unknown as AdStudy[]);
        toast.success('Estudo salvo com sucesso!');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar sugestões');
      console.error(e);
    }
    setAiLoading(false);
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

  const currentPlatformAds = anunciosByPlatform[activePlatform];
  const currentPlatformInfo = PLATFORMS.find(p => p.id === activePlatform)!;

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
            <p className="text-muted-foreground text-sm mt-1">Acompanhe seus procedimentos, anúncios e resultados de marketing.</p>
          </div>

          <Tabs defaultValue="tarefas" className="space-y-6">
            <TabsList className="flex-wrap">
              <TabsTrigger value="tarefas" className="gap-1.5"><ListTodo className="h-3.5 w-3.5" /> Tarefas</TabsTrigger>
              <TabsTrigger value="anuncios" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Anúncios</TabsTrigger>
              <TabsTrigger value="seo" className="gap-1.5"><Search className="h-3.5 w-3.5" /> SEO</TabsTrigger>
              <TabsTrigger value="marketing" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Marketing Digital</TabsTrigger>
              <TabsTrigger value="dados" className="gap-1.5"><User className="h-3.5 w-3.5" /> Meus Dados</TabsTrigger>
              <TabsTrigger value="procedimentos" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Procedimentos</TabsTrigger>
            </TabsList>

            {/* ═══════════ TAREFAS TAB ═══════════ */}
            <TabsContent value="tarefas" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Suas Tarefas</h3>
                <Dialog open={showNewTarefa} onOpenChange={setShowNewTarefa}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nova Tarefa</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
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
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-lg font-semibold">Anúncios por Plataforma</h3>
                <Dialog open={showNewAnuncio} onOpenChange={setShowNewAnuncio}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Novo Anúncio</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Novo Anúncio</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div><Label>Plataforma *</Label>
                        <Select value={newAnuncio.plataforma} onValueChange={v => setNewAnuncio(p => ({ ...p, plataforma: v as Platform, tipo_anuncio: '' }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.id} value={p.id}>{p.icon} {p.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Tipo de Anúncio *</Label>
                        <Select value={newAnuncio.tipo_anuncio} onValueChange={v => setNewAnuncio(p => ({ ...p, tipo_anuncio: v }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                          <SelectContent>{PLATFORMS.find(p => p.id === newAnuncio.plataforma)?.types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Título *</Label><Input value={newAnuncio.titulo} onChange={e => setNewAnuncio(p => ({ ...p, titulo: e.target.value }))} placeholder="Título do anúncio" /></div>
                      <div><Label>Descrição</Label><Textarea value={newAnuncio.descricao} onChange={e => setNewAnuncio(p => ({ ...p, descricao: e.target.value }))} rows={2} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Investimento (R$)</Label><Input type="number" value={newAnuncio.investimento} onChange={e => setNewAnuncio(p => ({ ...p, investimento: e.target.value }))} /></div>
                        <div><Label>URL Destino</Label><Input value={newAnuncio.url_destino} onChange={e => setNewAnuncio(p => ({ ...p, url_destino: e.target.value }))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Data Início</Label><Input type="date" value={newAnuncio.data_inicio} onChange={e => setNewAnuncio(p => ({ ...p, data_inicio: e.target.value }))} /></div>
                        <div><Label>Data Fim</Label><Input type="date" value={newAnuncio.data_fim} onChange={e => setNewAnuncio(p => ({ ...p, data_fim: e.target.value }))} /></div>
                      </div>
                      <Button onClick={handleSaveAnuncio} disabled={savingAnuncio || !newAnuncio.titulo.trim() || !newAnuncio.tipo_anuncio} className="w-full">
                        {savingAnuncio ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : 'Criar Anúncio'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Platform summary cards */}
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {platformStats.map(p => (
                  <StaggerItem key={p.id}>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${activePlatform === p.id ? 'ring-2 ring-primary shadow-md' : ''}`}
                      onClick={() => setActivePlatform(p.id)}
                    >
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

              {/* Active platform detail */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">{currentPlatformInfo.icon}</span> {currentPlatformInfo.label}
                    <Badge variant="outline" className="ml-auto">{currentPlatformAds.length} anúncios</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentPlatformAds.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Nenhum anúncio em {currentPlatformInfo.label} ainda.</p>
                      <p className="text-xs mt-1">Clique em "Novo Anúncio" para criar ou use o Gerador IA abaixo.</p>
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
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-semibold truncate">{ad.titulo}</p>
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

              {/* ── AI Generator inline per platform ── */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Gerador IA — {currentPlatformInfo.label}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Especialista em mídia paga analisa SEO, volumes de busca e gera sugestões otimizadas para {currentPlatformInfo.label}.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div><Label className="text-xs">Segmento / Nicho</Label><Input value={aiForm.segmento} onChange={e => setAiForm(p => ({ ...p, segmento: e.target.value }))} placeholder="Ex: Clínica de estética" className="h-9 text-sm" /></div>
                    <div><Label className="text-xs">Produto / Serviço</Label><Input value={aiForm.produto} onChange={e => setAiForm(p => ({ ...p, produto: e.target.value }))} placeholder="Ex: Harmonização facial" className="h-9 text-sm" /></div>
                    <div><Label className="text-xs">Objetivo</Label>
                      <Select value={aiForm.objetivo} onValueChange={v => setAiForm(p => ({ ...p, objetivo: v }))}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Conversão">Conversão</SelectItem>
                          <SelectItem value="Tráfego">Tráfego</SelectItem>
                          <SelectItem value="Reconhecimento de marca">Reconhecimento de marca</SelectItem>
                          <SelectItem value="Geração de leads">Geração de leads</SelectItem>
                          <SelectItem value="Vendas">Vendas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAiGenerate} disabled={aiLoading} size="sm" className="gap-2">
                    {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando sugestões...</> : <><Send className="h-4 w-4" /> Gerar Sugestões</>}
                  </Button>
                  {aiResult && (
                    <Card className="bg-muted/30 border-primary/10">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Última Geração</h4>
                        <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">{aiResult}</div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* ── Saved AI studies for this platform ── */}
              {studiesByPlatform[activePlatform].length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Estudos Salvos — {currentPlatformInfo.label}
                      <Badge variant="outline" className="ml-auto">{studiesByPlatform[activePlatform].length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {studiesByPlatform[activePlatform].map((study, idx) => (
                      <details key={study.id} className="group rounded-lg border p-3 hover:bg-muted/20 transition-colors">
                        <summary className="flex items-center gap-3 cursor-pointer list-none">
                          <Sparkles className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Estudo #{studiesByPlatform[activePlatform].length - idx}</span>
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
              )}

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

            {/* ═══════════ DADOS TAB ═══════════ */}
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
    </div>
  );
}
