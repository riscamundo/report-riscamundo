import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Search, Hash, Link2, MoveUp, MoveDown, Minus, Sparkles, Loader2 } from 'lucide-react';

interface Cliente { id: string; nome: string; }

interface SeoKeyword {
  id: string;
  cliente_id: string;
  palavra_chave: string;
  posicao_atual: number | null;
  posicao_anterior: number | null;
  volume_busca: number;
  url_rankeada: string | null;
  dificuldade: string;
  status: string;
}

interface SeoPage {
  id: string;
  cliente_id: string;
  url: string;
  titulo: string;
  visitas_mes: number;
  visitas_mes_anterior: number;
  posicao_media: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  taxa_rejeicao: number;
  tempo_medio_pagina: string | null;
  status: string;
  periodo_mes: string;
}

const emptyKeyword = {
  cliente_id: '',
  palavra_chave: '',
  posicao_atual: null as number | null,
  posicao_anterior: null as number | null,
  volume_busca: 0,
  url_rankeada: '',
  dificuldade: 'media',
  status: 'monitorando',
};

const emptyPage = {
  cliente_id: '',
  url: '',
  titulo: '',
  visitas_mes: 0,
  visitas_mes_anterior: 0,
  posicao_media: 0,
  impressoes: 0,
  cliques: 0,
  ctr: 0,
  taxa_rejeicao: 0,
  tempo_medio_pagina: '',
  status: 'ativo',
  periodo_mes: new Date().toISOString().slice(0, 7) + '-01',
};

