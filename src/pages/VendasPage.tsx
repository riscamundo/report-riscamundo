import { useState } from 'react';
import { useStoreContext } from '@/contexts/StoreContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard, PageHeader } from '@/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Venda, FormaPagamento } from '@/types';
import { calcFaturamentoMes, calcTicketMedio, calcConversao, calcForecast } from '@/lib/metrics';
import { DollarSign, TrendingUp, Target, BarChart3, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const pagamentoLabels: Record<FormaPagamento, string> = {
  pix: 'PIX', cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito', boleto: 'Boleto', financiamento: 'Financiamento'
};

export default function VendasPage() {
  const { vendas, leads, procedimentos, campanhas, addVenda } = useStoreContext();
  const [isOpen, setIsOpen] = useState(false);

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

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const leadId = fd.get('lead') as string;
    const lead = leads.find(l => l.id === leadId);
    const venda: Venda = {
      id: `v${Date.now()}`,
      lead_id: leadId,
      procedimento_vendido: lead?.procedimento_interesse || '',
      valor_venda: Number(fd.get('valor')),
      forma_pagamento: fd.get('pagamento') as FormaPagamento,
      data_venda: new Date().toISOString().split('T')[0],
      vendedor: fd.get('vendedor') as string,
      status: 'fechado',
    };
    addVenda(venda);
    setIsOpen(false);
  };

  return (
    <DashboardLayout>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{leadsDisponiveis.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Valor (R$)</Label><Input name="valor" type="number" required /></div>
                  <div><Label>Vendedor</Label><Input name="vendedor" required /></div>
                </div>
                <div><Label>Pagamento</Label>
                  <Select name="pagamento" defaultValue="pix">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(pagamentoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Forecast KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Faturamento Atual" value={fmt(faturamento)} icon={DollarSign} />
        <KPICard title="Receita Projetada" value={fmt(forecast.receitaProjetadaMensal)} subtitle={`${forecast.leadsAtivos} leads ativos`} icon={TrendingUp} />
        <KPICard title="Investimento Ideal" value={fmt(forecast.investimentoIdeal)} subtitle="Para ROI 8x" icon={Target} />
        <KPICard title="Ponto de Escala" value={fmt(forecast.pontoEscala)} subtitle="Investimento seguro" icon={BarChart3} />
      </div>

      {/* Forecast Chart */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base font-sans">Projeção vs Realizado</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={forecastChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis dataKey="nome" stroke="hsl(220, 10%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: '8px' }} formatter={(v: number) => fmt(v)} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {forecastChart.map((_, i) => (
                  <rect key={i} fill={['hsl(38, 70%, 50%)', 'hsl(200, 60%, 50%)', 'hsl(150, 50%, 45%)'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Vendas Table */}
      <Card>
        <CardHeader><CardTitle className="text-base font-sans">Histórico de Vendas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime()).map(v => {
                const lead = leads.find(l => l.id === v.lead_id);
                const proc = procedimentos.find(p => p.id === v.procedimento_vendido);
                return (
                  <TableRow key={v.id}>
                    <TableCell>{new Date(v.data_venda).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{lead?.nome || '-'}</TableCell>
                    <TableCell>{proc?.nome_procedimento || '-'}</TableCell>
                    <TableCell className="font-medium">{fmt(v.valor_venda)}</TableCell>
                    <TableCell>{pagamentoLabels[v.forma_pagamento]}</TableCell>
                    <TableCell>{v.vendedor}</TableCell>
                    <TableCell>
                      <Badge className={v.status === 'fechado' ? 'bg-success/20 text-success border-0' : 'bg-destructive/20 text-destructive border-0'}>
                        {v.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
