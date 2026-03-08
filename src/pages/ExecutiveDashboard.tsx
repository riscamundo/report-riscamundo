import { useStoreContext } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard, PageHeader } from '@/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import {
  calcFaturamentoMes, calcInvestimentoTotal, calcROI, calcTicketMedio,
  calcConversao, calcCombosPremium, getLeadsPorEtapa, getReceitaPorProcedimento,
  getReceitaPorCanal, getROIPorCampanha, calcAlertas
} from '@/lib/metrics';
import { DollarSign, TrendingUp, Target, CreditCard, Users, Award, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(280, 50%, 55%)', 'hsl(38, 90%, 55%)', 'hsl(340, 65%, 55%)'];

export default function ExecutiveDashboard() {
  const { procedimentos, campanhas, leads, vendas, loading } = useStoreContext();
  const { isMaster, isGestor } = useAuth();

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

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground animate-pulse">Carregando dados...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        {alertas.filter(a => a.severidade === 'critico').length > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              {alertas.filter(a => a.severidade === 'critico').map(a => (
                <p key={a.id} className="text-destructive">{a.mensagem}</p>
              ))}
            </div>
          </div>
        )}

        <PageHeader title={isMaster ? "Visão Executiva — Todos os Clientes" : isGestor ? "Visão da Equipe" : "Meu Dashboard"} subtitle={isMaster ? "Dados consolidados de toda a equipe" : isGestor ? "Dados da sua equipe" : "Seus leads e vendas"} />

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StaggerItem><KPICard title="Faturamento" value={fmt(faturamento)} icon={DollarSign} /></StaggerItem>
          <StaggerItem><KPICard title="Investimento Mídia" value={fmt(investimento)} icon={CreditCard} /></StaggerItem>
          <StaggerItem><KPICard title="ROI Atual" value={`${roi.toFixed(1)}x`} icon={TrendingUp} trend={roi >= 8 ? 'up' : 'down'} /></StaggerItem>
          <StaggerItem><KPICard title="Ticket Médio" value={fmt(ticketMedio)} icon={Target} /></StaggerItem>
          <StaggerItem><KPICard title="Conversão" value={`${conversao.toFixed(1)}%`} icon={Users} /></StaggerItem>
          <StaggerItem><KPICard title="Combos Premium" value={`${combos.toFixed(0)}%`} icon={Award} trend={combos >= 30 ? 'up' : 'down'} /></StaggerItem>
        </StaggerContainer>

        {leads.length === 0 && vendas.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="p-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Bem-vindo ao CRM!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Comece cadastrando procedimentos, criando campanhas e adicionando leads no funil para ver os gráficos e métricas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base font-sans">Funil de Vendas</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {funilData.filter(f => f.etapa !== 'perdido').map((f, i) => {
                    const maxCount = Math.max(...funilData.map(x => x.count));
                    const width = maxCount > 0 ? (f.count / maxCount) * 100 : 0;
                    return (
                      <div key={f.etapa}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{f.label}</span>
                          <span className="font-medium">{f.count} leads</span>
                        </div>
                        <div className="h-8 bg-muted rounded-md overflow-hidden">
                          <div className="h-full rounded-md transition-all duration-500" style={{ width: `${width}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-sans">Receita por Procedimento</CardTitle></CardHeader>
              <CardContent>
                {receitaProc.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={receitaProc.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="hsl(220, 15%, 45%)" fontSize={12} />
                      <YAxis type="category" dataKey="nome" width={120} stroke="hsl(220, 15%, 45%)" fontSize={11} />
                      <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#fff', border: '1px solid hsl(220, 15%, 88%)', borderRadius: '10px' }} />
                      <Bar dataKey="receita" fill="hsl(217, 91%, 60%)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem vendas registradas</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-sans">Receita por Canal</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {receitaCanal.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={receitaCanal} dataKey="receita" nameKey="canal" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ canal, percent }) => `${canal} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {receitaCanal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#fff', border: '1px solid hsl(220, 15%, 88%)', borderRadius: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de canal</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-sans">ROI por Campanha</CardTitle></CardHeader>
              <CardContent>
                {roiCampanha.some(r => r.roi > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={roiCampanha}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                      <XAxis dataKey="nome" stroke="hsl(220, 15%, 45%)" fontSize={10} angle={-20} textAnchor="end" height={60} />
                      <YAxis stroke="hsl(220, 15%, 45%)" fontSize={12} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}x`} contentStyle={{ background: '#fff', border: '1px solid hsl(220, 15%, 88%)', borderRadius: '10px' }} />
                      <Bar dataKey="roi" fill="hsl(160, 84%, 39%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de ROI</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}
