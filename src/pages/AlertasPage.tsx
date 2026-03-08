import { useState, useMemo } from 'react';
import { useStoreContext } from '@/contexts/StoreContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Skeleton } from '@/components/ui/skeleton';
import { calcAlertas, calcCPL, calcROI, calcCombosPremium, calcConversao, calcTicketMedio, getROIPorCampanha } from '@/lib/metrics';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Sparkles, TrendingDown, TrendingUp, ShieldAlert, Lightbulb, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const severidadeConfig = {
  critico: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', label: 'Crítico', chartColor: 'hsl(0, 72%, 51%)' },
  atencao: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10 border-warning/20', label: 'Atenção', chartColor: 'hsl(38, 92%, 50%)' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10 border-info/20', label: 'Info', chartColor: 'hsl(217, 91%, 60%)' },
};

function AIHoverSuggestion({ alertType, alertMessage, metrics }: { alertType: string; alertMessage: string; metrics: Record<string, number> }) {
  const [sugestoes, setSugestoes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchSuggestions = async () => {
    if (fetched) return;
    setLoading(true);
    setFetched(true);
    try {
      const { data, error } = await supabase.functions.invoke('alert-suggestions', {
        body: { alertType, alertMessage, metrics },
      });
      if (error) throw error;
      setSugestoes(data?.sugestoes || ['Sem sugestões no momento']);
    } catch {
      setSugestoes(['Não foi possível gerar sugestões agora. Tente novamente.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HoverCard openDelay={200} onOpenChange={(open) => { if (open) fetchSuggestions(); }}>
      <HoverCardTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          Sugestões IA
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Lightbulb className="h-4 w-4 text-warning" />
            Sugestões da IA
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : sugestoes ? (
            <ul className="space-y-1.5">
              {sugestoes.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Passe o mouse para gerar sugestões</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function GaugeCard({ label, value, max, suffix, icon: Icon, status }: { label: string; value: number; max: number; suffix: string; icon: React.ElementType; status: 'good' | 'warning' | 'critical' }) {
  const pct = Math.min((value / max) * 100, 100);
  const statusColors = {
    good: 'text-accent',
    warning: 'text-warning',
    critical: 'text-destructive',
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <Icon className={`h-4 w-4 ${statusColors[status]}`} />
        </div>
        <div className={`text-2xl font-bold ${statusColors[status]}`}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : value}{suffix}
        </div>
        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${status === 'good' ? 'bg-accent' : status === 'warning' ? 'bg-warning' : 'bg-destructive'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlertasPage() {
  const { procedimentos, campanhas, leads, vendas } = useStoreContext();
  const alertas = calcAlertas(procedimentos, campanhas, leads, vendas);

  const metrics = useMemo(() => ({
    cpl: calcCPL(campanhas, leads),
    roi: calcROI(vendas, campanhas),
    combosPremium: calcCombosPremium(vendas, procedimentos),
    conversao: calcConversao(leads, vendas),
    ticketMedio: calcTicketMedio(vendas),
  }), [procedimentos, campanhas, leads, vendas]);

  const roiCampanhas = useMemo(() => getROIPorCampanha(campanhas, vendas, leads), [campanhas, vendas, leads]);

  const sorted = [...alertas].sort((a, b) => {
    const order = { critico: 0, atencao: 1, info: 2 };
    return order[a.severidade] - order[b.severidade];
  });

  const severidadeCounts = useMemo(() => {
    const counts = { critico: 0, atencao: 0, info: 0 };
    alertas.forEach(a => counts[a.severidade]++);
    return [
      { name: 'Crítico', value: counts.critico, color: severidadeConfig.critico.chartColor },
      { name: 'Atenção', value: counts.atencao, color: severidadeConfig.atencao.chartColor },
      { name: 'Info', value: counts.info, color: severidadeConfig.info.chartColor },
    ].filter(x => x.value > 0);
  }, [alertas]);

  const roiChartData = useMemo(() =>
    roiCampanhas
      .filter(r => r.investimento > 0)
      .map(r => ({ name: r.nome.length > 15 ? r.nome.slice(0, 15) + '…' : r.nome, roi: Number(r.roi.toFixed(1)), meta: 8 }))
      .slice(0, 6),
    [roiCampanhas]
  );

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader title="Central de Alertas" subtitle={`${alertas.length} alerta(s) ativo(s) · Dashboard inteligente`} />

        {/* KPI Gauges */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StaggerItem>
            <GaugeCard
              label="CPL"
              value={metrics.cpl}
              max={500}
              suffix=""
              icon={metrics.cpl > 300 ? TrendingUp : TrendingDown}
              status={metrics.cpl > 300 ? 'critical' : metrics.cpl > 200 ? 'warning' : 'good'}
            />
          </StaggerItem>
          <StaggerItem>
            <GaugeCard
              label="ROI Geral"
              value={metrics.roi}
              max={15}
              suffix="x"
              icon={metrics.roi < 8 ? ShieldAlert : TrendingUp}
              status={metrics.roi >= 8 ? 'good' : metrics.roi >= 5 ? 'warning' : 'critical'}
            />
          </StaggerItem>
          <StaggerItem>
            <GaugeCard
              label="Combos Premium"
              value={metrics.combosPremium}
              max={100}
              suffix="%"
              icon={metrics.combosPremium < 30 ? AlertCircle : CheckCircle2}
              status={metrics.combosPremium >= 30 ? 'good' : metrics.combosPremium >= 20 ? 'warning' : 'critical'}
            />
          </StaggerItem>
          <StaggerItem>
            <GaugeCard
              label="Conversão"
              value={metrics.conversao}
              max={100}
              suffix="%"
              icon={TrendingUp}
              status={metrics.conversao >= 15 ? 'good' : metrics.conversao >= 8 ? 'warning' : 'critical'}
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Severity distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Distribuição por Severidade</CardTitle>
            </CardHeader>
            <CardContent>
              {severidadeCounts.length === 0 ? (
                <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent mr-2" /> Nenhum alerta ativo
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={severidadeCounts} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                      {severidadeCounts.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ROI per campaign bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">ROI por Campanha vs Meta (8x)</CardTitle>
            </CardHeader>
            <CardContent>
              {roiChartData.length === 0 ? (
                <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                  Sem dados de campanhas
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={roiChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }} />
                    <Bar dataKey="roi" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="meta" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} opacity={0.3} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts list with AI hover */}
        {alertas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-accent/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Tudo sob controle!</h3>
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo. Continue o bom trabalho ✨</p>
            </CardContent>
          </Card>
        ) : (
          <TooltipProvider>
            <StaggerContainer className="space-y-3">
              {sorted.map(alerta => {
                const cfg = severidadeConfig[alerta.severidade];
                const Icon = cfg.icon;
                return (
                  <StaggerItem key={alerta.id}>
                    <Card className={`border ${cfg.bg} transition-shadow hover:shadow-md`}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <Icon className={`h-5 w-5 ${cfg.color} mt-0.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs ${cfg.color} border-current`}>{cfg.label}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(alerta.data).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-sm mb-2">{alerta.mensagem}</p>
                          <AIHoverSuggestion
                            alertType={alerta.tipo}
                            alertMessage={alerta.mensagem}
                            metrics={metrics}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </TooltipProvider>
        )}

        {/* Rules reference */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Regras de Alerta Automático</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" /> CPL subiu mais de 20% em relação à média</li>
              <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" /> ROI de campanha abaixo de 8x</li>
              <li className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" /> Ticket médio em queda por 2 períodos</li>
              <li className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" /> Combos premium abaixo de 30% das vendas</li>
              <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" /> Leads sem contato há mais de 24h</li>
            </ul>
          </CardContent>
        </Card>
      </AnimatedPage>
    </DashboardLayout>
  );
}
