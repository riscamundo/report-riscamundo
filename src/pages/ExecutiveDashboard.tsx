import { useStoreContext } from '@/contexts/StoreContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard, PageHeader } from '@/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  calcFaturamentoMes, calcInvestimentoTotal, calcROI, calcTicketMedio,
  calcConversao, calcCombosPremium, getLeadsPorEtapa, getReceitaPorProcedimento,
  getReceitaPorCanal, getROIPorCampanha, calcAlertas
} from '@/lib/metrics';
import { DollarSign, TrendingUp, Target, CreditCard, Users, Award, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart } from 'recharts';

const COLORS = ['hsl(38, 70%, 50%)', 'hsl(200, 60%, 50%)', 'hsl(150, 50%, 45%)', 'hsl(280, 50%, 55%)', 'hsl(15, 70%, 55%)'];

export default function ExecutiveDashboard() {
  const { procedimentos, campanhas, leads, vendas } = useStoreContext();

  const faturamento = calcFaturamentoMes(vendas);
  const investimento = calcInvestimentoTotal(campanhas);
  const roi = calcROI(vendas, campanhas);
  const ticketMedio = calcTicketMedio(vendas);
  const conversao = calcConversao(leads, vendas);
  const combos = calcCombosPremium(vendas, procedimentos);
  const alertas = calcAlertas(procedimentos, campanhas, leads, vendas);
  const funilData = getLeadsPorEtapa(leads);
  const receitaProc = getReceitaPorProcedimento(vendas, procedimentos);
  const receitaCanal = getReceitaPorCanal(vendas, leads);
  const roiCampanha = getROIPorCampanha(campanhas, vendas, leads);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  return (
    <DashboardLayout>
      {/* Alertas Banner */}
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

      <PageHeader title="Visão Executiva" subtitle="Dashboard de performance da clínica" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KPICard title="Faturamento" value={fmt(faturamento)} icon={DollarSign} />
        <KPICard title="Investimento Mídia" value={fmt(investimento)} icon={CreditCard} />
        <KPICard title="ROI Atual" value={`${roi.toFixed(1)}x`} icon={TrendingUp} trend={roi >= 8 ? 'up' : 'down'} />
        <KPICard title="Ticket Médio" value={fmt(ticketMedio)} icon={Target} />
        <KPICard title="Conversão" value={`${conversao.toFixed(1)}%`} icon={Users} />
        <KPICard title="Combos Premium" value={`${combos.toFixed(0)}%`} icon={Award} trend={combos >= 30 ? 'up' : 'down'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil */}
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
                      <div className="h-full rounded-md transition-all" style={{ width: `${width}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Receita por Procedimento */}
        <Card>
          <CardHeader><CardTitle className="text-base font-sans">Receita por Procedimento</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={receitaProc.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <YAxis type="category" dataKey="nome" width={120} stroke="hsl(220, 10%, 55%)" fontSize={11} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: '8px' }} />
                <Bar dataKey="receita" fill="hsl(38, 70%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Receita por Canal */}
        <Card>
          <CardHeader><CardTitle className="text-base font-sans">Receita por Canal</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={receitaCanal} dataKey="receita" nameKey="canal" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ canal, percent }) => `${canal} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {receitaCanal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ROI por Campanha */}
        <Card>
          <CardHeader><CardTitle className="text-base font-sans">ROI por Campanha</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roiCampanha}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis dataKey="nome" stroke="hsl(220, 10%, 55%)" fontSize={10} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}x`} contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: '8px' }} />
                <Bar dataKey="roi" fill="hsl(200, 60%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
