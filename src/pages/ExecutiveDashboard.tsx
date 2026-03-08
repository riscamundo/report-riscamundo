import { useEffect, useState, useMemo } from 'react';
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
  Plus, Edit2, UserPlus, PhoneCall, CalendarDays, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(262, 52%, 56%)', 'hsl(38, 92%, 50%)', 'hsl(340, 75%, 55%)', 'hsl(190, 80%, 45%)'];
const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', fontSize: '13px' };
const gridStroke = 'hsl(220, 14%, 93%)';
const axisStroke = 'hsl(220, 9%, 46%)';

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

  // KPIs
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

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader
          title="Dashboard Executivo"
          subtitle="Visão consolidada de todos os clientes · Pontos críticos e alertas"
        />

        {/* ═══ ALERTAS CRÍTICOS ═══ */}
        {criticalAlerts.length > 0 && (
          <Card className="mb-6 border-destructive/20 bg-destructive/[0.02]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
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

        {/* ═══ KPIs CONSOLIDADOS ═══ */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
          <StaggerItem><KPICard title="Faturamento Mês" value={fmt(faturamento)} icon={DollarSign} variant="primary" /></StaggerItem>
          <StaggerItem><KPICard title="Receita Projetada" value={fmt(forecast.receitaProjetadaMensal)} subtitle={`${forecast.leadsAtivos} leads ativos`} icon={TrendingUp} /></StaggerItem>
          <StaggerItem><KPICard title="ROI Atual" value={`${roi.toFixed(1)}x`} icon={Target} trend={roi >= 8 ? 'up' : 'down'} variant={roi >= 8 ? 'success' : 'default'} /></StaggerItem>
          <StaggerItem><KPICard title="Conversão" value={`${conversao.toFixed(1)}%`} icon={Users} variant="success" /></StaggerItem>
        </StaggerContainer>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
          <StaggerItem><KPICard title="Clientes Ativos" value={clientesAtivos.toString()} icon={Briefcase} /></StaggerItem>
          <StaggerItem><KPICard title="Mensalidades/Mês" value={fmt(receitaMensalidades)} icon={Receipt} /></StaggerItem>
          <StaggerItem><KPICard title="A Receber" value={fmt(totalReceber)} subtitle={`${boletosPendentes.length} pendentes`} icon={Wallet} /></StaggerItem>
          <StaggerItem><KPICard title="Ticket Médio" value={fmt(ticketMedio)} icon={CreditCard} /></StaggerItem>
        </StaggerContainer>

        {/* ═══ FINANCEIRO + LEADS PARADOS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Boletos vencidos por cliente */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
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

          {/* Leads parados >24h */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-warning" /> Leads Sem Contato (&gt;24h)
                {leadsParados.length > 0 && <Badge className="ml-auto text-[10px] bg-warning/20 text-warning border-0">{leadsParados.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leadsParados.length > 0 ? (
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className={`text-[10px] ${days > 3 ? 'border-destructive text-destructive' : 'border-warning text-warning'}`}>
                            <Clock className="h-3 w-3 mr-0.5" />{days}d
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">Todos os leads foram contatados ✅</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══ TAREFAS PENDENTES ═══ */}
        {tarefasPendentes.length > 0 && (
          <Card className="mb-6 border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Tarefas Pendentes de Clientes
                <Badge variant="outline" className="ml-auto text-[10px]">{tarefasPendentes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tarefasPendentes.slice(0, 10).map(t => (
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
            </CardContent>
          </Card>
        )}

        {/* ═══ GRÁFICOS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Receita mensal */}
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Receita Mensal</CardTitle></CardHeader>
            <CardContent>
              {monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={monthlyRevenue}>
                    <defs><linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                    <YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="receita" stroke="hsl(217, 91%, 60%)" fill="url(#gradReceita)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de receita</div>}
            </CardContent>
          </Card>

          {/* Leads por Origem */}
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Leads por Origem</CardTitle></CardHeader>
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
          {/* Funil */}
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Funil de Vendas</CardTitle></CardHeader>
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

          {/* Receita por Serviço */}
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Receita por Serviço</CardTitle></CardHeader>
            <CardContent>
              {receitaProc.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={receitaProc.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke={axisStroke} fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nome" width={120} stroke={axisStroke} fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="receita" fill="hsl(217, 91%, 60%)" radius={[0, 8, 8, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem vendas registradas</div>}
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}
