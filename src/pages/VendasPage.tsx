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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FormaPagamento, StatusFunil } from '@/types';
import { calcFaturamentoMes, calcTicketMedio, calcConversao, calcForecast, getLeadsPorEtapa } from '@/lib/metrics';
import { DollarSign, TrendingUp, Target, BarChart3, Plus, Search, GripVertical, Clock, Users, Building2, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ContatosEmpresasTab } from '@/components/ContatosEmpresasTab';
import { LlmMaestroTab } from '@/components/LlmMaestroTab';

const pagamentoLabels: Record<FormaPagamento, string> = {
  pix: 'PIX', cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito', boleto: 'Boleto', financiamento: 'Financiamento'
};

const etapaLabels: Record<StatusFunil, string> = {
  novo: 'Novo Lead', qualificado: 'Qualificado', avaliacao: 'Avaliação', venda: 'Venda', perdido: 'Perdido'
};
const etapaColors: Record<StatusFunil, string> = {
  novo: 'border-info/30 bg-info/5', qualificado: 'border-primary/30 bg-primary/5', avaliacao: 'border-warning/30 bg-warning/5', venda: 'border-success/30 bg-success/5', perdido: 'border-destructive/30 bg-destructive/5'
};

export default function VendasPage() {
  const { vendas, leads, procedimentos, campanhas, addVenda, addLead, updateLead } = useStoreContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isLeadOpen, setIsLeadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [funilSearch, setFunilSearch] = useState('');
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  const faturamento = calcFaturamentoMes(vendas);
  const ticketMedio = calcTicketMedio(vendas);
  const conversao = calcConversao(leads, vendas);
  const forecast = calcForecast(leads, vendas, procedimentos);
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  

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

  // Funil
  const etapas: StatusFunil[] = ['novo', 'qualificado', 'avaliacao', 'venda', 'perdido'];
  const etapaData = getLeadsPorEtapa(leads);
  const filteredLeads = useMemo(() => {
    if (!funilSearch.trim()) return leads;
    const q = funilSearch.toLowerCase();
    return leads.filter(l => l.nome.toLowerCase().includes(q) || l.telefone?.toLowerCase().includes(q));
  }, [leads, funilSearch]);
  const getDaysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  const handleDrop = async (etapa: StatusFunil) => {
    if (!draggedLead) return;
    const lead = leads.find(l => l.id === draggedLead);
    if (lead && lead.status_funil !== etapa) await updateLead(lead.id, { status_funil: etapa });
    setDraggedLead(null);
  };

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
    setSelectedLeadId('');
  };

  const handleSaveLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await addLead({
      nome: fd.get('nome') as string,
      telefone: fd.get('telefone') as string,
      origem: fd.get('origem') as string,
      campanha_id: (fd.get('campanha') as string) || null,
      procedimento_interesse: (fd.get('procedimento') as string) || null,
      nivel_interesse: fd.get('interesse') as string,
      status_funil: 'novo',
      escopo_projeto: fd.get('escopo_projeto') as string || null,
    } as any);
    setIsLeadOpen(false);
  };

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader title="Vendas & Forecast" subtitle="Controle de vendas, funil e projeções" />

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StaggerItem><KPICard title="Faturamento Atual" value={fmt(faturamento)} icon={DollarSign} /></StaggerItem>
          <StaggerItem><KPICard title="Receita Projetada" value={fmt(forecast.receitaProjetadaMensal)} subtitle={`${forecast.leadsAtivos} leads ativos`} icon={TrendingUp} /></StaggerItem>
          <StaggerItem><KPICard title="Investimento Ideal" value={fmt(forecast.investimentoIdeal)} subtitle="Para ROI 8x" icon={Target} /></StaggerItem>
          <StaggerItem><KPICard title="Ponto de Escala" value={fmt(forecast.pontoEscala)} subtitle="Investimento seguro" icon={BarChart3} /></StaggerItem>
        </StaggerContainer>

        <Tabs defaultValue="vendas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vendas" className="gap-1.5"><DollarSign className="h-4 w-4" /> Vendas</TabsTrigger>
            <TabsTrigger value="funil" className="gap-1.5"><Users className="h-4 w-4" /> Funil de Vendas</TabsTrigger>
            <TabsTrigger value="contatos" className="gap-1.5"><Building2 className="h-4 w-4" /> Contatos & Empresas</TabsTrigger>
            <TabsTrigger value="llm" className="gap-1.5"><Brain className="h-4 w-4" /> LLM Maestro</TabsTrigger>
          </TabsList>

          {/* ═══════ VENDAS TAB ═══════ */}
          <TabsContent value="vendas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Registrar Venda</Button></DialogTrigger>
                <DialogContent className="bg-card">
                  <DialogHeader><DialogTitle className="font-display">Nova Venda</DialogTitle></DialogHeader>
                  <form onSubmit={handleSave} className="space-y-4">
                    <div><Label>Lead</Label>
                      <Select name="lead" value={selectedLeadId} onValueChange={(val) => setSelectedLeadId(val)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o lead..." /></SelectTrigger>
                        <SelectContent>
                          {leads.map(l => {
                            const proc = procedimentos.find(p => p.id === l.procedimento_interesse);
                            return (
                              <SelectItem key={l.id} value={l.id}>
                                {l.nome} {proc ? `· ${proc.nome_procedimento}` : ''} ({etapaLabels[l.status_funil as StatusFunil] || l.status_funil})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {leads.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Nenhum lead cadastrado. Cadastre leads no funil primeiro.</p>
                      )}
                    </div>
                    {(() => {
                      const selectedLead = leads.find(l => l.id === selectedLeadId);
                      const proc = selectedLead ? procedimentos.find(p => p.id === selectedLead.procedimento_interesse) : null;
                      return selectedLead ? (
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Serviço:</span>
                            <span className="font-medium">{proc?.nome_procedimento || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Escopo do Projeto:</span>
                            <span className="font-medium">{(selectedLead as any).escopo_projeto || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Interesse:</span>
                            <Badge variant="outline" className="text-[10px]">{selectedLead.nivel_interesse}</Badge>
                          </div>
                        </div>
                      ) : null;
                    })()}
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Valor (R$)</Label><Input name="valor" type="number" required className="mt-1" /></div>
                      <div><Label>Pagamento</Label>
                        <Select name="pagamento" defaultValue="pix">
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(pagamentoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={leads.length === 0}>Salvar Venda</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="mb-6">
              <CardHeader><CardTitle className="text-base font-sans">Projeção vs Realizado</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={forecastChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="nome" stroke="hsl(220, 15%, 45%)" fontSize={12} />
                    <YAxis stroke="hsl(220, 15%, 45%)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid hsl(220, 15%, 88%)', borderRadius: '10px' }} formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="valor" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
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
          </TabsContent>

          {/* ═══════ FUNIL TAB ═══════ */}
          <TabsContent value="funil" className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">{leads.length} leads no pipeline</p>
              <Dialog open={isLeadOpen} onOpenChange={setIsLeadOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button></DialogTrigger>
                <DialogContent className="bg-card">
                  <DialogHeader><DialogTitle className="font-display">Novo Lead</DialogTitle></DialogHeader>
                  <form onSubmit={handleSaveLead} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Nome *</Label><Input name="nome" required className="mt-1" /></div>
                      <div><Label>Telefone</Label><Input name="telefone" placeholder="(00) 00000-0000" className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Origem</Label>
                        <Select name="origem" defaultValue="Meta Ads">
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Google Ads">Google Ads</SelectItem>
                            <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                            <SelectItem value="Instagram Orgânico">Instagram Orgânico</SelectItem>
                            <SelectItem value="Indicação">Indicação</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Telefone">Telefone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Nível de Interesse</Label>
                        <Select name="interesse" defaultValue="medio">
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alto">🔥 Alto</SelectItem>
                            <SelectItem value="medio">⚡ Médio</SelectItem>
                            <SelectItem value="baixo">💤 Baixo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Serviço de Interesse</Label>
                      <Select name="procedimento" defaultValue={procedimentos.filter(p => p.status === 'ativo')[0]?.id}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o serviço..." /></SelectTrigger>
                        <SelectContent>{procedimentos.filter(p => p.status === 'ativo').map(p => <SelectItem key={p.id} value={p.id}>{p.nome_procedimento}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Escopo do Projeto</Label><Input name="escopo_projeto" placeholder="Descreva o escopo do projeto..." className="mt-1" /></div>
                    {campanhas.length > 0 && (
                      <div><Label>Campanha</Label>
                        <Select name="campanha" defaultValue={campanhas[0]?.id}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>{campanhas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_campanha}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button type="submit" className="w-full">Salvar Lead</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou telefone..." value={funilSearch} onChange={e => setFunilSearch(e.target.value)} className="pl-9" />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {etapas.map(etapa => {
                const etapaLeads = filteredLeads.filter(l => l.status_funil === etapa);
                const data = etapaData.find(e => e.etapa === etapa);
                return (
                  <div key={etapa} className="min-w-[240px] md:min-w-[260px] flex-1"
                    onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(etapa)}>
                    <div className={`rounded-xl border ${etapaColors[etapa]} p-3 min-h-[200px]`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">{etapaLabels[etapa]}</h3>
                        <Badge variant="outline" className="text-xs">{data?.count || 0}</Badge>
                      </div>
                      <div className="space-y-2">
                        {etapaLeads.map(lead => {
                          const proc = procedimentos.find(p => p.id === lead.procedimento_interesse);
                          const days = getDaysSince(lead.created_at);
                          const isUrgent = etapa === 'novo' && days > 0;
                          return (
                            <Card key={lead.id} draggable onDragStart={() => setDraggedLead(lead.id)}
                              className={`cursor-grab active:cursor-grabbing bg-card border-border/50 transition-all hover:shadow-md hover:border-primary/20 ${draggedLead === lead.id ? 'opacity-50 scale-95' : ''} ${isUrgent ? 'ring-1 ring-destructive/30' : ''}`}>
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium text-sm">{lead.nome}</p>
                                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                {lead.telefone && <p className="text-xs text-muted-foreground mb-1">{lead.telefone}</p>}
                                <p className="text-xs text-muted-foreground mb-2">{proc?.nome_procedimento || '-'}</p>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className={`text-[10px] h-5 ${lead.nivel_interesse === 'alto' ? 'border-destructive/30 text-destructive' : lead.nivel_interesse === 'medio' ? 'border-primary/30 text-primary' : 'border-muted-foreground/30'}`}>
                                    {lead.nivel_interesse === 'alto' ? '🔥 Alto' : lead.nivel_interesse === 'medio' ? '⚡ Médio' : '💤 Baixo'}
                                  </Badge>
                                  <span className={`text-xs flex items-center gap-1 ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    <Clock className="h-3 w-3" /> {days}d
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        {etapaLeads.length === 0 && (
                          <div className="text-center py-6 text-xs text-muted-foreground">Arraste leads aqui</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══════ CONTATOS & EMPRESAS TAB ═══════ */}
          <TabsContent value="contatos" className="space-y-4">
            <ContatosEmpresasTab />
          </TabsContent>
        </Tabs>
      </AnimatedPage>
    </DashboardLayout>
  );
}
