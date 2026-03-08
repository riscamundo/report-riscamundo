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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(262, 52%, 56%)', 'hsl(38, 92%, 50%)', 'hsl(340, 75%, 55%)'];

const tooltipStyle = {
  background: '#fff',
  border: '1px solid hsl(220, 13%, 91%)',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
  fontSize: '13px',
};

const gridStroke = 'hsl(220, 14%, 93%)';
const axisStroke = 'hsl(220, 9%, 46%)';

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
          <div className="text-muted-foreground animate-pulse text-sm">Carregando dados...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        {alertas.filter(a => a.severidade === 'critico').length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
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

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StaggerItem><KPICard title="Faturamento" value={fmt(faturamento)} icon={DollarSign} variant="primary" /></StaggerItem>
          <StaggerItem><KPICard title="Investimento" value={fmt(investimento)} icon={CreditCard} /></StaggerItem>
          <StaggerItem><KPICard title="ROI Atual" value={`${roi.toFixed(1)}x`} icon={TrendingUp} trend={roi >= 8 ? 'up' : 'down'} variant={roi >= 8 ? 'success' : 'default'} /></StaggerItem>
          <StaggerItem><KPICard title="Ticket Médio" value={fmt(ticketMedio)} icon={Target} /></StaggerItem>
          <StaggerItem><KPICard title="Conversão" value={`${conversao.toFixed(1)}%`} icon={Users} variant="success" /></StaggerItem>
          <StaggerItem><KPICard title="Combos Premium" value={`${combos.toFixed(0)}%`} icon={Award} trend={combos >= 30 ? 'up' : 'down'} /></StaggerItem>
        </StaggerContainer>

        {leads.length === 0 && vendas.length === 0 ? (
          <Card className="mb-6 card-glow">
            <CardContent className="p-14 text-center">
              <div className="inline-flex p-5 rounded-2xl bg-primary/8 mb-5">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Bem-vindo ao REPORTS!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Comece cadastrando procedimentos, criando campanhas e adicionando leads no funil para ver os gráficos e métricas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funil */}
            <Card className="card-glow border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Funil de Vendas</CardTitle>
              </CardHeader>
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
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Receita por Procedimento</CardTitle>
              </CardHeader>
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
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem vendas registradas</div>
                )}
              </CardContent>
            </Card>

            {/* Receita por Canal - Donut */}
            <Card className="card-glow border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Receita por Canal</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {receitaCanal.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie 
                        data={receitaCanal} 
                        dataKey="receita" 
                        nameKey="canal" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={95} 
                        innerRadius={55} 
                        paddingAngle={4} 
                        label={({ canal, percent }) => `${canal} ${(percent * 100).toFixed(0)}%`} 
                        labelLine={false} 
                        fontSize={11}
                        strokeWidth={0}
                      >
                        {receitaCanal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de canal</div>
                )}
              </CardContent>
            </Card>

            {/* ROI por Campanha */}
            <Card className="card-glow border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">ROI por Campanha</CardTitle>
              </CardHeader>
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
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de ROI</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}
