import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { motion } from 'framer-motion';
import {
  User, ShoppingBag, CreditCard, Clock, LogOut, CheckCircle2, AlertCircle,
  CalendarDays, DollarSign, FileText, TrendingUp
} from 'lucide-react';

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

export default function ClientPortalPage() {
  const { user, signOut } = useAuth();
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [vendas, setVendas] = useState<VendaCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [clienteRes, vendasRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('vendas_cliente' as any).select('*'),
      ]);
      setCliente(clienteRes.data as ClienteData | null);
      setVendas((vendasRes.data || []) as VendaCliente[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const totalGasto = vendas.filter(v => v.status === 'fechado').reduce((s, v) => s + v.valor_venda, 0);
  const totalProcedimentos = vendas.filter(v => v.status === 'fechado').length;
  const pendentes = vendas.filter(v => v.status === 'pendente');

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto">
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
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
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">
          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-bold">Olá, {cliente?.nome || 'Cliente'} 👋</h2>
            <p className="text-muted-foreground text-sm mt-1">Acompanhe seus procedimentos, pagamentos e status de atendimento.</p>
          </div>

          {/* KPI Cards */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StaggerItem>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
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
                  <div className="p-2.5 rounded-xl bg-accent/10">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
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
                  <div className="p-2.5 rounded-xl bg-warning/10">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                    <p className="text-xl font-bold">{pendentes.length}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* Status de Atendimento */}
          {pendentes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Atendimentos em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendentes.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                      <div>
                        <p className="text-sm font-medium">{v.nome_procedimento || 'Procedimento'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(v.data_venda).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Badge variant="outline" className="text-warning border-warning">Pendente</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Histórico de Procedimentos & Pagamentos
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

          {/* Dados do cliente */}
          {cliente && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Meus Dados
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
        </div>
      </AnimatedPage>
    </div>
  );
}
