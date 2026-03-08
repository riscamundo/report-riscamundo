import { useEffect, useState } from 'react';
import { useStoreContext } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard, PageHeader } from '@/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import {
  calcFaturamentoMes, calcInvestimentoTotal, calcROI, calcTicketMedio,
  calcConversao, calcCombosPremium, getLeadsPorEtapa, getReceitaPorProcedimento,
  getReceitaPorCanal, getROIPorCampanha, calcAlertas
} from '@/lib/metrics';
import { DollarSign, TrendingUp, Target, CreditCard, Users, Award, AlertTriangle, Clock, CheckCircle2, Briefcase, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend } from 'recharts';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(262, 52%, 56%)', 'hsl(38, 92%, 50%)', 'hsl(340, 75%, 55%)'];
const tooltipStyle = { background: '#fff', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', fontSize: '13px' };
const gridStroke = 'hsl(220, 14%, 93%)';
const axisStroke = 'hsl(220, 9%, 46%)';

interface TarefaVencendo { id: string; titulo: string; status: string; prioridade: string | null; cliente_nome: string; updated_at: string; }

export default function ExecutiveDashboard() {
  const { procedimentos, campanhas, leads, vendas, loading } = useStoreContext();
  const { isMaster, isGestor } = useAuth();
  const [clientesCount, setClientesCount] = useState(0);
  const [tarefasVencendo, setTarefasVencendo] = useState<TarefaVencendo[]>([]);

  useEffect(() => {
    const fetchExtra = async () => {
      const [clientesRes, tarefasRes] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('tarefas_cliente').select('id, titulo, status, prioridade, updated_at, cliente_id').neq('status', 'pronta').order('updated_at', { ascending: true }).limit(10),
      ]);
      setClientesCount(clientesRes.count || 0);
      if (tarefasRes.data && tarefasRes.data.length > 0) {
        const clienteIds = [...new Set(tarefasRes.data.map(t => t.cliente_id))];
        const { data: clientes } = await supabase.from('clientes').select('id, nome').in('id', clienteIds);
        const clienteMap = new Map((clientes || []).map(c => [c.id, c.nome]));
        setTarefasVencendo(tarefasRes.data.map(t => ({
          id: t.id, titulo: t.titulo, status: t.status, prioridade: t.prioridade,
          cliente_nome: clienteMap.get(t.cliente_id) || 'Cliente', updated_at: t.updated_at,
        })));
      }
    };
    fetchExtra();
  }, []);

  const faturamento = calcFaturamentoMes(vendas);
  const investimento = calcInvestimentoTotal(campanhas);
  const roi = calcROI(vendas, campanhas);
  const ticketMedio = calcTicketMedio(vendas);
  const conversao = calcConversao(leads, vendas);
  const combos = calcCombosPremium(vendas, procedimentos);
  const alertas = calcAlertas(procedimentos, campanhas, leads, vendas);
  const funilData = getLeadsPorEtapa(leads);
  const receitaProc = getReceitaPorProcedimento(vendas, procedimentos);
  const receitaCanal = getReceitaPorCanal(vendas, leads, campanhas);
  const roiCampanha = getROIPorCampanha(campanhas, vendas, leads);

  // Monthly revenue trend
  const monthlyRevenue = (() => {
    const map: Record<string, number> = {};
    vendas.filter(v => v.status === 'fechado').forEach(v => {
      const m = v.data_venda.slice(0, 7);
      map[m] = (map[m] || 0) + v.valor_venda;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([m, v]) => ({
      mes: new Date(m + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }),
      receita: v,
    }));
  })();

  // Leads by origin
  const leadsByOrigin = (() => {
    const map: Record<string, number> = {};
    leads.forEach(l => { const o = l.origem || 'Direto'; map[o] = (map[o] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ nome: k, count: v }));
  })();

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

  return (
    <DashboardLayout>
      <AnimatedPage>
        {/* Critical alerts */}
        {alertas.filter(a => a.severidade === 'critico').length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-destructive/10"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
            <div className="text-sm space-y-0.5">
              {alertas.filter(a => a.severidade === 'critico').map(a => (
                <p key={a.id} className="text-destructive/90">{a.mensagem}</p>
              ))}
            </div>
          </div>
        )}

        <PageHeader
          title={isMaster ? "Dashboard Executivo" : isGestor ? "Visão da Equipe" : "Meu Dashboard"}
          subtitle={isMaster ? "REPORTS · Performance consolidada" : isGestor ? "Dados da sua equipe" : "Seus leads e vendas"}
        />

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          <StaggerItem><KPICard title="Faturamento" value={fmt(faturamento)} icon={DollarSign} variant="primary" /></StaggerItem>
          <StaggerItem><KPICard title="Investimento" value={fmt(investimento)} icon={CreditCard} /></StaggerItem>
          <StaggerItem><KPICard title="ROI Atual" value={`${roi.toFixed(1)}x`} icon={TrendingUp} trend={roi >= 8 ? 'up' : 'down'} variant={roi >= 8 ? 'success' : 'default'} /></StaggerItem>
          <StaggerItem><KPICard title="Ticket Médio" value={fmt(ticketMedio)} icon={Target} /></StaggerItem>
          <StaggerItem><KPICard title="Conversão" value={`${conversao.toFixed(1)}%`} icon={Users} variant="success" /></StaggerItem>
          <StaggerItem><KPICard title="Combos Premium" value={`${combos.toFixed(0)}%`} icon={Award} trend={combos >= 30 ? 'up' : 'down'} /></StaggerItem>
          <StaggerItem><KPICard title="Clientes Ativos" value={clientesCount.toString()} icon={Briefcase} /></StaggerItem>
        </StaggerContainer>

        {/* Task alerts */}
        {tarefasVencendo.length > 0 && (
          <Card className="mb-6 border-warning/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" /> Tarefas Pendentes de Clientes
                <Badge variant="outline" className="ml-auto text-warning border-warning">{tarefasVencendo.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tarefasVencendo.slice(0, 5).map(t => {
                  const prioridadeColor = t.prioridade === 'alta' ? 'text-destructive' : t.prioridade === 'baixa' ? 'text-muted-foreground' : 'text-foreground';
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-warning/5 border border-warning/10">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.titulo}</p>
                        <p className="text-[11px] text-muted-foreground">{t.cliente_nome} · {t.status}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.prioridade && t.prioridade !== 'media' && (
                          <Badge variant="outline" className={`text-[10px] ${prioridadeColor}`}>{t.prioridade === 'alta' ? 'Alta' : 'Baixa'}</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">{new Date(t.updated_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {leads.length === 0 && vendas.length === 0 ? (
          <Card className="mb-6 card-glow">
            <CardContent className="p-14 text-center">
              <div className="inline-flex p-5 rounded-2xl bg-primary/8 mb-5"><Users className="h-10 w-10 text-primary" /></div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Bem-vindo ao REPORTS!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">Comece cadastrando procedimentos, criando campanhas e adicionando leads no funil para ver os gráficos e métricas.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Revenue trend + Leads by origin */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="lg:col-span-2 card-glow border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-foreground">Receita Mensal</CardTitle></CardHeader>
                <CardContent>
                  {monthlyRevenue.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={monthlyRevenue}>
                        <defs><linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis dataKey="mes" fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} />
                        <YAxis fontSize={11} stroke={axisStroke} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                        <Area type="monotone" dataKey="receita" stroke="hsl(217, 91%, 60%)" fill="url(#gradReceita)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de receita</div>}
                </CardContent>
              </Card>
              <Card className="card-glow border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-foreground">Leads por Origem</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  {leadsByOrigin.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={leadsByOrigin} dataKey="count" nameKey="nome" cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={4} strokeWidth={0}
                          label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {leadsByOrigin.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funil */}
              <Card className="card-glow border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-foreground">Funil de Vendas</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funilData.filter(f => f.etapa !== 'perdido').map((f, i) => {
                      const maxCount = Math.max(...funilData.map(x => x.count));
                      const width = maxCount > 0 ? (f.count / maxCount) * 100 : 0;
                      return (
                        <div key={f.etapa}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-muted-foreground text-xs font-medium">{f.label}</span>
                            <span className="font-semibold text-xs text-foreground">{f.count} leads</span>
                          </div>
                          <div className="h-7 bg-muted/60 rounded-lg overflow-hidden">
                            <div className="h-full rounded-lg transition-all duration-700 ease-out" style={{ width: `${Math.max(width, 2)}%`, background: COLORS[i % COLORS.length], opacity: 0.85 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Receita por Procedimento */}
              <Card className="card-glow border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-foreground">Receita por Procedimento</CardTitle></CardHeader>
                <CardContent>
                  {receitaProc.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={receitaProc.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke={axisStroke} fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="nome" width={110} stroke={axisStroke} fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
                        <Bar dataKey="receita" fill="hsl(217, 91%, 60%)" radius={[0, 8, 8, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem vendas registradas</div>}
                </CardContent>
              </Card>

              {/* Receita por Canal - Donut */}
              <Card className="card-glow border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-foreground">Receita por Canal</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  {receitaCanal.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={receitaCanal} dataKey="receita" nameKey="canal" cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={4}
                          label={({ canal, percent }) => `${canal} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11} strokeWidth={0}>
                          {receitaCanal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de canal</div>}
                </CardContent>
              </Card>

              {/* ROI por Campanha */}
              <Card className="card-glow border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-foreground">ROI por Campanha</CardTitle></CardHeader>
                <CardContent>
                  {roiCampanha.some(r => r.roi > 0) ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={roiCampanha} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis dataKey="nome" stroke={axisStroke} fontSize={10} angle={-20} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                        <YAxis stroke={axisStroke} fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => `${v.toFixed(1)}x`} contentStyle={tooltipStyle} />
                        <Bar dataKey="roi" fill="hsl(160, 84%, 39%)" radius={[8, 8, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de ROI</div>}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}
