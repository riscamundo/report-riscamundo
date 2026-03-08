import { useEffect, useState, useMemo, useCallback } from 'react';
import { useStoreContext } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard, PageHeader } from '@/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { toast } from 'sonner';
import {
  calcFaturamentoMes, calcInvestimentoTotal, calcROI, calcTicketMedio,
  calcConversao, calcCombosPremium, getLeadsPorEtapa, getReceitaPorProcedimento,
  calcAlertas, calcForecast
} from '@/lib/metrics';
import {
  DollarSign, TrendingUp, Target, CreditCard, Users, AlertTriangle,
  Clock, Briefcase, Wallet, ShieldAlert, UserX, Receipt,
  ArrowUpRight, ArrowDownRight, Phone, BarChart3, Zap,
  Plus, Edit2, UserPlus, PhoneCall, CalendarDays, Search,
  Globe, Megaphone, Share2, Store, Eye, MousePointerClick,
  Hash, Percent, ExternalLink, MoveUp, MoveDown, Minus, Link2,
  Star, MapPin, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['hsl(42, 70%, 55%)', 'hsl(160, 50%, 45%)', 'hsl(262, 40%, 55%)', 'hsl(200, 60%, 50%)', 'hsl(340, 55%, 55%)', 'hsl(180, 45%, 50%)'];
const tooltipStyle = { background: 'hsl(225, 14%, 13%)', border: '1px solid hsl(225, 12%, 20%)', borderRadius: '10px', boxShadow: '0 8px 30px -8px rgb(0 0 0 / 0.5)', fontSize: '12px', color: 'hsl(210, 20%, 85%)' };
const gridStroke = 'hsl(225, 12%, 18%)';
const axisStroke = 'hsl(215, 10%, 40%)';

interface ClienteResumo {
  id: string;
  nome: string;
  status: string;
  mensalidade_valor: number;
  acesso_liberado: boolean;
}

interface FinanceiroRow {
  id: string;
  cliente_id: string;
  valor: number;
  status: string;
  data_vencimento: string;
  descricao: string | null;
  tipo: string;
}

interface TarefaPendente {
  id: string;
  titulo: string;
  status: string;
  prioridade: string | null;
  cliente_nome: string;
  updated_at: string;
}

export default function ExecutiveDashboard() {
  const { procedimentos, campanhas, leads, vendas, loading } = useStoreContext();
  const { isMaster } = useAuth();
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [financeiro, setFinanceiro] = useState<FinanceiroRow[]>([]);
  const [tarefasPendentes, setTarefasPendentes] = useState<TarefaPendente[]>([]);
  const [contatos, setContatos] = useState<any[]>([]);
  const [contatoOpen, setContatoOpen] = useState(false);
  const [editContato, setEditContato] = useState<any | null>(null);
  const [contatoSearch, setContatoSearch] = useState('');
  const [contatoFilter, setContatoFilter] = useState('all');

  // ─── Client Reports State ───
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [clientMarketing, setClientMarketing] = useState<any[]>([]);
  const [clientSeoKeywords, setClientSeoKeywords] = useState<any[]>([]);
  const [clientSeoPages, setClientSeoPages] = useState<any[]>([]);
  const [clientAnuncios, setClientAnuncios] = useState<any[]>([]);
  const [clientSocial, setClientSocial] = useState<any[]>([]);
  const [clientMybusiness, setClientMybusiness] = useState<any | null>(null);
  const [clientCompetitors, setClientCompetitors] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const fetchExtra = async () => {
      const [cRes, fRes, tRes, ctRes] = await Promise.all([
        supabase.from('clientes').select('id, nome, status, mensalidade_valor, acesso_liberado').order('nome'),
        supabase.from('financeiro' as any).select('id, cliente_id, valor, status, data_vencimento, descricao, tipo').order('data_vencimento', { ascending: false }).limit(200),
        supabase.from('tarefas_cliente').select('id, titulo, status, prioridade, updated_at, cliente_id').neq('status', 'pronta').order('updated_at', { ascending: true }).limit(20),
        supabase.from('contatos_ativacao' as any).select('*').order('proximo_contato', { ascending: true }),
      ]);
      setClientes((cRes.data || []) as ClienteResumo[]);
      setFinanceiro((fRes.data || []) as unknown as FinanceiroRow[]);
      setContatos((ctRes.data || []) as any[]);

      if (tRes.data && tRes.data.length > 0) {
        const clienteIds = [...new Set(tRes.data.map(t => t.cliente_id))];
        const { data: cData } = await supabase.from('clientes').select('id, nome').in('id', clienteIds);
        const cMap = new Map((cData || []).map(c => [c.id, c.nome]));
        setTarefasPendentes(tRes.data.map(t => ({
          id: t.id, titulo: t.titulo, status: t.status, prioridade: t.prioridade,
          cliente_nome: cMap.get(t.cliente_id) || 'Cliente', updated_at: t.updated_at,
        })));
      }
    };
    fetchExtra();
  }, []);

  const refreshContatos = async () => {
    const { data } = await supabase.from('contatos_ativacao' as any).select('*').order('proximo_contato', { ascending: true });
    setContatos((data || []) as any[]);
  };

  // ─── Fetch client reports when selected ───
  const fetchClientReports = useCallback(async (cid: string) => {
    if (!cid) return;
    setReportLoading(true);
    const [mktRes, kwRes, pgRes, anunciosRes, socialRes, mbRes, compRes] = await Promise.all([
      supabase.from('marketing_reports').select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: true }),
      supabase.from('seo_keywords').select('*').eq('cliente_id', cid).order('posicao_atual', { ascending: true }),
      supabase.from('seo_pages').select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: false }),
      supabase.from('anuncios').select('*').eq('cliente_id', cid).order('created_at', { ascending: false }),
      supabase.from('social_media_accounts' as any).select('*').eq('cliente_id', cid),
      supabase.from('mybusiness_profiles' as any).select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('mybusiness_competitors' as any).select('*').eq('cliente_id', cid),
    ]);
    setClientMarketing((mktRes.data || []) as any[]);
    setClientSeoKeywords((kwRes.data || []) as any[]);
    setClientSeoPages((pgRes.data || []) as any[]);
    setClientAnuncios((anunciosRes.data || []) as any[]);
    setClientSocial((socialRes.data || []) as any[]);
    setClientMybusiness(mbRes.data || null);
    setClientCompetitors((compRes.data || []) as any[]);
    setReportLoading(false);
  }, []);

  useEffect(() => {
    if (selectedClienteId) fetchClientReports(selectedClienteId);
  }, [selectedClienteId, fetchClientReports]);

  const handleSaveContato = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome: fd.get('nome') as string,
      telefone: fd.get('telefone') as string || null,
      whatsapp: fd.get('whatsapp') as string || null,
      email: fd.get('email') as string || null,
      site: fd.get('site') as string || null,
      origem: fd.get('origem') as string || 'manual',
      motivo_inatividade: fd.get('motivo') as string || null,
      ultimo_contato: fd.get('ultimo_contato') as string || null,
      proximo_contato: fd.get('proximo_contato') as string || null,
      status: fd.get('status') as string || 'pendente',
      observacoes: fd.get('observacoes') as string || null,
    };
    if (editContato) {
      const { error } = await supabase.from('contatos_ativacao' as any).update(payload).eq('id', editContato.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Contato atualizado!');
    } else {
      const { error } = await supabase.from('contatos_ativacao' as any).insert(payload);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Contato adicionado!');
    }
    setContatoOpen(false);
    setEditContato(null);
    refreshContatos();
  };

  const handleContatoStatus = async (id: string, status: string) => {
    await supabase.from('contatos_ativacao' as any).update({ status }).eq('id', id);
    refreshContatos();
  };


  const faturamento = calcFaturamentoMes(vendas);
  const investimento = calcInvestimentoTotal(campanhas);
  const roi = calcROI(vendas, campanhas);
  const ticketMedio = calcTicketMedio(vendas);
  const conversao = calcConversao(leads, vendas);
  const forecast = calcForecast(leads, vendas, procedimentos);
  const alertas = calcAlertas(procedimentos, campanhas, leads, vendas);
  const funilData = getLeadsPorEtapa(leads);
  const receitaProc = getReceitaPorProcedimento(vendas, procedimentos);

  const clientesAtivos = clientes.filter(c => c.status === 'ativo').length;
  const clientesBloqueados = clientes.filter(c => !c.acesso_liberado).length;

  // Financial alerts
  const now = new Date();
  const boletosVencidos = financeiro.filter(f => f.status === 'pendente' && new Date(f.data_vencimento) < now);
  const boletosPendentes = financeiro.filter(f => f.status === 'pendente');
  const totalReceber = boletosPendentes.reduce((s, f) => s + (f.valor || 0), 0);
  const totalVencido = boletosVencidos.reduce((s, f) => s + (f.valor || 0), 0);
  const receitaMensalidades = clientes.filter(c => c.status === 'ativo').reduce((s, c) => s + (c.mensalidade_valor || 0), 0);

  // Leads sem contato >24h
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const leadsParados = leads.filter(l => l.status_funil === 'novo' && new Date(l.created_at).getTime() < oneDayAgo);

  // Monthly revenue trend
  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    vendas.filter(v => v.status === 'fechado').forEach(v => {
      const m = v.data_venda.slice(0, 7);
      map[m] = (map[m] || 0) + v.valor_venda;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([m, v]) => ({
      mes: new Date(m + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }),
      receita: v,
    }));
  }, [vendas]);

  // Leads by origin
  const leadsByOrigin = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => { const o = l.origem || 'Direto'; map[o] = (map[o] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ nome: k, count: v }));
  }, [leads]);

  // Clientes com boletos vencidos
  const clientesComVencidos = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; count: number }>();
    boletosVencidos.forEach(b => {
      const c = clientes.find(cl => cl.id === b.cliente_id);
      if (!c) return;
      const curr = map.get(c.id) || { nome: c.nome, total: 0, count: 0 };
      curr.total += b.valor || 0;
      curr.count += 1;
      map.set(c.id, curr);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [boletosVencidos, clientes]);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground animate-pulse text-sm">Carregando dados...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Build all critical alerts
  const criticalAlerts: { icon: typeof AlertTriangle; color: string; bg: string; message: string }[] = [];

  if (boletosVencidos.length > 0) {
    criticalAlerts.push({
      icon: Wallet, color: 'text-destructive', bg: 'bg-destructive/10',
      message: `${boletosVencidos.length} boleto(s) vencido(s) totalizando ${fmt(totalVencido)}`,
    });
  }
  if (leadsParados.length > 0) {
    criticalAlerts.push({
      icon: UserX, color: 'text-destructive', bg: 'bg-destructive/10',
      message: `${leadsParados.length} lead(s) sem contato há mais de 24h`,
    });
  }
  alertas.filter(a => a.severidade === 'critico').forEach(a => {
    criticalAlerts.push({
      icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10',
      message: a.mensagem,
    });
  });
  if (clientesBloqueados > 0) {
    criticalAlerts.push({
      icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10',
      message: `${clientesBloqueados} cliente(s) com acesso bloqueado`,
    });
  }
  alertas.filter(a => a.severidade === 'atencao').forEach(a => {
    criticalAlerts.push({
      icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10',
      message: a.mensagem,
    });
  });

  const SectionDivider = ({ title, subtitle, icon: SIcon }: { title: string; subtitle: string; icon: typeof Briefcase }) => (
    <div className="flex items-center gap-4 mb-6 mt-12 first:mt-0">
      <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <SIcon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground font-display">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader
          title="Dashboard Executivo"
          subtitle="Visão consolidada da agência e dos clientes · Pontos críticos e alertas"
        />

        {/* ═══ ALERTAS CRÍTICOS ═══ */}
        {criticalAlerts.length > 0 && (
          <Card className="mb-8 border-destructive/15 bg-destructive/[0.03] executive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas Críticos
                <Badge variant="destructive" className="ml-auto text-[10px]">{criticalAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criticalAlerts.map((alert, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card">
                    <div className={`p-1.5 rounded-lg ${alert.bg}`}>
                      <alert.icon className={`h-3.5 w-3.5 ${alert.color}`} />
                    </div>
                    <p className="text-sm flex-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ╔══════════════════════════════════════════════╗ */}
        {/* ║  SEÇÃO 1 — AGÊNCIA (Nossos números internos) ║ */}
        {/* ╚══════════════════════════════════════════════╝ */}
        <SectionDivider title="Nossa Agência" subtitle="Financeiro, clientes, mensalidades e prospecção" icon={Briefcase} />

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <StaggerItem><KPICard title="Clientes Ativos" value={clientesAtivos.toString()} icon={Briefcase} variant="primary" /></StaggerItem>
          <StaggerItem><KPICard title="Mensalidades/Mês" value={fmt(receitaMensalidades)} icon={Receipt} /></StaggerItem>
          <StaggerItem><KPICard title="A Receber" value={fmt(totalReceber)} subtitle={`${boletosPendentes.length} pendentes`} icon={Wallet} /></StaggerItem>
          <StaggerItem><KPICard title="Ticket Médio" value={fmt(ticketMedio)} icon={CreditCard} /></StaggerItem>
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Inadimplência */}
          <Card className="executive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
                <Wallet className="h-4 w-4 text-destructive" /> Inadimplência por Cliente
                {clientesComVencidos.length > 0 && <Badge variant="destructive" className="ml-auto text-[10px]">{clientesComVencidos.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientesComVencidos.length > 0 ? (
                <div className="space-y-2">
                  {clientesComVencidos.slice(0, 8).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                      <div className="p-1.5 rounded-lg bg-destructive/10"><Receipt className="h-3.5 w-3.5 text-destructive" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.nome}</p>
                        <p className="text-[11px] text-muted-foreground">{c.count} boleto(s) vencido(s)</p>
                      </div>
                      <span className="text-sm font-bold text-destructive">{fmt(c.total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">Nenhum boleto vencido 🎉</div>
              )}
            </CardContent>
          </Card>

          {/* Tarefas pendentes */}
          <Card className="executive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
                <Clock className="h-4 w-4 text-primary" /> Tarefas Pendentes de Clientes
                <Badge variant="outline" className="ml-auto text-[10px]">{tarefasPendentes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tarefasPendentes.length > 0 ? (
                <div className="space-y-2">
                  {tarefasPendentes.slice(0, 8).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/20 transition-colors">
                      <div className={`p-1.5 rounded-lg ${t.prioridade === 'alta' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <Zap className={`h-3.5 w-3.5 ${t.prioridade === 'alta' ? 'text-destructive' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.titulo}</p>
                        <p className="text-[11px] text-muted-foreground">{t.cliente_nome} · {t.status}</p>
                      </div>
                      {t.prioridade === 'alta' && <Badge variant="outline" className="text-[10px] text-destructive border-destructive">Urgente</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">Sem tarefas pendentes ✅</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contatos para ativação */}
        <Card className="mb-8 executive-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
              <UserPlus className="h-4 w-4 text-primary" /> Contatos para Ativação
              <Badge variant="outline" className="ml-2 text-[10px]">{contatos.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar..." value={contatoSearch} onChange={e => setContatoSearch(e.target.value)} className="pl-8 h-8 text-xs" />
              </div>
              <Select value={contatoFilter} onValueChange={setContatoFilter}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="contatado">Contatados</SelectItem>
                  <SelectItem value="ativado">Ativados</SelectItem>
                  <SelectItem value="descartado">Descartados</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={contatoOpen} onOpenChange={(o) => { setContatoOpen(o); if (!o) setEditContato(null); }}>
                <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Novo Contato</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editContato ? 'Editar' : 'Novo'} Contato</DialogTitle></DialogHeader>
                  <form onSubmit={handleSaveContato} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Nome *</Label><Input name="nome" defaultValue={editContato?.nome} required className="mt-1" /></div>
                      <div><Label>Telefone</Label><Input name="telefone" defaultValue={editContato?.telefone} placeholder="(00) 00000-0000" className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>WhatsApp</Label>
                        <div className="flex gap-1.5 mt-1">
                          <Input name="whatsapp" defaultValue={editContato?.whatsapp} placeholder="5500000000000" className="flex-1" />
                          {editContato?.whatsapp && (
                            <Button type="button" variant="outline" size="icon" className="shrink-0 h-9 w-9 text-accent border-accent/30 hover:bg-accent/10" onClick={() => {
                              const num = editContato.whatsapp.replace(/\D/g, '');
                              window.open(`https://wa.me/${num}`, '_blank');
                            }} title="Enviar WhatsApp">
                              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </Button>
                          )}
                        </div>
                      </div>
                      <div><Label>Site</Label><Input name="site" defaultValue={editContato?.site} placeholder="https://..." className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>E-mail</Label><Input name="email" type="email" defaultValue={editContato?.email} className="mt-1" /></div>
                      <div><Label>Origem</Label>
                        <Select name="origem" defaultValue={editContato?.origem || 'manual'}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="indicacao">Indicação</SelectItem>
                            <SelectItem value="ex_cliente">Ex-cliente</SelectItem>
                            <SelectItem value="campanha">Campanha</SelectItem>
                            <SelectItem value="rede_social">Rede Social</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Motivo da Inatividade</Label><Input name="motivo" defaultValue={editContato?.motivo_inatividade} placeholder="Ex: não fechou por preço, desistiu do tratamento..." className="mt-1" /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>Último Contato</Label><Input name="ultimo_contato" type="date" defaultValue={editContato?.ultimo_contato} className="mt-1" /></div>
                      <div><Label>Próximo Contato</Label><Input name="proximo_contato" type="date" defaultValue={editContato?.proximo_contato} className="mt-1" /></div>
                      <div><Label>Status</Label>
                        <Select name="status" defaultValue={editContato?.status || 'pendente'}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="contatado">Contatado</SelectItem>
                            <SelectItem value="ativado">Ativado</SelectItem>
                            <SelectItem value="descartado">Descartado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Observações</Label><Textarea name="observacoes" defaultValue={editContato?.observacoes} className="mt-1" rows={2} /></div>
                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              let filtered = contatos;
              if (contatoFilter !== 'all') filtered = filtered.filter(c => c.status === contatoFilter);
              if (contatoSearch.trim()) {
                const q = contatoSearch.toLowerCase();
                filtered = filtered.filter(c => c.nome?.toLowerCase().includes(q) || c.telefone?.includes(q) || c.email?.toLowerCase().includes(q));
              }
              const today = new Date().toISOString().slice(0, 10);
              const pendentesHoje = filtered.filter(c => c.proximo_contato && c.proximo_contato <= today && c.status === 'pendente');
              const outros = filtered.filter(c => !pendentesHoje.includes(c));

              return filtered.length > 0 ? (
                <div className="space-y-2">
                  {pendentesHoje.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1"><PhoneCall className="h-3.5 w-3.5" /> Contatar hoje ({pendentesHoje.length})</p>
                      {pendentesHoje.map(c => (
                        <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 mb-1.5">
                          <div className="p-1.5 rounded-lg bg-destructive/10"><PhoneCall className="h-3.5 w-3.5 text-destructive" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.nome}</p>
                            <p className="text-[11px] text-muted-foreground">{c.telefone || c.email || 'Sem contato'} · {c.motivo_inatividade || c.origem}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {c.whatsapp && (
                              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 text-accent border-accent/30 hover:bg-accent/10" onClick={() => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`, '_blank')}>
                                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Zap
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleContatoStatus(c.id, 'contatado')}>
                              <PhoneCall className="h-3 w-3" /> Contatado
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7" onClick={() => { setEditContato(c); setContatoOpen(true); }}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {outros.slice(0, 10).map(c => {
                      const statusColor = c.status === 'ativado' ? 'text-accent border-accent' : c.status === 'contatado' ? 'text-primary border-primary' : c.status === 'descartado' ? 'text-muted-foreground' : 'text-warning border-warning';
                      return (
                        <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/20 transition-colors">
                          <div className="p-1.5 rounded-lg bg-primary/10"><UserPlus className="h-3.5 w-3.5 text-primary" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.nome}</p>
                            <p className="text-[11px] text-muted-foreground">{c.telefone || c.email || 'Sem contato'} · {c.motivo_inatividade || c.origem}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {c.whatsapp && (
                              <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-accent border-accent/30 hover:bg-accent/10" onClick={() => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`, '_blank')} title="Enviar WhatsApp">
                                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              </Button>
                            )}
                            <Badge variant="outline" className={`text-[10px] ${statusColor}`}>{c.status}</Badge>
                            {c.proximo_contato && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><CalendarDays className="h-3 w-3" />{new Date(c.proximo_contato + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                            )}
                            <Button variant="ghost" size="sm" className="h-7" onClick={() => { setEditContato(c); setContatoOpen(true); }}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {outros.length > 10 && <p className="text-xs text-muted-foreground text-center mt-2">+ {outros.length - 10} contatos</p>}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {contatos.length === 0 ? 'Nenhum contato cadastrado. Adicione contatos inativos para trabalhar a ativação.' : 'Nenhum contato encontrado com esse filtro.'}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* ╔══════════════════════════════════════════════════════╗ */}
        {/* ║  SEÇÃO 2 — VENDAS & CRM (Dados dos nossos clientes) ║ */}
        {/* ╚══════════════════════════════════════════════════════╝ */}
        <SectionDivider title="Vendas & Performance dos Clientes" subtitle="Faturamento, leads, funil e receita dos serviços prestados" icon={BarChart3} />

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <StaggerItem><KPICard title="Faturamento Mês" value={fmt(faturamento)} icon={DollarSign} variant="primary" /></StaggerItem>
          <StaggerItem><KPICard title="Receita Projetada" value={fmt(forecast.receitaProjetadaMensal)} subtitle={`${forecast.leadsAtivos} leads ativos`} icon={TrendingUp} /></StaggerItem>
          <StaggerItem><KPICard title="ROI Atual" value={`${roi.toFixed(1)}x`} icon={Target} trend={roi >= 8 ? 'up' : 'down'} variant={roi >= 8 ? 'success' : 'default'} /></StaggerItem>
          <StaggerItem><KPICard title="Conversão" value={`${conversao.toFixed(1)}%`} icon={Users} variant="success" /></StaggerItem>
        </StaggerContainer>

        {/* Leads parados */}
        {leadsParados.length > 0 && (
          <Card className="mb-8 executive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
                <Phone className="h-4 w-4 text-warning" /> Leads Sem Contato (&gt;24h)
                <Badge className="ml-auto text-[10px] bg-warning/20 text-warning border-0">{leadsParados.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leadsParados.slice(0, 8).map(lead => {
                  const days = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  const proc = procedimentos.find(p => p.id === lead.procedimento_interesse);
                  return (
                    <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-warning/5 border border-warning/10">
                      <div className="p-1.5 rounded-lg bg-warning/10"><UserX className="h-3.5 w-3.5 text-warning" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.nome}</p>
                        <p className="text-[11px] text-muted-foreground">{proc?.nome_procedimento || 'Sem serviço'} · {lead.origem || 'Direto'}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${days > 3 ? 'border-destructive text-destructive' : 'border-warning text-warning'}`}>
                        <Clock className="h-3 w-3 mr-0.5" />{days}d
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráficos de vendas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 executive-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans">Receita Mensal</CardTitle></CardHeader>
            <CardContent>
              {monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={monthlyRevenue}>
                    <defs><linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0.25}/><stop offset="95%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                    <YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="receita" stroke="hsl(42, 70%, 55%)" fill="url(#gradReceita)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de receita</div>}
            </CardContent>
          </Card>

          <Card className="executive-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans">Leads por Origem</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              {leadsByOrigin.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={leadsByOrigin} dataKey="count" nameKey="nome" cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={4} strokeWidth={0}
                      label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {leadsByOrigin.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="executive-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans">Funil de Vendas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funilData.filter(f => f.etapa !== 'perdido').map((f, i) => {
                  const maxCount = Math.max(...funilData.map(x => x.count), 1);
                  const width = (f.count / maxCount) * 100;
                  return (
                    <div key={f.etapa}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground text-xs font-medium">{f.label}</span>
                        <span className="font-semibold text-xs">{f.count} leads</span>
                      </div>
                      <div className="h-7 bg-muted/60 rounded-lg overflow-hidden">
                        <div className="h-full rounded-lg transition-all duration-700 ease-out" style={{ width: `${Math.max(width, 2)}%`, background: COLORS[i % COLORS.length], opacity: 0.85 }} />
                      </div>
                    </div>
                  );
                })}
                {funilData.find(f => f.etapa === 'perdido')?.count ? (
                  <p className="text-xs text-muted-foreground text-right">{funilData.find(f => f.etapa === 'perdido')!.count} perdido(s)</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="executive-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans">Receita por Serviço</CardTitle></CardHeader>
            <CardContent>
              {receitaProc.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={receitaProc.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke={axisStroke} fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nome" width={120} stroke={axisStroke} fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="receita" fill="hsl(42, 70%, 55%)" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem vendas registradas</div>}
            </CardContent>
          </Card>
        </div>

        {/* ╔══════════════════════════════════════════════════════════╗ */}
        {/* ║  SEÇÃO 3 — REPORTS POR CLIENTE (Marketing, Ads, SEO...) ║ */}
        {/* ╚══════════════════════════════════════════════════════════╝ */}
        <SectionDivider title="Reports dos Clientes" subtitle="Marketing, Anúncios, SEO, Mídias Sociais e Google Meu Negócio" icon={Globe} />

        <div className="mb-6">
          <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
            <SelectTrigger className="w-72 h-10">
              <SelectValue placeholder="Selecione um cliente para ver os reports..." />
            </SelectTrigger>
            <SelectContent>
              {clientes.filter(c => c.status === 'ativo').map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClienteId && (
          reportLoading ? (
            <div className="flex items-center justify-center h-40"><div className="text-muted-foreground animate-pulse text-sm">Carregando reports...</div></div>
          ) : (
            <Tabs defaultValue="marketing" className="space-y-6">
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                <TabsList className="inline-flex h-auto gap-0.5 bg-transparent p-0 border-b border-border/40 w-full min-w-max">
                  {[
                    { value: 'marketing', icon: BarChart3, label: 'Marketing' },
                    { value: 'anuncios', icon: Megaphone, label: 'Anúncios' },
                    { value: 'seo', icon: Search, label: 'SEO' },
                    { value: 'social', icon: Share2, label: 'Mídias Sociais' },
                    { value: 'mybusiness', icon: Store, label: 'Google Meu Negócio' },
                  ].map(tab => {
                    const TabIcon = tab.icon;
                    return (
                      <TabsTrigger key={tab.value} value={tab.value}
                        className="relative gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] font-medium text-muted-foreground/70 transition-all duration-200 hover:text-foreground hover:bg-muted/30 data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                        <TabIcon className="h-4 w-4" />
                        <span className="whitespace-nowrap">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* ═══ MARKETING TAB ═══ */}
              <TabsContent value="marketing" className="space-y-6">
                {(() => {
                  const latestMkt = clientMarketing.length > 0 ? clientMarketing[clientMarketing.length - 1] : null;
                  const prevMkt = clientMarketing.length > 1 ? clientMarketing[clientMarketing.length - 2] : null;
                  const calcDelta = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;
                  const fmtMonth = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' });
                  const trafegoData = clientMarketing.map(m => ({ mes: fmtMonth(m.periodo_mes), organico: m.visitas_organicas, pago: m.visitas_pagas, total: m.visitas_site }));
                  const leadsData = clientMarketing.map(m => ({ mes: fmtMonth(m.periodo_mes), gerados: m.leads_gerados, qualificados: m.leads_qualificados }));
                  const socialData = clientMarketing.map(m => ({ mes: fmtMonth(m.periodo_mes), seguidores: m.seguidores_total, engajamento: m.engajamento_rate, posts: m.posts_publicados }));

                  if (!latestMkt) return <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum relatório de marketing cadastrado para este cliente.</CardContent></Card>;

                  return (
                    <>
                      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StaggerItem><Card><CardContent className="p-4"><div className="flex items-start justify-between"><div className="p-2 rounded-xl bg-primary/10"><Globe className="h-4 w-4 text-primary" /></div>{prevMkt && <span className={`text-xs font-medium ${calcDelta(latestMkt.visitas_site, prevMkt.visitas_site) > 0 ? 'text-accent' : 'text-destructive'}`}>{calcDelta(latestMkt.visitas_site, prevMkt.visitas_site) > 0 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}{Math.abs(calcDelta(latestMkt.visitas_site, prevMkt.visitas_site)).toFixed(0)}%</span>}</div><div className="mt-3"><p className="text-xs text-muted-foreground">Visitas ao Site</p><p className="text-xl font-bold">{latestMkt.visitas_site?.toLocaleString('pt-BR')}</p></div></CardContent></Card></StaggerItem>
                        <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Target className="h-4 w-4 text-primary" /></div><div className="mt-3"><p className="text-xs text-muted-foreground">Leads Gerados</p><p className="text-xl font-bold">{latestMkt.leads_gerados}</p></div></CardContent></Card></StaggerItem>
                        <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Users className="h-4 w-4 text-primary" /></div><div className="mt-3"><p className="text-xs text-muted-foreground">Seguidores</p><p className="text-xl font-bold">{latestMkt.seguidores_total?.toLocaleString('pt-BR')}</p></div></CardContent></Card></StaggerItem>
                        <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Percent className="h-4 w-4 text-primary" /></div><div className="mt-3"><p className="text-xs text-muted-foreground">Engajamento</p><p className="text-xl font-bold">{latestMkt.engajamento_rate?.toFixed(1)}%</p></div></CardContent></Card></StaggerItem>
                      </StaggerContainer>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {trafegoData.length > 1 && (
                          <Card className="executive-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Tráfego ao Site</CardTitle></CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={trafegoData}>
                                  <defs>
                                    <linearGradient id="gradOrg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(160, 50%, 45%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(160, 50%, 45%)" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="gradPago" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(42, 70%, 55%)" stopOpacity={0}/></linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                                  <XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                                  <YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                                  <Tooltip contentStyle={tooltipStyle} />
                                  <Legend fontSize={11} />
                                  <Area type="monotone" dataKey="organico" name="Orgânico" stroke="hsl(160, 50%, 45%)" fill="url(#gradOrg)" strokeWidth={2} />
                                  <Area type="monotone" dataKey="pago" name="Pago" stroke="hsl(42, 70%, 55%)" fill="url(#gradPago)" strokeWidth={2} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        )}
                        {leadsData.length > 1 && (
                          <Card className="executive-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Leads por Mês</CardTitle></CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={leadsData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                                  <XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                                  <YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                                  <Tooltip contentStyle={tooltipStyle} />
                                  <Legend fontSize={11} />
                                  <Bar dataKey="gerados" name="Gerados" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={16} />
                                  <Bar dataKey="qualificados" name="Qualificados" fill="hsl(160, 50%, 45%)" radius={[4, 4, 0, 0]} barSize={16} />
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {socialData.length > 1 && (
                        <Card className="executive-card">
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold font-sans flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" /> Evolução Social</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                              <LineChart data={socialData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                                <XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                                <YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend fontSize={11} />
                                <Line type="monotone" dataKey="seguidores" name="Seguidores" stroke="hsl(262, 40%, 55%)" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="posts" name="Posts" stroke="hsl(42, 70%, 55%)" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  );
                })()}
              </TabsContent>

              {/* ═══ ANÚNCIOS TAB ═══ */}
              <TabsContent value="anuncios" className="space-y-6">
                {clientAnuncios.length === 0 ? (
                  <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum anúncio cadastrado para este cliente.</CardContent></Card>
                ) : (() => {
                  const totalInvest = clientAnuncios.reduce((s: number, a: any) => s + a.investimento, 0);
                  const totalCliq = clientAnuncios.reduce((s: number, a: any) => s + (a.cliques || 0), 0);
                  const totalConv = clientAnuncios.reduce((s: number, a: any) => s + (a.conversoes || 0), 0);
                  const totalImp = clientAnuncios.reduce((s: number, a: any) => s + (a.impressoes || 0), 0);
                  const totalCusto = clientAnuncios.reduce((s: number, a: any) => s + (a.custo_total || 0), 0);
                  const ctrGeral = totalImp > 0 ? ((totalCliq / totalImp) * 100).toFixed(2) : '0.00';
                  const cpcGeral = totalCliq > 0 ? (totalCusto / totalCliq).toFixed(2) : '—';
                  const cpaGeral = totalConv > 0 ? (totalCusto / totalConv).toFixed(2) : '—';

                  // Group by platform
                  const byPlatform: Record<string, any[]> = {};
                  clientAnuncios.forEach((a: any) => { if (!byPlatform[a.plataforma]) byPlatform[a.plataforma] = []; byPlatform[a.plataforma].push(a); });

                  return (
                    <>
                      <Card className="executive-card bg-gradient-to-br from-primary/5 via-card to-accent/5 border-primary/20">
                        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Activity className="h-4 w-4 text-primary" /> Análise Geral<Badge className="ml-auto bg-primary/10 text-primary border-0 text-[10px]">{clientAnuncios.length} anúncios</Badge></CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Investimento</p><p className="text-lg font-bold text-primary">R$ {totalInvest.toLocaleString('pt-BR')}</p></div>
                            <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Custo Total</p><p className="text-lg font-bold">R$ {totalCusto.toLocaleString('pt-BR')}</p></div>
                            <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Impressões</p><p className="text-lg font-bold">{totalImp.toLocaleString('pt-BR')}</p></div>
                            <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cliques</p><p className="text-lg font-bold">{totalCliq.toLocaleString('pt-BR')}</p></div>
                            <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CTR</p><p className="text-lg font-bold">{ctrGeral}%</p></div>
                            <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CPC</p><p className="text-lg font-bold">R$ {cpcGeral}</p></div>
                            <div className="text-center p-3 rounded-xl bg-card/80 border border-border/50"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Conversões</p><p className="text-lg font-bold text-accent">{totalConv}</p></div>
                          </div>
                        </CardContent>
                      </Card>

                      {Object.entries(byPlatform).map(([plat, ads]) => (
                        <Card key={plat} className="executive-card">
                          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Megaphone className="h-4 w-4 text-primary" /> {plat.charAt(0).toUpperCase() + plat.slice(1)}<Badge variant="outline" className="ml-auto text-[10px]">{ads.length}</Badge></CardTitle></CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {ads.map((a: any) => (
                                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{a.titulo}</p>
                                    <p className="text-[11px] text-muted-foreground">{a.tipo_anuncio} · R$ {a.investimento?.toLocaleString('pt-BR')}</p>
                                  </div>
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

              {/* ═══ SEO TAB ═══ */}
              <TabsContent value="seo" className="space-y-6">
                {clientSeoKeywords.length === 0 && clientSeoPages.length === 0 ? (
                  <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum dado de SEO cadastrado para este cliente.</CardContent></Card>
                ) : (
                  <>
                    {clientSeoKeywords.length > 0 && (
                      <Card className="executive-card">
                        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Hash className="h-4 w-4 text-primary" /> Palavras-Chave<Badge variant="outline" className="ml-auto text-[10px]">{clientSeoKeywords.length}</Badge></CardTitle></CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead><tr className="border-b text-xs text-muted-foreground"><th className="text-left py-2 pr-4">Palavra-Chave</th><th className="text-center py-2 px-2">Posição</th><th className="text-center py-2 px-2">Anterior</th><th className="text-center py-2 px-2">Volume</th><th className="text-center py-2 px-2">Dificuldade</th><th className="text-left py-2 pl-2">Status</th></tr></thead>
                              <tbody>
                                {clientSeoKeywords.map((kw: any) => {
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

                    {clientSeoPages.length > 0 && (
                      <Card className="executive-card">
                        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Link2 className="h-4 w-4 text-primary" /> Páginas Monitoradas<Badge variant="outline" className="ml-auto text-[10px]">{clientSeoPages.length}</Badge></CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {clientSeoPages.slice(0, 15).map((pg: any) => {
                              const delta = pg.visitas_mes - (pg.visitas_mes_anterior || 0);
                              return (
                                <div key={pg.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{pg.titulo}</p>
                                    <p className="text-[11px] text-muted-foreground truncate">{pg.url}</p>
                                  </div>
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

              {/* ═══ MÍDIAS SOCIAIS TAB ═══ */}
              <TabsContent value="social" className="space-y-6">
                {clientSocial.length === 0 ? (
                  <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhuma conta de mídia social cadastrada para este cliente.</CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clientSocial.map((acc: any) => (
                      <Card key={acc.id} className="executive-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
                            <Share2 className="h-4 w-4 text-primary" /> {acc.plataforma}
                            {acc.username && <span className="text-xs text-muted-foreground font-normal">@{acc.username}</span>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Seguidores</p><p className="text-lg font-bold">{(acc.seguidores || 0).toLocaleString('pt-BR')}</p></div>
                            <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Novos/Mês</p><p className="text-lg font-bold text-accent">+{(acc.novos_seguidores_mes || 0).toLocaleString('pt-BR')}</p></div>
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Engajamento</p><p className="text-lg font-bold">{(acc.engajamento_medio || 0).toFixed(1)}%</p></div>
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Alcance Médio</p><p className="text-lg font-bold">{(acc.alcance_medio || 0).toLocaleString('pt-BR')}</p></div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                            <div><p className="font-medium text-foreground">{(acc.posts_total || 0)}</p><p>Posts</p></div>
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

              {/* ═══ GOOGLE MEU NEGÓCIO TAB ═══ */}
              <TabsContent value="mybusiness" className="space-y-6">
                {!clientMybusiness ? (
                  <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum perfil do Google Meu Negócio cadastrado para este cliente.</CardContent></Card>
                ) : (
                  <>
                    <Card className="executive-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans">
                          <Store className="h-4 w-4 text-primary" /> {clientMybusiness.nome_negocio}
                          {clientMybusiness.categoria && <Badge variant="outline" className="ml-2 text-[10px]">{clientMybusiness.categoria}</Badge>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Avaliação</p><p className="text-xl font-bold flex items-center justify-center gap-1"><Star className="h-4 w-4 text-warning fill-warning" />{clientMybusiness.avaliacao_media?.toFixed(1)}</p><p className="text-[10px] text-muted-foreground">{clientMybusiness.total_avaliacoes} avaliações</p></div>
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Busca</p><p className="text-xl font-bold">{(clientMybusiness.visualizacoes_busca || 0).toLocaleString('pt-BR')}</p></div>
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Maps</p><p className="text-xl font-bold">{(clientMybusiness.visualizacoes_maps || 0).toLocaleString('pt-BR')}</p></div>
                          <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-center"><p className="text-[10px] text-muted-foreground uppercase mb-1">Cliques Site</p><p className="text-xl font-bold text-accent">{(clientMybusiness.cliques_site || 0).toLocaleString('pt-BR')}</p></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
                          <div className="p-2 rounded-lg bg-muted/20"><Phone className="h-3 w-3 mx-auto mb-1" /><p className="font-medium text-foreground">{clientMybusiness.cliques_ligacao || 0}</p><p>Ligações</p></div>
                          <div className="p-2 rounded-lg bg-muted/20"><MapPin className="h-3 w-3 mx-auto mb-1" /><p className="font-medium text-foreground">{clientMybusiness.cliques_rota || 0}</p><p>Rotas</p></div>
                          <div className="p-2 rounded-lg bg-muted/20"><Eye className="h-3 w-3 mx-auto mb-1" /><p className="font-medium text-foreground">{clientMybusiness.fotos_count || 0}</p><p>Fotos</p></div>
                        </div>
                        {clientMybusiness.endereco && <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><MapPin className="h-3 w-3" />{clientMybusiness.endereco}{clientMybusiness.cidade ? `, ${clientMybusiness.cidade}` : ''}</p>}
                      </CardContent>
                    </Card>

                    {clientCompetitors.length > 0 && (
                      <Card className="executive-card">
                        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2 font-sans"><Target className="h-4 w-4 text-primary" /> Concorrentes<Badge variant="outline" className="ml-auto text-[10px]">{clientCompetitors.length}</Badge></CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {clientCompetitors.map((comp: any) => (
                              <div key={comp.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{comp.nome_concorrente}</p>
                                  <p className="text-[11px] text-muted-foreground">{comp.categoria || 'Sem categoria'}{comp.distancia_km ? ` · ${comp.distancia_km}km` : ''}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs shrink-0">
                                  <Star className="h-3 w-3 text-warning fill-warning" />
                                  <span className="font-bold">{comp.avaliacao_media?.toFixed(1)}</span>
                                  <span className="text-muted-foreground">({comp.total_avaliacoes})</span>
                                </div>
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
