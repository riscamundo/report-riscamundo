import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, BarChart3, Globe, MousePointerClick, Users, Target, MessageSquare, TrendingUp } from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
}

interface MarketingReport {
  id: string;
  cliente_id: string;
  periodo_mes: string;
  visitas_site: number;
  visitas_organicas: number;
  visitas_pagas: number;
  palavras_chave_top10: number;
  impressoes_ads: number;
  cliques_ads: number;
  custo_ads: number;
  conversoes_ads: number;
  seguidores_total: number;
  novos_seguidores: number;
  engajamento_rate: number;
  posts_publicados: number;
  leads_gerados: number;
  leads_qualificados: number;
  observacoes: string | null;
}

const emptyReport: Omit<MarketingReport, 'id'> = {
  cliente_id: '',
  periodo_mes: new Date().toISOString().slice(0, 7) + '-01',
  visitas_site: 0,
  visitas_organicas: 0,
  visitas_pagas: 0,
  palavras_chave_top10: 0,
  impressoes_ads: 0,
  cliques_ads: 0,
  custo_ads: 0,
  conversoes_ads: 0,
  seguidores_total: 0,
  novos_seguidores: 0,
  engajamento_rate: 0,
  posts_publicados: 0,
  leads_gerados: 0,
  leads_qualificados: 0,
  observacoes: null,
};

export default function MarketingConfigPage() {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [reports, setReports] = useState<MarketingReport[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingReport | null>(null);
  const [form, setForm] = useState(emptyReport);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [clientesRes, reportsRes] = await Promise.all([
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('marketing_reports').select('*').order('periodo_mes', { ascending: false }),
    ]);
    setClientes((clientesRes.data || []) as Cliente[]);
    setReports((reportsRes.data || []) as MarketingReport[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpen = (report?: MarketingReport) => {
    if (report) {
      setEditing(report);
      setForm({ ...report });
    } else {
      setEditing(null);
      setForm({ ...emptyReport, cliente_id: selectedCliente !== 'all' ? selectedCliente : '' });
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id) { toast({ title: 'Selecione um cliente', variant: 'destructive' }); return; }

    const payload = {
      cliente_id: form.cliente_id,
      periodo_mes: form.periodo_mes,
      visitas_site: form.visitas_site,
      visitas_organicas: form.visitas_organicas,
      visitas_pagas: form.visitas_pagas,
      palavras_chave_top10: form.palavras_chave_top10,
      impressoes_ads: form.impressoes_ads,
      cliques_ads: form.cliques_ads,
      custo_ads: form.custo_ads,
      conversoes_ads: form.conversoes_ads,
      seguidores_total: form.seguidores_total,
      novos_seguidores: form.novos_seguidores,
      engajamento_rate: form.engajamento_rate,
      posts_publicados: form.posts_publicados,
      leads_gerados: form.leads_gerados,
      leads_qualificados: form.leads_qualificados,
      observacoes: form.observacoes,
    };

    if (editing) {
      const { error } = await supabase.from('marketing_reports').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Relatório atualizado!' });
    } else {
      const { error } = await supabase.from('marketing_reports').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Relatório criado!' });
    }
    setIsOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('marketing_reports').delete().eq('id', id);
    toast({ title: 'Relatório removido' });
    fetchData();
  };

  const filtered = selectedCliente === 'all' ? reports : reports.filter(r => r.cliente_id === selectedCliente);
  const getClienteName = (id: string) => clientes.find(c => c.id === id)?.nome || '—';

  const NumField = ({ label, field, icon: Icon }: { label: string; field: keyof typeof form; icon?: React.ElementType }) => (
    <div>
      <Label className="text-xs flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </Label>
      <Input
        type="number"
        value={form[field] as number}
        onChange={e => setForm(prev => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }))}
        className="mt-1"
      />
    </div>
  );

  const formatMonth = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader
          title="Marketing Digital"
          subtitle="Configure os dados de marketing para cada cliente"
          action={
            <Button size="sm" onClick={() => handleOpen()}>
              <Plus className="h-4 w-4 mr-1" /> Novo Relatório
            </Button>
          }
        />

        <div className="mb-4">
          <Select value={selectedCliente} onValueChange={setSelectedCliente}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por cliente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum relatório de marketing. Clique em "Novo Relatório" para começar.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="hidden md:table-cell">Visitas</TableHead>
                    <TableHead className="hidden md:table-cell">Ads</TableHead>
                    <TableHead className="hidden lg:table-cell">Social</TableHead>
                    <TableHead className="hidden lg:table-cell">Leads</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => {
                    const ctr = r.impressoes_ads > 0 ? ((r.cliques_ads / r.impressoes_ads) * 100).toFixed(1) : '0';
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-sm">{getClienteName(r.cliente_id)}</TableCell>
                        <TableCell className="text-sm capitalize">{formatMonth(r.periodo_mes)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">{r.visitas_site.toLocaleString('pt-BR')}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.visitas_organicas} org · {r.visitas_pagas} pago
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">R$ {r.custo_ads.toLocaleString('pt-BR')}</div>
                          <div className="text-xs text-muted-foreground">
                            CTR {ctr}% · {r.conversoes_ads} conv
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">{r.seguidores_total.toLocaleString('pt-BR')}</div>
                          <div className="text-xs text-muted-foreground">
                            +{r.novos_seguidores} · {r.engajamento_rate}%
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">{r.leads_gerados}</div>
                          <div className="text-xs text-muted-foreground">{r.leads_qualificados} qualif.</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpen(r)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Form Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-card max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Relatório' : 'Novo Relatório de Marketing'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cliente *</Label>
                  <Select value={form.cliente_id} onValueChange={v => setForm(p => ({ ...p, cliente_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mês/Ano *</Label>
                  <Input
                    type="month"
                    value={form.periodo_mes.slice(0, 7)}
                    onChange={e => setForm(p => ({ ...p, periodo_mes: e.target.value + '-01' }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Tráfego & SEO */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Tráfego & SEO
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NumField label="Visitas Totais" field="visitas_site" icon={Globe} />
                  <NumField label="Orgânicas" field="visitas_organicas" />
                  <NumField label="Pagas" field="visitas_pagas" />
                  <NumField label="Keywords Top 10" field="palavras_chave_top10" />
                </div>
              </div>

              {/* Ads */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MousePointerClick className="h-3.5 w-3.5" /> Google & Meta Ads
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NumField label="Impressões" field="impressoes_ads" />
                  <NumField label="Cliques" field="cliques_ads" />
                  <NumField label="Custo (R$)" field="custo_ads" />
                  <NumField label="Conversões" field="conversoes_ads" />
                </div>
              </div>

              {/* Social */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Redes Sociais
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NumField label="Seguidores Total" field="seguidores_total" />
                  <NumField label="Novos Seguidores" field="novos_seguidores" />
                  <NumField label="Engajamento (%)" field="engajamento_rate" />
                  <NumField label="Posts Publicados" field="posts_publicados" />
                </div>
              </div>

              {/* Leads */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Geração de Leads
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Leads Gerados" field="leads_gerados" />
                  <NumField label="Leads Qualificados" field="leads_qualificados" />
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes || ''}
                  onChange={e => setForm(p => ({ ...p, observacoes: e.target.value || null }))}
                  rows={3}
                  className="mt-1"
                  placeholder="Resumo de performance, insights, próximos passos..."
                />
              </div>

              <Button type="submit" className="w-full">{editing ? 'Atualizar' : 'Salvar Relatório'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </AnimatedPage>
    </DashboardLayout>
  );
}