export default function SeoConfigPage() {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>('all');
  const [kwOpen, setKwOpen] = useState(false);
  const [pgOpen, setPgOpen] = useState(false);
  const [editingKw, setEditingKw] = useState<SeoKeyword | null>(null);
  const [editingPg, setEditingPg] = useState<SeoPage | null>(null);
  const [kwForm, setKwForm] = useState(emptyKeyword);
  const [pgForm, setPgForm] = useState(emptyPage);
  const [estimating, setEstimating] = useState(false);

  const fetchData = async () => {
    const [cRes, kwRes, pgRes] = await Promise.all([
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('seo_keywords').select('*').order('posicao_atual', { ascending: true }),
      supabase.from('seo_pages').select('*').order('periodo_mes', { ascending: false }),
    ]);
    setClientes((cRes.data || []) as Cliente[]);
    setKeywords((kwRes.data || []) as SeoKeyword[]);
    setPages((pgRes.data || []) as SeoPage[]);
  };

  useEffect(() => { fetchData(); }, []);

  const getClienteName = (id: string) => clientes.find(c => c.id === id)?.nome || '—';

  const estimateKeyword = async () => {
    if (!kwForm.palavra_chave.trim()) { toast({ title: 'Digite a palavra-chave primeiro', variant: 'destructive' }); return; }
    setEstimating(true);
    try {
      const clienteNome = kwForm.cliente_id ? clientes.find(c => c.id === kwForm.cliente_id)?.nome : undefined;
      const { data, error } = await supabase.functions.invoke('keyword-estimate', {
        body: { palavra_chave: kwForm.palavra_chave, nicho: clienteNome },
      });
      if (error) throw error;
      if (data?.success && data.data) {
        setKwForm(p => ({
          ...p,
          posicao_atual: data.data.posicao_estimada,
          volume_busca: data.data.volume_busca,
          dificuldade: data.data.dificuldade,
        }));
        toast({ title: 'Estimativas preenchidas pela IA!' });
      } else {
        toast({ title: 'Erro', description: data?.error || 'Falha na estimativa', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || 'Falha ao estimar', variant: 'destructive' });
    }
    setEstimating(false);
  };

  // Keyword handlers
  const openKw = (kw?: SeoKeyword) => {
    if (kw) { setEditingKw(kw); setKwForm({ ...kw, url_rankeada: kw.url_rankeada || '' }); }
    else { setEditingKw(null); setKwForm({ ...emptyKeyword, cliente_id: selectedCliente !== 'all' ? selectedCliente : '' }); }
    setKwOpen(true);
  };

  const saveKw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kwForm.cliente_id) { toast({ title: 'Selecione um cliente', variant: 'destructive' }); return; }
    const payload = {
      cliente_id: kwForm.cliente_id,
      palavra_chave: kwForm.palavra_chave,
      posicao_atual: kwForm.posicao_atual,
      posicao_anterior: kwForm.posicao_anterior,
      volume_busca: kwForm.volume_busca,
      url_rankeada: kwForm.url_rankeada || null,
      dificuldade: kwForm.dificuldade,
      status: kwForm.status,
    };
    if (editingKw) {
      const { error } = await supabase.from('seo_keywords').update(payload).eq('id', editingKw.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Palavra-chave atualizada!' });
    } else {
      const { error } = await supabase.from('seo_keywords').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Palavra-chave adicionada!' });
    }
    setKwOpen(false);
    fetchData();
  };

  const deleteKw = async (id: string) => {
    await supabase.from('seo_keywords').delete().eq('id', id);
    toast({ title: 'Palavra-chave removida' });
    fetchData();
  };

  // Page handlers
  const openPg = (pg?: SeoPage) => {
    if (pg) { setEditingPg(pg); setPgForm({ ...pg, tempo_medio_pagina: pg.tempo_medio_pagina || '' }); }
    else { setEditingPg(null); setPgForm({ ...emptyPage, cliente_id: selectedCliente !== 'all' ? selectedCliente : '' }); }
    setPgOpen(true);
  };

  const savePg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgForm.cliente_id) { toast({ title: 'Selecione um cliente', variant: 'destructive' }); return; }
    const payload = {
      cliente_id: pgForm.cliente_id,
      url: pgForm.url,
      titulo: pgForm.titulo,
      visitas_mes: pgForm.visitas_mes,
      visitas_mes_anterior: pgForm.visitas_mes_anterior,
      posicao_media: pgForm.posicao_media,
      impressoes: pgForm.impressoes,
      cliques: pgForm.cliques,
      ctr: pgForm.ctr,
      taxa_rejeicao: pgForm.taxa_rejeicao,
      tempo_medio_pagina: pgForm.tempo_medio_pagina || null,
      status: pgForm.status,
      periodo_mes: pgForm.periodo_mes,
    };
    if (editingPg) {
      const { error } = await supabase.from('seo_pages').update(payload).eq('id', editingPg.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Página atualizada!' });
    } else {
      const { error } = await supabase.from('seo_pages').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Página adicionada!' });
    }
    setPgOpen(false);
    fetchData();
  };

  const deletePg = async (id: string) => {
    await supabase.from('seo_pages').delete().eq('id', id);
    toast({ title: 'Página removida' });
    fetchData();
  };

  const filteredKw = selectedCliente === 'all' ? keywords : keywords.filter(k => k.cliente_id === selectedCliente);
  const filteredPg = selectedCliente === 'all' ? pages : pages.filter(p => p.cliente_id === selectedCliente);

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader title="SEO & Palavras-Chave" subtitle="Gerencie palavras-chave e páginas para cada cliente" />

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

        <Tabs defaultValue="keywords" className="space-y-4">
          <TabsList>
            <TabsTrigger value="keywords" className="gap-1.5"><Hash className="h-3.5 w-3.5" /> Palavras-Chave</TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5"><Link2 className="h-3.5 w-3.5" /> Páginas</TabsTrigger>
          </TabsList>

          {/* ═══ KEYWORDS TAB ═══ */}
          <TabsContent value="keywords" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openKw()}><Plus className="h-4 w-4 mr-1" /> Nova Palavra-Chave</Button>
            </div>

            {filteredKw.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma palavra-chave cadastrada.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Palavra-Chave</TableHead>
                        <TableHead className="text-center">Posição</TableHead>
                        <TableHead className="text-center">Variação</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Volume</TableHead>
                        <TableHead className="hidden md:table-cell">Dificuldade</TableHead>
                        <TableHead className="hidden lg:table-cell">URL</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKw.map(kw => {
                        const diff = kw.posicao_anterior && kw.posicao_atual ? kw.posicao_anterior - kw.posicao_atual : 0;
                        const diffColor = diff > 0 ? 'text-accent' : diff < 0 ? 'text-destructive' : 'text-muted-foreground';
                        const DiffIcon = diff > 0 ? MoveUp : diff < 0 ? MoveDown : Minus;
                        return (
                          <TableRow key={kw.id}>
                            <TableCell className="text-sm">{getClienteName(kw.cliente_id)}</TableCell>
                            <TableCell className="font-medium text-sm">{kw.palavra_chave}</TableCell>
                            <TableCell className="text-center">
                              {kw.posicao_atual ? (
                                <Badge variant="outline" className={`text-xs ${kw.posicao_atual <= 3 ? 'text-accent border-accent' : kw.posicao_atual <= 10 ? 'text-primary border-primary' : ''}`}>
                                  #{kw.posicao_atual}
                                </Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${diffColor}`}>
                                <DiffIcon className="h-3 w-3" /> {Math.abs(diff)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right hidden md:table-cell text-sm">{kw.volume_busca.toLocaleString('pt-BR')}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className={`text-[10px] ${kw.dificuldade === 'facil' ? 'text-accent border-accent' : kw.dificuldade === 'dificil' ? 'text-destructive border-destructive' : 'text-warning border-warning'}`}>
                                {kw.dificuldade === 'facil' ? 'Fácil' : kw.dificuldade === 'dificil' ? 'Difícil' : 'Média'}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground truncate max-w-[150px]">
                              {kw.url_rankeada || '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openKw(kw)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteKw(kw.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
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
          </TabsContent>

          {/* ═══ PAGES TAB ═══ */}
          <TabsContent value="pages" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openPg()}><Plus className="h-4 w-4 mr-1" /> Nova Página</Button>
            </div>

            {filteredPg.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma página cadastrada.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Página</TableHead>
                        <TableHead className="text-right">Visitas</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Impressões</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Cliques</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">CTR</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Pos. Média</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPg.map(pg => (
                        <TableRow key={pg.id}>
                          <TableCell className="text-sm">{getClienteName(pg.cliente_id)}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium truncate max-w-[200px]">{pg.titulo}</div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">{pg.url}</div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold">{pg.visitas_mes.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right hidden md:table-cell text-sm">{pg.impressoes.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right hidden md:table-cell text-sm">{pg.cliques.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right hidden lg:table-cell text-sm">{Number(pg.ctr).toFixed(1)}%</TableCell>
                          <TableCell className="text-right hidden lg:table-cell text-sm">#{Number(pg.posicao_media).toFixed(1)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openPg(pg)}><Edit2 className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => deletePg(pg.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Keyword Dialog */}
        <Dialog open={kwOpen} onOpenChange={setKwOpen}>
          <DialogContent className="bg-card max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingKw ? 'Editar' : 'Nova'} Palavra-Chave</DialogTitle>
            </DialogHeader>
            <form onSubmit={saveKw} className="space-y-4">
              <div>
                <Label>Cliente *</Label>
                <Select value={kwForm.cliente_id} onValueChange={v => setKwForm(p => ({ ...p, cliente_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Palavra-Chave *</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={kwForm.palavra_chave} onChange={e => setKwForm(p => ({ ...p, palavra_chave: e.target.value }))} required placeholder="ex: harmonização facial SP" className="flex-1" />
                  {!editingKw && (
                    <Button type="button" variant="outline" size="sm" onClick={estimateKeyword} disabled={estimating || !kwForm.palavra_chave.trim()} className="gap-1.5 shrink-0">
                      {estimating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {estimating ? 'Estimando...' : 'Estimar com IA'}
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Posição Atual</Label>
                  <Input type="number" value={kwForm.posicao_atual ?? ''} onChange={e => setKwForm(p => ({ ...p, posicao_atual: e.target.value ? parseInt(e.target.value) : null }))} className="mt-1" />
                </div>
                <div>
                  <Label>Posição Anterior</Label>
                  <Input type="number" value={kwForm.posicao_anterior ?? ''} onChange={e => setKwForm(p => ({ ...p, posicao_anterior: e.target.value ? parseInt(e.target.value) : null }))} className="mt-1" />
                </div>
                <div>
                  <Label>Volume Busca</Label>
                  <Input type="number" value={kwForm.volume_busca} onChange={e => setKwForm(p => ({ ...p, volume_busca: parseInt(e.target.value) || 0 }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Dificuldade</Label>
                  <Select value={kwForm.dificuldade} onValueChange={v => setKwForm(p => ({ ...p, dificuldade: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={kwForm.status} onValueChange={v => setKwForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monitorando">Monitorando</SelectItem>
                      <SelectItem value="otimizando">Otimizando</SelectItem>
                      <SelectItem value="alcancado">Alcançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>URL Rankeada</Label>
                <Input value={kwForm.url_rankeada || ''} onChange={e => setKwForm(p => ({ ...p, url_rankeada: e.target.value }))} className="mt-1" placeholder="https://..." />
              </div>
              <Button type="submit" className="w-full">{editingKw ? 'Atualizar' : 'Adicionar'}</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Page Dialog */}
        <Dialog open={pgOpen} onOpenChange={setPgOpen}>
          <DialogContent className="bg-card max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPg ? 'Editar' : 'Nova'} Página</DialogTitle>
            </DialogHeader>
            <form onSubmit={savePg} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cliente *</Label>
                  <Select value={pgForm.cliente_id} onValueChange={v => setPgForm(p => ({ ...p, cliente_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Período *</Label>
                  <Input type="month" value={pgForm.periodo_mes.slice(0, 7)} onChange={e => setPgForm(p => ({ ...p, periodo_mes: e.target.value + '-01' }))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Título da Página *</Label>
                <Input value={pgForm.titulo} onChange={e => setPgForm(p => ({ ...p, titulo: e.target.value }))} required className="mt-1" placeholder="ex: Página Inicial" />
              </div>
              <div>
                <Label>URL *</Label>
                <Input value={pgForm.url} onChange={e => setPgForm(p => ({ ...p, url: e.target.value }))} required className="mt-1" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Visitas Mês</Label><Input type="number" value={pgForm.visitas_mes} onChange={e => setPgForm(p => ({ ...p, visitas_mes: parseInt(e.target.value) || 0 }))} className="mt-1" /></div>
                <div><Label>Visitas Mês Anterior</Label><Input type="number" value={pgForm.visitas_mes_anterior} onChange={e => setPgForm(p => ({ ...p, visitas_mes_anterior: parseInt(e.target.value) || 0 }))} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Impressões</Label><Input type="number" value={pgForm.impressoes} onChange={e => setPgForm(p => ({ ...p, impressoes: parseInt(e.target.value) || 0 }))} className="mt-1" /></div>
                <div><Label>Cliques</Label><Input type="number" value={pgForm.cliques} onChange={e => setPgForm(p => ({ ...p, cliques: parseInt(e.target.value) || 0 }))} className="mt-1" /></div>
                <div><Label>CTR (%)</Label><Input type="number" step="0.1" value={pgForm.ctr} onChange={e => setPgForm(p => ({ ...p, ctr: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Posição Média</Label><Input type="number" step="0.1" value={pgForm.posicao_media} onChange={e => setPgForm(p => ({ ...p, posicao_media: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
                <div><Label>Taxa Rejeição (%)</Label><Input type="number" step="0.1" value={pgForm.taxa_rejeicao} onChange={e => setPgForm(p => ({ ...p, taxa_rejeicao: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
                <div><Label>Tempo Médio</Label><Input value={pgForm.tempo_medio_pagina} onChange={e => setPgForm(p => ({ ...p, tempo_medio_pagina: e.target.value }))} className="mt-1" placeholder="1m 30s" /></div>
              </div>
              <Button type="submit" className="w-full">{editingPg ? 'Atualizar' : 'Adicionar'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </AnimatedPage>
    </DashboardLayout>
  );
}
