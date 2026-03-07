import { useStoreContext } from '@/contexts/StoreContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calcAlertas } from '@/lib/metrics';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const severidadeConfig = {
  critico: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', label: 'Crítico' },
  atencao: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10 border-warning/20', label: 'Atenção' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10 border-info/20', label: 'Info' },
};

export default function AlertasPage() {
  const { procedimentos, campanhas, leads, vendas } = useStoreContext();
  const alertas = calcAlertas(procedimentos, campanhas, leads, vendas);

  const sorted = [...alertas].sort((a, b) => {
    const order = { critico: 0, atencao: 1, info: 2 };
    return order[a.severidade] - order[b.severidade];
  });

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader title="Central de Alertas" subtitle={`${alertas.length} alerta(s) ativo(s)`} />

        {alertas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-success/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Tudo sob controle!</h3>
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo. Continue o bom trabalho ✨</p>
            </CardContent>
          </Card>
        ) : (
          <StaggerContainer className="space-y-3">
            {sorted.map(alerta => {
              const cfg = severidadeConfig[alerta.severidade];
              const Icon = cfg.icon;
              return (
                <StaggerItem key={alerta.id}>
                  <Card className={`border ${cfg.bg}`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${cfg.color} mt-0.5 shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs ${cfg.color} border-current`}>{cfg.label}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(alerta.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-sm">{alerta.mensagem}</p>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Regras de Alerta Automático</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> CPL subiu mais de 20% em relação à média</li>
              <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> ROI de campanha abaixo de 8x</li>
              <li className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-warning" /> Ticket médio em queda por 2 períodos</li>
              <li className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-warning" /> Combos premium abaixo de 30% das vendas</li>
              <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Leads sem contato há mais de 24h</li>
            </ul>
          </CardContent>
        </Card>
      </AnimatedPage>
    </DashboardLayout>
  );
}
