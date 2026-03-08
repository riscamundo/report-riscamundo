import { useState } from 'react';
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
import { calcInvestimentoTotal, calcCPL, getROIPorCampanha } from '@/lib/metrics';
import { DollarSign, Users, Target, TrendingUp, Plus, Edit2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MidiaPage() {
  const { campanhas, leads, vendas, procedimentos, addCampanha, updateCampanha } = useStoreContext();
  const [editId, setEditId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const editItem = editId ? campanhas.find(c => c.id === editId) : null;

  const investimento = calcInvestimentoTotal(campanhas);
  const leadsGerados = leads.length;
  const cpl = calcCPL(campanhas, leads);
  const roiData = getROIPorCampanha(campanhas, vendas, leads);
  const receitaTotal = vendas.filter(v => v.status === 'fechado').reduce((s, v) => s + v.valor_venda, 0);
  const roiGeral = investimento > 0 ? receitaTotal / investimento : 0;

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

  const getLeadsCount = (id: string) => leads.filter(l => l.campanha_id === id).length;
  const getReceita = (id: string) => {
    const leadsC = leads.filter(l => l.campanha_id === id);
    return vendas.filter(v => v.status === 'fechado' && leadsC.some(l => l.id === v.lead_id)).reduce((s, v) => s + v.valor_venda, 0);
  };

  const investVsReceita = campanhas.map(c => ({ nome: c.nome_campanha, investimento: c.investimento, receita: getReceita(c.id) }));

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      canal: fd.get('canal') as string,
      nome_campanha: fd.get('nome') as string,
      procedimento_foco: (fd.get('procedimento') as string) || null,
      investimento: Number(fd.get('investimento')),
      periodo_inicio: fd.get('inicio') as string,
      periodo_fim: fd.get('fim') as string,
      status: (fd.get('status') as string) || 'ativo',
    };
    if (editItem) {
      await updateCampanha(editItem.id, data);
    } else {
      await addCampanha(data);
    }
    setIsOpen(false);
    setEditId(null);
  };

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader
          title="Mídia & Performance"
          subtitle="Controle de campanhas e ROI"
          action={
            <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setEditId(null); }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Campanha</Button></DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-display">{editItem ? 'Editar' : 'Nova'} Campanha</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
                  <div><Label>Nome</Label><Input name="nome" defaultValue={editItem?.nome_campanha} required className="mt-1" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Canal</Label>
                      <Select name="canal" defaultValue={editItem?.canal || 'Meta Ads'}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Google Ads">Google Ads</SelectItem>
                          <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                          <SelectItem value="Instagram Orgânico">Instagram Orgânico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Investimento (R$)</Label><Input name="investimento" type="number" defaultValue={editItem?.investimento} required className="mt-1" /></div>
                  </div>
                  <div><Label>Procedimento Foco</Label>
                    <Select name="procedimento" defaultValue={editItem?.procedimento_foco || procedimentos[0]?.id}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{procedimentos.filter(p => p.status === 'ativo').map(p => <SelectItem key={p.id} value={p.id}>{p.nome_procedimento}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Início</Label><Input name="inicio" type="date" defaultValue={editItem?.periodo_inicio || ''} required className="mt-1" /></div>
                    <div><Label>Fim</Label><Input name="fim" type="date" defaultValue={editItem?.periodo_fim || ''} required className="mt-1" /></div>
                  </div>
                  <Button type="submit" className="w-full">Salvar</Button>
                </form>
              </DialogContent>
            </Dialog>
          }
        />

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StaggerItem><KPICard title="Investimento Total" value={fmt(investimento)} icon={DollarSign} /></StaggerItem>
          <StaggerItem><KPICard title="Leads Gerados" value={String(leadsGerados)} icon={Users} /></StaggerItem>
          <StaggerItem><KPICard title="CPL Médio" value={fmt(cpl)} icon={Target} /></StaggerItem>
          <StaggerItem><KPICard title="Receita Atribuída" value={fmt(receitaTotal)} icon={TrendingUp} /></StaggerItem>
          <StaggerItem><KPICard title="ROI Geral" value={`${roiGeral.toFixed(1)}x`} icon={TrendingUp} trend={roiGeral >= 8 ? 'up' : 'down'} /></StaggerItem>
        </StaggerContainer>

        <Card className="mb-6">
          <CardContent className="p-0">
            {campanhas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Investimento</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>CPL</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campanhas.map(c => {
                    const lc = getLeadsCount(c.id);
                    const rc = getReceita(c.id);
                    const campCpl = lc > 0 ? c.investimento / lc : 0;
                    const campRoi = c.investimento > 0 ? rc / c.investimento : 0;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nome_campanha}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{c.canal}</Badge></TableCell>
                        <TableCell>{fmt(c.investimento)}</TableCell>
                        <TableCell>{lc}</TableCell>
                        <TableCell>{fmt(campCpl)}</TableCell>
                        <TableCell>{fmt(rc)}</TableCell>
                        <TableCell className={campRoi < 8 ? 'text-destructive' : 'text-success'}>{campRoi.toFixed(1)}x</TableCell>
                        <TableCell>
                          <Badge className={c.status === 'ativo' ? 'bg-success/20 text-success border-0' : c.status === 'pausado' ? 'bg-warning/20 text-warning border-0' : 'bg-muted text-muted-foreground border-0'}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => { setEditId(c.id); setIsOpen(true); }}><Edit2 className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center">
                <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma campanha cadastrada.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {campanhas.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base font-sans">Receita x Investimento</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={investVsReceita}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="nome" stroke="hsl(220, 15%, 45%)" fontSize={10} angle={-15} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(220, 15%, 45%)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid hsl(220, 15%, 88%)', borderRadius: '8px' }} formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="investimento" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Investimento" />
                    <Bar dataKey="receita" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-sans">ROI por Campanha</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={roiData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="nome" stroke="hsl(220, 15%, 45%)" fontSize={10} angle={-15} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(220, 15%, 45%)" fontSize={12} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid hsl(220, 15%, 88%)', borderRadius: '8px' }} formatter={(v: number) => `${v.toFixed(1)}x`} />
                    <Bar dataKey="roi" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}
