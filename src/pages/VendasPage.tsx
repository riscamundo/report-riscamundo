import { useState, useMemo } from 'react';
import { useStoreContext } from '@/contexts/StoreContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard, PageHeader } from '@/components/KPICard';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { FormaPagamento } from '@/types';
import { calcFaturamentoMes, calcTicketMedio, calcConversao, calcForecast } from '@/lib/metrics';
import { DollarSign, TrendingUp, Target, BarChart3, Plus, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const pagamentoLabels: Record<FormaPagamento, string> = {
  pix: 'PIX', cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito', boleto: 'Boleto', financiamento: 'Financiamento'
};

export default function VendasPage() {
  const { vendas, leads, procedimentos, campanhas, addVenda } = useStoreContext();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const faturamento = calcFaturamentoMes(vendas);
  const ticketMedio = calcTicketMedio(vendas);
  const conversao = calcConversao(leads, vendas);
  const forecast = calcForecast(leads, vendas, procedimentos);
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  const leadsDisponiveis = leads.filter(l => l.status_funil === 'avaliacao' || l.status_funil === 'venda');

  const forecastChart = [
    { nome: 'Realizado', valor: faturamento },
    { nome: 'Projeção Mensal', valor: forecast.receitaProjetadaMensal },
    { nome: 'Meta (ROI 8x)', valor: forecast.investimentoIdeal * 8 },
  ];

  const sortedVendas = useMemo(() => {
    let result = [...vendas].sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime());
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(v => {
        const lead = leads.find(l => l.id === v.lead_id);
        const proc = procedimentos.find(p => p.id === v.procedimento_vendido);
        return lead?.nome.toLowerCase().includes(q) || proc?.nome_procedimento.toLowerCase().includes(q);
      });
    }
    return result;
  }, [vendas, search, leads, procedimentos]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const leadId = fd.get('lead') as string;
    const lead = leads.find(l => l.id === leadId);
    await addVenda({
      lead_id: leadId || null,
      procedimento_vendido: lead?.procedimento_interesse || null,
      valor_venda: Number(fd.get('valor')),
      forma_pagamento: fd.get('pagamento') as string,
      data_venda: new Date().toISOString().split('T')[0],
      status: 'fechado',
    });
    setIsOpen(false);
  };

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader
          title="Vendas & Forecast"
          subtitle="Controle de vendas e projeções"
          action={
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Registrar Venda</Button></DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-display">Nova Venda</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
                  <div><Label>Lead</Label>
                    <Select name="lead" defaultValue={leadsDisponiveis[0]?.id}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o lead..." /></SelectTrigger>
                      <SelectContent>{leadsDisponiveis.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                    </Select>
                    {leadsDisponiveis.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Nenhum lead em avaliação/venda. Mova leads no funil primeiro.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Valor (R$)</Label><Input name="valor" type="number" required className="mt-1" /></div>
                    <div><Label>Pagamento</Label>
                      <Select name="pagamento" defaultValue="pix">
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(pagamentoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={leadsDisponiveis.length === 0}>Salvar Venda</Button>
                </form>
              </DialogContent>
            </Dialog>
          }
        />

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StaggerItem><KPICard title="Faturamento Atual" value={fmt(faturamento)} icon={DollarSign} /></StaggerItem>
          <StaggerItem><KPICard title="Receita Projetada" value={fmt(forecast.receitaProjetadaMensal)} subtitle={`${forecast.leadsAtivos} leads ativos`} icon={TrendingUp} /></StaggerItem>
          <StaggerItem><KPICard title="Investimento Ideal" value={fmt(forecast.investimentoIdeal)} subtitle="Para ROI 8x" icon={Target} /></StaggerItem>
          <StaggerItem><KPICard title="Ponto de Escala" value={fmt(forecast.pontoEscala)} subtitle="Investimento seguro" icon={BarChart3} /></StaggerItem>
        </StaggerContainer>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base font-sans">Projeção vs Realizado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={forecastChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis dataKey="nome" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: '8px' }} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="valor" fill="hsl(38, 70%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-sans">Histórico de Vendas</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVendas.map(v => {
                  const lead = leads.find(l => l.id === v.lead_id);
                  const proc = procedimentos.find(p => p.id === v.procedimento_vendido);
                  return (
                    <TableRow key={v.id}>
                      <TableCell>{new Date(v.data_venda).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-medium">{lead?.nome || '-'}</TableCell>
                      <TableCell>{proc?.nome_procedimento || '-'}</TableCell>
                      <TableCell className="font-medium">{fmt(v.valor_venda)}</TableCell>
                      <TableCell>{pagamentoLabels[v.forma_pagamento as FormaPagamento] || v.forma_pagamento || '-'}</TableCell>
                      <TableCell>
                        <Badge className={v.status === 'fechado' ? 'bg-success/20 text-success border-0' : 'bg-destructive/20 text-destructive border-0'}>
                          {v.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sortedVendas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {search ? 'Nenhum resultado encontrado' : 'Nenhuma venda registrada'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AnimatedPage>
    </DashboardLayout>
  );
}
