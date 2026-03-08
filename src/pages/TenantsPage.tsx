import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Briefcase, Search, Users, DollarSign, BarChart3, Target, TrendingUp,
  Globe, Megaphone, ListTodo, FileText, Printer, CalendarDays, Eye,
  CheckCircle2, Clock, AlertTriangle, Wallet, Receipt, Lock, Unlock, Plus, Edit2, ShoppingCart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(262, 52%, 56%)', 'hsl(38, 92%, 50%)', 'hsl(340, 75%, 55%)'];
const tooltipStyle = { background: '#fff', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', fontSize: '13px' };

interface Cliente { id: string; nome: string; email: string | null; status: string; cidade: string | null; estado: string | null; mensalidade_valor: number; acesso_liberado: boolean; }
interface TenantData {
  marketing: any[];
  seoKeywords: any[];
  anuncios: any[];
  tarefas: any[];
  financeiro: any[];
  socialAccounts: any[];
  procedimentos: any[];
}

export default function TenantsPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading] = useState(true);

  // Financeiro
  const [showBoleto, setShowBoleto] = useState(false);
  const [boletoValor, setBoletoValor] = useState('');
  const [boletoDesc, setBoletoDesc] = useState('Mensalidade');
  const [boletoVenc, setBoletoVenc] = useState('');
  const [savingBoleto, setSavingBoleto] = useState(false);

  // Procedimentos
  const [showProcForm, setShowProcForm] = useState(false);
  const [editProcId, setEditProcId] = useState<string | null>(null);
  const [savingProc, setSavingProc] = useState(false);

  // Report period
  const [reportDays, setReportDays] = useState(30);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('clientes').select('id, nome, email, status, cidade, estado, mensalidade_valor, acesso_liberado').order('nome') as any;
      setClientes((data || []) as Cliente[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const loadTenantData = async (cliente: Cliente) => {
    setSelectedClient(cliente);
    setLoadingData(true);
    setBoletoValor(cliente.mensalidade_valor?.toString() || '0');
    const cid = cliente.id;
    const [mkt, seo, ads, tasks, fin, social, procs] = await Promise.all([
      supabase.from('marketing_reports').select('*').eq('cliente_id', cid).order('periodo_mes', { ascending: true }),
      supabase.from('seo_keywords').select('*').eq('cliente_id', cid),
      supabase.from('anuncios').select('*').eq('cliente_id', cid),
      supabase.from('tarefas_cliente').select('*').eq('cliente_id', cid).order('created_at', { ascending: false }),
      supabase.from('financeiro' as any).select('*').eq('cliente_id', cid).order('data_vencimento', { ascending: false }),
      supabase.from('social_media_accounts' as any).select('*').eq('cliente_id', cid),
      supabase.from('procedimentos').select('*').eq('cliente_id', cid).order('created_at', { ascending: false }),
    ]);
    setTenantData({
      marketing: (mkt.data || []) as any[],
      seoKeywords: (seo.data || []) as any[],
      anuncios: (ads.data || []) as any[],
      tarefas: (tasks.data || []) as any[],
      financeiro: (fin.data || []) as unknown as any[],
      socialAccounts: (social.data || []) as unknown as any[],
      procedimentos: (procs.data || []) as any[],
    });
    setLoadingData(false);
  };

  const handleEmitBoleto = async () => {
    if (!selectedClient) return;
    setSavingBoleto(true);
    const venc = boletoVenc || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const { error } = await supabase.from('financeiro' as any).insert({
      cliente_id: selectedClient.id,
      tipo: 'mensalidade',
      descricao: boletoDesc,
      valor: parseFloat(boletoValor) || 0,
      data_vencimento: venc,
      status: 'pendente',
      numero_boleto: `BOL-${Date.now().toString(36).toUpperCase()}`,
    } as any);
    if (error) { toast.error('Erro ao emitir boleto'); console.error(error); }
    else {
      toast.success('Boleto emitido!');
      setShowBoleto(false);
      loadTenantData(selectedClient);
    }
    setSavingBoleto(false);
  };

  const handleToggleAccess = async (cliente: Cliente) => {
    const { error } = await supabase.from('clientes').update({ acesso_liberado: !cliente.acesso_liberado } as any).eq('id', cliente.id);
    if (error) toast.error('Erro');
    else {
      toast.success(cliente.acesso_liberado ? 'Acesso bloqueado' : 'Acesso liberado');
      setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, acesso_liberado: !c.acesso_liberado } : c));
      if (selectedClient?.id === cliente.id) setSelectedClient({ ...cliente, acesso_liberado: !cliente.acesso_liberado });
    }
  };

  const handlePrintReport = () => { window.print(); };

  const handleSaveProc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient) return;
    setSavingProc(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      nome_procedimento: fd.get('nome') as string,
      categoria: fd.get('categoria') as string,
      ticket_medio: Number(fd.get('ticket')) || 0,
      margem_estimada: Number(fd.get('margem')) || 0,
      prioridade_vendas: fd.get('prioridade') as string || 'media',
      status: (fd.get('status') as string) || 'ativo',
      cliente_id: selectedClient.id,
    };
    if (editProcId) {
      const { error } = await supabase.from('procedimentos').update(data).eq('id', editProcId);
      if (error) toast.error('Erro ao atualizar procedimento');
      else toast.success('Procedimento atualizado!');
    } else {
      const { error } = await supabase.from('procedimentos').insert(data);
      if (error) toast.error('Erro ao criar procedimento');
      else toast.success('Procedimento criado!');
    }
    setShowProcForm(false);
    setEditProcId(null);
    setSavingProc(false);
    loadTenantData(selectedClient);
  };

  const filteredClientes = clientes.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.nome.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader title="Tenants" subtitle="Gestão consolidada de clientes" />

        {!selectedClient ? (
          <>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClientes.map(c => (
                <StaggerItem key={c.id}>
                  <Card className="cursor-pointer hover:shadow-md transition-all hover:ring-1 hover:ring-primary/30" onClick={() => loadTenantData(c)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10"><Briefcase className="h-4 w-4 text-primary" /></div>
                          <div>
                            <p className="text-sm font-semibold">{c.nome}</p>
                            {c.email && <p className="text-[11px] text-muted-foreground">{c.email}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {c.acesso_liberado ? <Unlock className="h-3.5 w-3.5 text-accent" /> : <Lock className="h-3.5 w-3.5 text-destructive" />}
                          <Badge variant={c.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px]">{c.status}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {c.cidade && <span>{c.cidade}{c.estado ? ` - ${c.estado}` : ''}</span>}
                        {c.mensalidade_valor > 0 && <span className="font-medium">R$ {c.mensalidade_valor.toLocaleString('pt-BR')}/mês</span>}
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Controle Vendas Clientes - Global Procedimentos */}
            <ControleVendasClientes clientes={clientes} />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="sm" onClick={() => { setSelectedClient(null); setTenantData(null); }}>← Voltar</Button>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{selectedClient.nome}</h3>
                <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
              </div>
              <Button variant={selectedClient.acesso_liberado ? 'destructive' : 'default'} size="sm" onClick={() => handleToggleAccess(selectedClient)}>
                {selectedClient.acesso_liberado ? <><Lock className="h-4 w-4 mr-1" /> Bloquear Acesso</> : <><Unlock className="h-4 w-4 mr-1" /> Liberar Acesso</>}
              </Button>
              <Dialog open={showBoleto} onOpenChange={setShowBoleto}>
                <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Receipt className="h-4 w-4" /> Emitir Boleto</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Emitir Boleto</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div><Label>Descrição</Label><Input value={boletoDesc} onChange={e => setBoletoDesc(e.target.value)} /></div>
                    <div><Label>Valor (R$)</Label><Input type="number" value={boletoValor} onChange={e => setBoletoValor(e.target.value)} /></div>
                    <div><Label>Vencimento</Label><Input type="date" value={boletoVenc} onChange={e => setBoletoVenc(e.target.value)} /></div>
                    <Button onClick={handleEmitBoleto} disabled={savingBoleto} className="w-full">
                      {savingBoleto ? 'Emitindo...' : 'Emitir Boleto'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex items-center gap-2">
                <Select value={reportDays.toString()} onValueChange={v => setReportDays(parseInt(v))}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handlePrintReport}><Printer className="h-4 w-4" /></Button>
              </div>
            </div>

            {loadingData ? (
              <div className="text-center py-12 text-muted-foreground">Carregando dados...</div>
            ) : tenantData && (
              <div className="space-y-6 print:space-y-4" id="tenant-report">
                {/* Summary KPIs */}
                <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><BarChart3 className="h-4 w-4 text-primary" /></div><div className="mt-2"><p className="text-xs text-muted-foreground">Relatórios Mkt</p><p className="text-xl font-bold">{tenantData.marketing.length}</p></div></CardContent></Card></StaggerItem>
                  <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Search className="h-4 w-4 text-primary" /></div><div className="mt-2"><p className="text-xs text-muted-foreground">Keywords SEO</p><p className="text-xl font-bold">{tenantData.seoKeywords.length}</p></div></CardContent></Card></StaggerItem>
                  <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Megaphone className="h-4 w-4 text-primary" /></div><div className="mt-2"><p className="text-xs text-muted-foreground">Anúncios</p><p className="text-xl font-bold">{tenantData.anuncios.length}</p></div></CardContent></Card></StaggerItem>
                  <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><ListTodo className="h-4 w-4 text-primary" /></div><div className="mt-2"><p className="text-xs text-muted-foreground">Tarefas</p><p className="text-xl font-bold">{tenantData.tarefas.length}</p></div></CardContent></Card></StaggerItem>
                  <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Globe className="h-4 w-4 text-primary" /></div><div className="mt-2"><p className="text-xs text-muted-foreground">Redes Sociais</p><p className="text-xl font-bold">{tenantData.socialAccounts.length}</p></div></CardContent></Card></StaggerItem>
                  <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><Wallet className="h-4 w-4 text-primary" /></div><div className="mt-2"><p className="text-xs text-muted-foreground">Cobranças</p><p className="text-xl font-bold">{tenantData.financeiro.length}</p></div></CardContent></Card></StaggerItem>
                  <StaggerItem><Card><CardContent className="p-4"><div className="p-2 rounded-xl bg-primary/10 w-fit"><FileText className="h-4 w-4 text-primary" /></div><div className="mt-2"><p className="text-xs text-muted-foreground">Procedimentos</p><p className="text-xl font-bold">{tenantData.procedimentos.length}</p></div></CardContent></Card></StaggerItem>
                </StaggerContainer>

                {/* Marketing charts */}
                {tenantData.marketing.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Tráfego</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={tenantData.marketing.map((m: any) => ({ mes: new Date(m.periodo_mes + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }), total: m.visitas_site }))}>
                            <defs><linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217,91%,60%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(217,91%,60%)" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,93%)" vertical={false} />
                            <XAxis dataKey="mes" fontSize={10} stroke="hsl(220,9%,46%)" axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} stroke="hsl(220,9%,46%)" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="total" stroke="hsl(217,91%,60%)" fill="url(#tGrad)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Leads</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={tenantData.marketing.map((m: any) => ({ mes: new Date(m.periodo_mes + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }), gerados: m.leads_gerados, qualificados: m.leads_qualificados }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,93%)" vertical={false} />
                            <XAxis dataKey="mes" fontSize={10} stroke="hsl(220,9%,46%)" axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} stroke="hsl(220,9%,46%)" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="gerados" name="Gerados" fill="hsl(217,91%,60%)" radius={[4,4,0,0]} barSize={14} />
                            <Bar dataKey="qualificados" name="Qualificados" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} barSize={14} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Financeiro */}
                {tenantData.financeiro.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Financeiro</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b bg-muted/30">
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Descrição</th>
                            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Valor</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Vencimento</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Status</th>
                          </tr></thead>
                          <tbody>
                            {tenantData.financeiro.map((f: any) => {
                              const isOverdue = f.status === 'pendente' && new Date(f.data_vencimento) < new Date();
                              return (
                                <tr key={f.id} className="border-b last:border-0 hover:bg-muted/20">
                                  <td className="p-3 font-medium">{f.descricao || f.tipo}{f.numero_boleto && <span className="text-[10px] text-muted-foreground ml-2">{f.numero_boleto}</span>}</td>
                                  <td className="p-3 text-right font-semibold">R$ {f.valor?.toLocaleString('pt-BR')}</td>
                                  <td className="p-3 text-center text-muted-foreground">{new Date(f.data_vencimento).toLocaleDateString('pt-BR')}</td>
                                  <td className="p-3 text-center">
                                    <Badge variant="outline" className={`text-[10px] ${f.status === 'pago' ? 'text-accent border-accent' : isOverdue ? 'text-destructive border-destructive' : 'text-warning border-warning'}`}>
                                      {f.status === 'pago' ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tarefas */}
                {tenantData.tarefas.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><ListTodo className="h-4 w-4 text-primary" /> Tarefas</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tenantData.tarefas.slice(0, 10).map((t: any) => (
                          <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/20">
                            {t.status === 'pronta' ? <CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> : t.status === 'fazendo' ? <Clock className="h-4 w-4 text-primary shrink-0" /> : <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{t.titulo}</p></div>
                            <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Controle Vendas Clientes */}
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Controle Vendas Clientes</CardTitle>
                    <Dialog open={showProcForm} onOpenChange={(o) => { setShowProcForm(o); if (!o) setEditProcId(null); }}>
                      <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Novo</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>{editProcId ? 'Editar' : 'Novo'} Procedimento</DialogTitle></DialogHeader>
                        <form onSubmit={handleSaveProc} className="space-y-4">
                          <div><Label htmlFor="proc-nome">Nome</Label><Input id="proc-nome" name="nome" defaultValue={editProcId ? tenantData.procedimentos.find((p: any) => p.id === editProcId)?.nome_procedimento : ''} required className="mt-1" /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label>Categoria</Label>
                              <Select name="categoria" defaultValue={editProcId ? tenantData.procedimentos.find((p: any) => p.id === editProcId)?.categoria : 'facial'}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="facial">Facial</SelectItem>
                                  <SelectItem value="capilar">Capilar</SelectItem>
                                  <SelectItem value="combo_premium">Combo Premium</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div><Label>Prioridade</Label>
                              <Select name="prioridade" defaultValue={editProcId ? tenantData.procedimentos.find((p: any) => p.id === editProcId)?.prioridade_vendas : 'media'}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="alta">Alta</SelectItem>
                                  <SelectItem value="media">Média</SelectItem>
                                  <SelectItem value="baixa">Baixa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="proc-ticket">Ticket Médio (R$)</Label><Input id="proc-ticket" name="ticket" type="number" defaultValue={editProcId ? tenantData.procedimentos.find((p: any) => p.id === editProcId)?.ticket_medio : ''} required className="mt-1" /></div>
                            <div><Label htmlFor="proc-margem">Margem (%)</Label><Input id="proc-margem" name="margem" type="number" defaultValue={editProcId ? tenantData.procedimentos.find((p: any) => p.id === editProcId)?.margem_estimada : ''} required className="mt-1" /></div>
                          </div>
                          {editProcId && (
                            <div><Label>Status</Label>
                              <Select name="status" defaultValue={tenantData.procedimentos.find((p: any) => p.id === editProcId)?.status || 'ativo'}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
                              </Select>
                            </div>
                          )}
                          <Button type="submit" className="w-full" disabled={savingProc}>{savingProc ? 'Salvando...' : 'Salvar'}</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="p-0">
                    {tenantData.procedimentos.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b bg-muted/30">
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Nome</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Categoria</th>
                            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Ticket Médio</th>
                            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Margem</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Prioridade</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Status</th>
                            <th className="p-3"></th>
                          </tr></thead>
                          <tbody>
                            {tenantData.procedimentos.map((p: any) => (
                              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                                <td className="p-3 font-medium">{p.nome_procedimento}</td>
                                <td className="p-3 text-center"><Badge variant="outline" className="text-[10px]">{p.categoria}</Badge></td>
                                <td className="p-3 text-right">R$ {p.ticket_medio?.toLocaleString('pt-BR')}</td>
                                <td className="p-3 text-right">{p.margem_estimada}%</td>
                                <td className="p-3 text-center"><Badge variant="outline" className="text-[10px]">{p.prioridade_vendas}</Badge></td>
                                <td className="p-3 text-center">
                                  <Badge variant="outline" className={`text-[10px] ${p.status === 'ativo' ? 'text-accent border-accent' : 'text-muted-foreground'}`}>{p.status}</Badge>
                                </td>
                                <td className="p-3"><Button variant="ghost" size="sm" onClick={() => { setEditProcId(p.id); setShowProcForm(true); }}><Edit2 className="h-3.5 w-3.5" /></Button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-sm text-muted-foreground">Nenhum procedimento cadastrado para este cliente.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}
