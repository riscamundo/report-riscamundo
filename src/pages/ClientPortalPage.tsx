import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { motion } from 'framer-motion';
import {
  User, ShoppingBag, CreditCard, Clock, LogOut, CheckCircle2, AlertCircle,
  CalendarDays, DollarSign, FileText, TrendingUp, Globe, MousePointerClick,
  MessageSquare, Target, BarChart3, Users, Eye, ArrowUpRight, ArrowDownRight,
  Megaphone, Layers, Hash, Percent, Zap, PieChart as PieChartIcon,
  Search, ExternalLink, MoveUp, MoveDown, Minus, Link2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

interface ClienteData {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
}

interface VendaCliente {
  id: string;
  data_venda: string;
  valor_venda: number;
  status: string;
  forma_pagamento: string | null;
  nome_procedimento: string | null;
  categoria: string | null;
}

interface MarketingReport {
  id: string;
  periodo_mes: string;
  visitas_site: number;
  visitas_organicas: number;
  visitas_pagas: number;
  palavras_chave_top10: number;
  impressoes_ads: number;
  cliques_ads: number;
  custo_ads: number;
  conversoes_ads: number;
  seguidores_total: number;
  novos_seguidores: number;
  engajamento_rate: number;
  posts_publicados: number;
  leads_gerados: number;
  leads_qualificados: number;
  observacoes: string | null;
}

interface SeoKeyword {
  id: string;
  palavra_chave: string;
  posicao_atual: number | null;
  posicao_anterior: number | null;
  volume_busca: number;
  url_rankeada: string | null;
  dificuldade: string;
  status: string;
}

interface SeoPage {
  id: string;
  url: string;
  titulo: string;
  visitas_mes: number;
  visitas_mes_anterior: number;
  posicao_media: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  taxa_rejeicao: number;
  tempo_medio_pagina: string | null;
  status: string;
  periodo_mes: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  fechado: { label: 'Concluído', color: 'text-accent', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'text-warning', icon: Clock },
  cancelado: { label: 'Cancelado', color: 'text-destructive', icon: AlertCircle },
};

const paymentLabels: Record<string, string> = {
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto',
  financiamento: 'Financiamento',
};

const categoriaLabels: Record<string, string> = {
  facial: 'Facial',
  capilar: 'Capilar',
  combo_premium: 'Combo Premium',
};

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(262, 52%, 56%)', 'hsl(38, 92%, 50%)', 'hsl(340, 75%, 55%)'];

const tooltipStyle = {
  background: '#fff',
  border: '1px solid hsl(220, 13%, 91%)',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
  fontSize: '13px',
};

export default function ClientPortalPage() {
  const { user, signOut } = useAuth();
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [vendas, setVendas] = useState<VendaCliente[]>([]);
  const [marketing, setMarketing] = useState<MarketingReport[]>([]);
  const [seoKeywords, setSeoKeywords] = useState<SeoKeyword[]>([]);
  const [seoPages, setSeoPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);

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
        const [mktRes, kwRes, pgRes] = await Promise.all([
          supabase.from('marketing_reports').select('*').eq('cliente_id', clienteRes.data.id).order('periodo_mes', { ascending: true }),
          supabase.from('seo_keywords').select('*').eq('cliente_id', clienteRes.data.id).order('posicao_atual', { ascending: true }),
          supabase.from('seo_pages').select('*').eq('cliente_id', clienteRes.data.id).order('periodo_mes', { ascending: false }),
        ]);
        setMarketing((mktRes.data || []) as MarketingReport[]);
        setSeoKeywords((kwRes.data || []) as SeoKeyword[]);
        setSeoPages((pgRes.data || []) as SeoPage[]);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // ─── Procedimentos derived metrics ───
  const concluidos = vendas.filter(v => v.status === 'fechado');
  const totalGasto = concluidos.reduce((s, v) => s + v.valor_venda, 0);
  const totalProcedimentos = concluidos.length;
  const pendentes = vendas.filter(v => v.status === 'pendente');
  const ticketMedio = totalProcedimentos > 0 ? totalGasto / totalProcedimentos : 0;

  // Group by category
  const categoriaBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    concluidos.forEach(v => {
      const cat = v.categoria || 'outros';
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count++;
      map[cat].total += v.valor_venda;
    });
    return Object.entries(map).map(([key, val]) => ({
      name: categoriaLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
      value: val.count,
      total: val.total,
    }));
  }, [concluidos]);

  // Monthly spending trend
  const monthlySpending = useMemo(() => {
    const map: Record<string, number> = {};
    concluidos.forEach(v => {
      const month = v.data_venda.slice(0, 7);
      map[month] = (map[month] || 0) + v.valor_venda;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        mes: new Date(month + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        valor: total,
      }));
  }, [concluidos]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    concluidos.forEach(v => {
      const pm = v.forma_pagamento || 'outros';
      map[pm] = (map[pm] || 0) + 1;
    });
    return Object.entries(map).map(([key, val]) => ({
      name: paymentLabels[key] || key,
      value: val,
    }));
  }, [concluidos]);

  // ─── Marketing derived metrics ───
  const latestMkt = marketing.length > 0 ? marketing[marketing.length - 1] : null;
  const prevMkt = marketing.length > 1 ? marketing[marketing.length - 2] : null;

  const calcDelta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatMonth = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'short' });
  };

  const formatMonthFull = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Marketing chart data
  const trafegoData = marketing.map(m => ({
    mes: formatMonth(m.periodo_mes),
    organico: m.visitas_organicas,
    pago: m.visitas_pagas,
    total: m.visitas_site,
  }));

  const leadsData = marketing.map(m => ({
    mes: formatMonth(m.periodo_mes),
    gerados: m.leads_gerados,
    qualificados: m.leads_qualificados,
  }));

  const socialData = marketing.map(m => ({
    mes: formatMonth(m.periodo_mes),
    seguidores: m.seguidores_total,
    engajamento: m.engajamento_rate,
    posts: m.posts_publicados,
  }));

  const trafficPie = latestMkt ? [
    { name: 'Orgânico', value: latestMkt.visitas_organicas },
    { name: 'Pago', value: latestMkt.visitas_pagas },
    { name: 'Outros', value: Math.max(0, latestMkt.visitas_site - latestMkt.visitas_organicas - latestMkt.visitas_pagas) },
  ].filter(d => d.value > 0) : [];

  // ─── Anúncios derived metrics ───
  const adsHistory = marketing.map(m => {
    const ctr = m.impressoes_ads > 0 ? (m.cliques_ads / m.impressoes_ads) * 100 : 0;
    const cpc = m.cliques_ads > 0 ? m.custo_ads / m.cliques_ads : 0;
    const cpa = m.conversoes_ads > 0 ? m.custo_ads / m.conversoes_ads : 0;
    const convRate = m.cliques_ads > 0 ? (m.conversoes_ads / m.cliques_ads) * 100 : 0;
    return {
      mes: formatMonth(m.periodo_mes),
      mesFull: formatMonthFull(m.periodo_mes),
      impressoes: m.impressoes_ads,
      cliques: m.cliques_ads,
      custo: m.custo_ads,
      conversoes: m.conversoes_ads,
      ctr,
      cpc,
      cpa,
      convRate,
    };
  });

  const latestAds = adsHistory.length > 0 ? adsHistory[adsHistory.length - 1] : null;
  const prevAds = adsHistory.length > 1 ? adsHistory[adsHistory.length - 2] : null;

  const totalAdsInvestido = marketing.reduce((s, m) => s + m.custo_ads, 0);
  const totalAdsConversoes = marketing.reduce((s, m) => s + m.conversoes_ads, 0);
  const totalAdsCliques = marketing.reduce((s, m) => s + m.cliques_ads, 0);
  const totalAdsImpressoes = marketing.reduce((s, m) => s + m.impressoes_ads, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 max-w-6xl mx-auto">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const MktKPI = ({ label, value, icon: Icon, delta, prefix }: { label: string; value: string; icon: React.ElementType; delta?: number; prefix?: string }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-xl bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide">RISCAMUNDO</h1>
              <p className="text-xs text-muted-foreground">Portal do Cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{cliente?.nome || user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <AnimatedPage>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-bold">Olá, {cliente?.nome || 'Cliente'} 👋</h2>
            <p className="text-muted-foreground text-sm mt-1">Acompanhe seus procedimentos, anúncios e resultados de marketing.</p>
          </div>

          <Tabs defaultValue="procedimentos" className="space-y-6">
            <TabsList className="flex-wrap">
              <TabsTrigger value="procedimentos" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Procedimentos</TabsTrigger>
              <TabsTrigger value="anuncios" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Anúncios</TabsTrigger>
              <TabsTrigger value="seo" className="gap-1.5"><Search className="h-3.5 w-3.5" /> SEO</TabsTrigger>
              <TabsTrigger value="marketing" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Marketing Digital</TabsTrigger>
              <TabsTrigger value="dados" className="gap-1.5"><User className="h-3.5 w-3.5" /> Meus Dados</TabsTrigger>
            </TabsList>

            {/* ═══════════ PROCEDIMENTOS TAB ═══════════ */}
            <TabsContent value="procedimentos" className="space-y-6">
              {/* KPI Cards */}
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StaggerItem>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10"><ShoppingBag className="h-5 w-5 text-primary" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Procedimentos</p>
                        <p className="text-xl font-bold">{totalProcedimentos}</p>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/10"><DollarSign className="h-5 w-5 text-accent" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Investido</p>
                        <p className="text-xl font-bold">R$ {totalGasto.toLocaleString('pt-BR')}</p>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-chart-3/10"><Hash className="h-5 w-5 text-[hsl(var(--chart-3))]" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ticket Médio</p>
                        <p className="text-xl font-bold">R$ {ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                        <p className="text-xl font-bold">{pendentes.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>

              {/* Charts: Category breakdown + Monthly spending */}
              {concluidos.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Monthly spending trend */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> Investimento Mensal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={monthlySpending}>
                          <defs>
                            <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                          <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                          <YAxis fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                          <Area type="monotone" dataKey="valor" name="Investimento" stroke="hsl(217, 91%, 60%)" fill="url(#colorValor)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Category pie */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" /> Por Categoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      {categoriaBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={categoriaBreakdown}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              innerRadius={45}
                              paddingAngle={4}
                              strokeWidth={0}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                              fontSize={10}
                            >
                              {categoriaBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string, props: any) => [`${v} procedimentos (R$ ${props.payload.total.toLocaleString('pt-BR')})`, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sem dados</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Payment method breakdown */}
              {paymentBreakdown.length > 1 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" /> Formas de Pagamento
                    </CardTitle>
                  </CardHeader>
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

              {/* Pendentes */}
              {pendentes.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" /> Atendimentos em Andamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendentes.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                          <div>
                            <p className="text-sm font-medium">{v.nome_procedimento || 'Procedimento'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <CalendarDays className="h-3 w-3" />
                              {new Date(v.data_venda).toLocaleDateString('pt-BR')}
                              {v.categoria && (
                                <>
                                  <span>·</span>
                                  <Layers className="h-3 w-3" />
                                  {categoriaLabels[v.categoria] || v.categoria}
                                </>
                              )}
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

              {/* Histórico completo */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Histórico Completo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vendas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Nenhum procedimento registrado ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vendas.sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime()).map(v => {
                        const st = statusConfig[v.status] || statusConfig.fechado;
                        const StIcon = st.icon;
                        return (
                          <motion.div
                            key={v.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <StIcon className={`h-4 w-4 ${st.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{v.nome_procedimento || 'Procedimento'}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(v.data_venda).toLocaleDateString('pt-BR')}
                                {v.categoria && (
                                  <>
                                    <span>·</span>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">{categoriaLabels[v.categoria] || v.categoria}</Badge>
                                  </>
                                )}
                                {v.forma_pagamento && (
                                  <>
                                    <span>·</span>
                                    <CreditCard className="h-3 w-3" />
                                    {paymentLabels[v.forma_pagamento] || v.forma_pagamento}
                                  </>
                                )}
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

            {/* ═══════════ ANÚNCIOS TAB ═══════════ */}
            <TabsContent value="anuncios" className="space-y-6">
              {marketing.length === 0 || !latestAds ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="text-sm font-semibold mb-1">Anúncios</h3>
                    <p className="text-sm text-muted-foreground">Seus relatórios de anúncios aparecerão aqui em breve.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Ads KPIs */}
                  <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StaggerItem>
                      <MktKPI
                        label="Impressões"
                        value={latestAds.impressoes.toLocaleString('pt-BR')}
                        icon={Eye}
                        delta={prevAds ? calcDelta(latestAds.impressoes, prevAds.impressoes) : undefined}
                      />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI
                        label="Cliques"
                        value={latestAds.cliques.toLocaleString('pt-BR')}
                        icon={MousePointerClick}
                        delta={prevAds ? calcDelta(latestAds.cliques, prevAds.cliques) : undefined}
                      />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI
                        label="CTR"
                        value={`${latestAds.ctr.toFixed(2)}%`}
                        icon={Percent}
                        delta={prevAds ? calcDelta(latestAds.ctr, prevAds.ctr) : undefined}
                      />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI
                        label="CPC Médio"
                        value={latestAds.cpc.toFixed(2)}
                        icon={DollarSign}
                        prefix="R$ "
                        delta={prevAds ? calcDelta(prevAds.cpc, latestAds.cpc) : undefined}
                      />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI
                        label="Conversões"
                        value={latestAds.conversoes.toString()}
                        icon={Zap}
                        delta={prevAds ? calcDelta(latestAds.conversoes, prevAds.conversoes) : undefined}
                      />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI
                        label="Investimento"
                        value={latestAds.custo.toLocaleString('pt-BR')}
                        icon={DollarSign}
                        prefix="R$ "
                      />
                    </StaggerItem>
                  </StaggerContainer>

                  {/* Ads Performance Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Cost vs Conversions over time */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" /> Custo vs Conversões
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={adsHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                            <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                            <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => name === 'Custo' ? `R$ ${v.toLocaleString('pt-BR')}` : v} />
                            <Legend fontSize={11} />
                            <Bar yAxisId="left" dataKey="custo" name="Custo" fill="hsl(38, 92%, 50%)" radius={[6, 6, 0, 0]} barSize={20} opacity={0.8} />
                            <Bar yAxisId="right" dataKey="conversoes" name="Conversões" fill="hsl(160, 84%, 39%)" radius={[6, 6, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* CTR & CPC evolution */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" /> Evolução CTR & CPC
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={adsHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                            <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                            <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} tickFormatter={v => `R$${v.toFixed(1)}`} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => name === 'CTR' ? `${v.toFixed(2)}%` : `R$ ${v.toFixed(2)}`} />
                            <Legend fontSize={11} />
                            <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR" stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(217, 91%, 60%)' }} />
                            <Line yAxisId="right" type="monotone" dataKey="cpc" name="CPC" stroke="hsl(262, 52%, 56%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(262, 52%, 56%)' }} strokeDasharray="6 3" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Impressions & Clicks evolution */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" /> Impressões & Cliques
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={adsHistory}>
                          <defs>
                            <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCliq" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 93%)" vertical={false} />
                          <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                          <YAxis fontSize={11} stroke="hsl(220, 9%, 46%)" axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toLocaleString('pt-BR')} />
                          <Legend fontSize={11} />
                          <Area type="monotone" dataKey="impressoes" name="Impressões" stroke="hsl(217, 91%, 60%)" fill="url(#colorImp)" strokeWidth={2} />
                          <Area type="monotone" dataKey="cliques" name="Cliques" stroke="hsl(160, 84%, 39%)" fill="url(#colorCliq)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Totals summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Investido</p>
                        <p className="text-lg font-bold">R$ {totalAdsInvestido.toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-muted-foreground">{marketing.length} meses</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-accent/5 border-accent/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Conversões</p>
                        <p className="text-lg font-bold">{totalAdsConversoes.toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-muted-foreground">CPA: R$ {totalAdsConversoes > 0 ? (totalAdsInvestido / totalAdsConversoes).toFixed(2) : '—'}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-chart-3/5 border-[hsl(var(--chart-3))]/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Cliques</p>
                        <p className="text-lg font-bold">{totalAdsCliques.toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-muted-foreground">CPC: R$ {totalAdsCliques > 0 ? (totalAdsInvestido / totalAdsCliques).toFixed(2) : '—'}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-warning/5 border-warning/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Impressões</p>
                        <p className="text-lg font-bold">{totalAdsImpressoes.toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-muted-foreground">CTR geral: {totalAdsImpressoes > 0 ? ((totalAdsCliques / totalAdsImpressoes) * 100).toFixed(2) : '0'}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Monthly details table */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Histórico Mensal de Anúncios
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/30">
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Período</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Impressões</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Cliques</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">CTR</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Custo</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">CPC</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Conversões</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">CPA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...adsHistory].reverse().map((row, i) => (
                              <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="p-3 font-medium capitalize">{row.mesFull}</td>
                                <td className="p-3 text-right">{row.impressoes.toLocaleString('pt-BR')}</td>
                                <td className="p-3 text-right">{row.cliques.toLocaleString('pt-BR')}</td>
                                <td className="p-3 text-right">
                                  <Badge variant="outline" className={`text-[10px] ${row.ctr >= 2 ? 'text-accent border-accent' : row.ctr >= 1 ? 'text-warning border-warning' : 'text-destructive border-destructive'}`}>
                                    {row.ctr.toFixed(2)}%
                                  </Badge>
                                </td>
                                <td className="p-3 text-right">R$ {row.custo.toLocaleString('pt-BR')}</td>
                                <td className="p-3 text-right">R$ {row.cpc.toFixed(2)}</td>
                                <td className="p-3 text-right font-semibold">{row.conversoes}</td>
                                <td className="p-3 text-right">R$ {row.cpa > 0 ? row.cpa.toFixed(2) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* ═══════════ MARKETING TAB ═══════════ */}
            <TabsContent value="marketing" className="space-y-6">
              {marketing.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="text-sm font-semibold mb-1">Marketing Digital</h3>
                    <p className="text-sm text-muted-foreground">Seus relatórios de marketing aparecerão aqui em breve.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* KPIs */}
                  <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StaggerItem>
                      <MktKPI label="Visitas/Mês" value={latestMkt!.visitas_site.toLocaleString('pt-BR')} icon={Globe} delta={prevMkt ? calcDelta(latestMkt!.visitas_site, prevMkt.visitas_site) : undefined} />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI label="Leads Gerados" value={latestMkt!.leads_gerados.toString()} icon={Target} delta={prevMkt ? calcDelta(latestMkt!.leads_gerados, prevMkt.leads_gerados) : undefined} />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI label="Investimento Ads" value={latestMkt!.custo_ads.toLocaleString('pt-BR')} icon={MousePointerClick} prefix="R$ " />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI label="Conversões" value={latestMkt!.conversoes_ads.toString()} icon={CheckCircle2} delta={prevMkt ? calcDelta(latestMkt!.conversoes_ads, prevMkt.conversoes_ads) : undefined} />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI label="Seguidores" value={latestMkt!.seguidores_total.toLocaleString('pt-BR')} icon={Users} delta={prevMkt ? calcDelta(latestMkt!.seguidores_total, prevMkt.seguidores_total) : undefined} />
                    </StaggerItem>
                    <StaggerItem>
                      <MktKPI label="Engajamento" value={`${latestMkt!.engajamento_rate}%`} icon={MessageSquare} delta={prevMkt ? calcDelta(latestMkt!.engajamento_rate, prevMkt.engajamento_rate) : undefined} />
                    </StaggerItem>
                  </StaggerContainer>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" /> Evolução de Tráfego
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={trafegoData}>
                            <defs>
                              <linearGradient id="colorOrg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                              </linearGradient>
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
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Eye className="h-4 w-4 text-primary" /> Fontes de Tráfego
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center justify-center">
                        {trafficPie.length > 0 ? (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={trafficPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={4} strokeWidth={0} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                                {trafficPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sem dados</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row 2 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" /> Geração de Leads
                        </CardTitle>
                      </CardHeader>
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
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" /> Evolução Redes Sociais
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={socialData}>
                            <defs>
                              <linearGradient id="colorSeg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(262, 52%, 56%)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(262, 52%, 56%)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
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
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" /> Resumo do Mês
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{latestMkt.observacoes}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ═══════════ DADOS TAB ═══════════ */}
            <TabsContent value="dados">
              {cliente && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" /> Meus Dados
                    </CardTitle>
                  </CardHeader>
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
          </Tabs>
        </div>
      </AnimatedPage>
    </div>
  );
}
