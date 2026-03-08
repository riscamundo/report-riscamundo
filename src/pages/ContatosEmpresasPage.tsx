import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Building2, UserPlus, Search, Plus, Edit2, Trash2, Globe, Phone, Mail,
  Users, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';

interface Empresa {
  id: string; nome: string; cnpj: string | null; telefone: string | null;
  email: string | null; site: string | null; endereco: string | null;
  cidade: string | null; estado: string | null; segmento: string | null;
  observacoes: string | null; status: string; created_at: string;
}

interface Contato {
  id: string; nome: string; telefone: string | null; whatsapp: string | null;
  email: string | null; site: string | null; origem: string | null;
  motivo_inatividade: string | null; ultimo_contato: string | null;
  proximo_contato: string | null; status: string; observacoes: string | null;
  empresa_id: string | null; created_at: string;
}

export default function ContatosEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchE, setSearchE] = useState('');
  const [searchC, setSearchC] = useState('');
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [contatoOpen, setContatoOpen] = useState(false);
  const [editEmpresa, setEditEmpresa] = useState<Empresa | null>(null);
  const [editContato, setEditContato] = useState<Contato | null>(null);
  const [expandedEmpresa, setExpandedEmpresa] = useState<string | null>(null);

  const fetchAll = async () => {
    const [e, c] = await Promise.all([
      supabase.from('empresas_ativacao' as any).select('*').order('nome'),
      supabase.from('contatos_ativacao' as any).select('*').order('nome'),
    ]);
    setEmpresas((e.data || []) as unknown as Empresa[]);
    setContatos((c.data || []) as unknown as Contato[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveEmpresa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: any = {
      nome: fd.get('nome') as string,
      cnpj: fd.get('cnpj') as string || null,
      telefone: fd.get('telefone') as string || null,
      email: fd.get('email') as string || null,
      site: fd.get('site') as string || null,
      endereco: fd.get('endereco') as string || null,
      cidade: fd.get('cidade') as string || null,
      estado: fd.get('estado') as string || null,
      segmento: fd.get('segmento') as string || null,
      observacoes: fd.get('observacoes') as string || null,
      status: fd.get('status') as string || 'ativa',
    };
    if (editEmpresa) {
      const { error } = await supabase.from('empresas_ativacao' as any).update(data).eq('id', editEmpresa.id);
      if (error) { toast.error('Erro ao atualizar empresa'); return; }
      toast.success('Empresa atualizada!');
    } else {
      const { error } = await supabase.from('empresas_ativacao' as any).insert(data);
      if (error) { toast.error('Erro ao criar empresa'); return; }
      toast.success('Empresa criada!');
    }
    setEmpresaOpen(false); setEditEmpresa(null); fetchAll();
  };

  const handleSaveContato = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: any = {
      nome: fd.get('nome') as string,
      telefone: fd.get('telefone') as string || null,
      whatsapp: fd.get('whatsapp') as string || null,
      email: fd.get('email') as string || null,
      site: fd.get('site') as string || null,
      origem: fd.get('origem') as string || 'manual',
      motivo_inatividade: fd.get('motivo') as string || null,
      ultimo_contato: fd.get('ultimo_contato') as string || null,
      proximo_contato: fd.get('proximo_contato') as string || null,
      status: fd.get('status') as string || 'pendente',
      observacoes: fd.get('observacoes') as string || null,
      empresa_id: (fd.get('empresa_id') as string) || null,
    };
    if (data.empresa_id === 'none') data.empresa_id = null;
    if (editContato?.id) {
      const { error } = await supabase.from('contatos_ativacao' as any).update(data).eq('id', editContato.id);
      if (error) { toast.error('Erro ao atualizar contato'); return; }
      toast.success('Contato atualizado!');
    } else {
      const { error } = await supabase.from('contatos_ativacao' as any).insert(data);
      if (error) { toast.error('Erro ao criar contato'); return; }
      toast.success('Contato criado!');
    }
    setContatoOpen(false); setEditContato(null); fetchAll();
  };

  const handleDeleteEmpresa = async (id: string) => {
    if (!confirm('Excluir esta empresa? Os contatos vinculados serão desvinculados.')) return;
    await supabase.from('empresas_ativacao' as any).delete().eq('id', id);
    toast.success('Empresa excluída'); fetchAll();
  };

  const handleDeleteContato = async (id: string) => {
    if (!confirm('Excluir este contato?')) return;
    await supabase.from('contatos_ativacao' as any).delete().eq('id', id);
    toast.success('Contato excluído'); fetchAll();
  };

  const getEmpresaName = (id: string | null) => empresas.find(e => e.id === id)?.nome || '—';
  const getContatosDaEmpresa = (empId: string) => contatos.filter(c => c.empresa_id === empId);

  const filteredEmpresas = empresas.filter(e => !searchE.trim() || e.nome.toLowerCase().includes(searchE.toLowerCase()) || e.segmento?.toLowerCase().includes(searchE.toLowerCase()));
  const filteredContatos = contatos.filter(c => !searchC.trim() || c.nome.toLowerCase().includes(searchC.toLowerCase()) || c.telefone?.includes(searchC) || c.email?.toLowerCase().includes(searchC.toLowerCase()));

  const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  );

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse text-sm">Carregando...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader title="Contatos & Empresas" subtitle="Gestão de contatos e empresas para ativação" />

        <Tabs defaultValue="empresas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="empresas" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Empresas ({empresas.length})</TabsTrigger>
            <TabsTrigger value="contatos" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Contatos ({contatos.length})</TabsTrigger>
          </TabsList>

          {/* ═══ EMPRESAS TAB ═══ */}
          <TabsContent value="empresas" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar empresa..." value={searchE} onChange={e => setSearchE(e.target.value)} className="pl-9" />
              </div>
              <Dialog open={empresaOpen} onOpenChange={(o) => { setEmpresaOpen(o); if (!o) setEditEmpresa(null); }}>
                <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nova Empresa</Button></DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>{editEmpresa ? 'Editar' : 'Nova'} Empresa</DialogTitle></DialogHeader>
                  <form onSubmit={handleSaveEmpresa} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Nome *</Label><Input name="nome" defaultValue={editEmpresa?.nome} required className="mt-1" /></div>
                      <div><Label>CNPJ</Label><Input name="cnpj" defaultValue={editEmpresa?.cnpj || ''} className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Telefone</Label><Input name="telefone" defaultValue={editEmpresa?.telefone || ''} className="mt-1" /></div>
                      <div><Label>E-mail</Label><Input name="email" type="email" defaultValue={editEmpresa?.email || ''} className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Site</Label><Input name="site" defaultValue={editEmpresa?.site || ''} placeholder="https://..." className="mt-1" /></div>
                      <div><Label>Segmento</Label><Input name="segmento" defaultValue={editEmpresa?.segmento || ''} placeholder="Ex: Estética, Saúde..." className="mt-1" /></div>
                    </div>
                    <div><Label>Endereço</Label><Input name="endereco" defaultValue={editEmpresa?.endereco || ''} className="mt-1" /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>Cidade</Label><Input name="cidade" defaultValue={editEmpresa?.cidade || ''} className="mt-1" /></div>
                      <div><Label>Estado</Label><Input name="estado" defaultValue={editEmpresa?.estado || ''} className="mt-1" /></div>
                      <div><Label>Status</Label>
                        <Select name="status" defaultValue={editEmpresa?.status || 'ativa'}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativa">Ativa</SelectItem>
                            <SelectItem value="inativa">Inativa</SelectItem>
                            <SelectItem value="pendencia_financeira">Pendência Financeira</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Observações</Label><Textarea name="observacoes" defaultValue={editEmpresa?.observacoes || ''} className="mt-1" rows={2} /></div>
                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <StaggerContainer className="space-y-3">
              {filteredEmpresas.map(emp => {
                const empContatos = getContatosDaEmpresa(emp.id);
                const isExpanded = expandedEmpresa === emp.id;
                return (
                  <StaggerItem key={emp.id}>
                    <Card className="border-border/60">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setExpandedEmpresa(isExpanded ? null : emp.id)}>
                          <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{emp.nome}</p>
                              <Badge variant={emp.status === 'ativa' ? 'default' : 'secondary'} className="text-[10px]">{emp.status}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                              {emp.segmento && <span>{emp.segmento}</span>}
                              {emp.cidade && <span>{emp.cidade}{emp.estado ? `-${emp.estado}` : ''}</span>}
                              {emp.cnpj && <span>{emp.cnpj}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px] gap-1"><Users className="h-3 w-3" /> {empContatos.length}</Badge>
                            {emp.site && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); window.open(emp.site!, '_blank'); }} title="Abrir site">
                                <Globe className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setEditEmpresa(emp); setEmpresaOpen(true); }}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteEmpresa(emp.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t px-4 pb-4 pt-3 bg-muted/5">
                            <div className="flex items-center gap-3 mb-3">
                              <p className="text-xs font-semibold text-muted-foreground">Contatos vinculados ({empContatos.length})</p>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setEditContato({ empresa_id: emp.id } as any); setContatoOpen(true); }}>
                                <Plus className="h-3 w-3" /> Adicionar Contato
                              </Button>
                            </div>
                            {empContatos.length > 0 ? (
                              <div className="space-y-2">
                                {empContatos.map(c => (
                                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
                                    <div className="p-1.5 rounded-lg bg-primary/10"><UserPlus className="h-3.5 w-3.5 text-primary" /></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium">{c.nome}</p>
                                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                        {c.telefone && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{c.telefone}</span>}
                                        {c.email && <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" />{c.email}</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {c.whatsapp && (
                                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-accent border-accent/30 hover:bg-accent/10" onClick={() => window.open(`https://wa.me/${c.whatsapp!.replace(/\D/g, '')}`, '_blank')} title="WhatsApp">
                                          <WhatsAppIcon />
                                        </Button>
                                      )}
                                      <Badge variant="outline" className={`text-[10px] ${c.status === 'ativado' ? 'text-accent border-accent' : c.status === 'contatado' ? 'text-primary border-primary' : 'text-warning border-warning'}`}>{c.status}</Badge>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditContato(c); setContatoOpen(true); }}>
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteContato(c.id)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Nenhum contato vinculado a esta empresa.</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
              {filteredEmpresas.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {empresas.length === 0 ? 'Nenhuma empresa cadastrada.' : 'Nenhuma empresa encontrada.'}
                </div>
              )}
            </StaggerContainer>
          </TabsContent>

          {/* ═══ CONTATOS TAB ═══ */}
          <TabsContent value="contatos" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar contato..." value={searchC} onChange={e => setSearchC(e.target.value)} className="pl-9" />
              </div>
              <Dialog open={contatoOpen} onOpenChange={(o) => { setContatoOpen(o); if (!o) setEditContato(null); }}>
                <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Novo Contato</Button></DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>{editContato?.id ? 'Editar' : 'Novo'} Contato</DialogTitle></DialogHeader>
                  <form onSubmit={handleSaveContato} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Nome *</Label><Input name="nome" defaultValue={editContato?.nome || ''} required className="mt-1" /></div>
                      <div><Label>Empresa</Label>
                        <Select name="empresa_id" defaultValue={editContato?.empresa_id || 'none'}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Telefone</Label><Input name="telefone" defaultValue={editContato?.telefone || ''} placeholder="(00) 00000-0000" className="mt-1" /></div>
                      <div>
                        <Label>WhatsApp</Label>
                        <div className="flex gap-1.5 mt-1">
                          <Input name="whatsapp" defaultValue={editContato?.whatsapp || ''} placeholder="5500000000000" className="flex-1" />
                          {editContato?.whatsapp && (
                            <Button type="button" variant="outline" size="icon" className="shrink-0 h-9 w-9 text-accent border-accent/30 hover:bg-accent/10" onClick={() => window.open(`https://wa.me/${editContato.whatsapp!.replace(/\D/g, '')}`, '_blank')} title="WhatsApp">
                              <WhatsAppIcon />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>E-mail</Label><Input name="email" type="email" defaultValue={editContato?.email || ''} className="mt-1" /></div>
                      <div><Label>Site</Label><Input name="site" defaultValue={editContato?.site || ''} placeholder="https://..." className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Origem</Label>
                        <Select name="origem" defaultValue={editContato?.origem || 'manual'}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="indicacao">Indicação</SelectItem>
                            <SelectItem value="ex_cliente">Ex-cliente</SelectItem>
                            <SelectItem value="campanha">Campanha</SelectItem>
                            <SelectItem value="rede_social">Rede Social</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Status</Label>
                        <Select name="status" defaultValue={editContato?.status || 'pendente'}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="contatado">Contatado</SelectItem>
                            <SelectItem value="ativado">Ativado</SelectItem>
                            <SelectItem value="descartado">Descartado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Motivo Inatividade</Label><Input name="motivo" defaultValue={editContato?.motivo_inatividade || ''} className="mt-1" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Último Contato</Label><Input name="ultimo_contato" type="date" defaultValue={editContato?.ultimo_contato || ''} className="mt-1" /></div>
                      <div><Label>Próximo Contato</Label><Input name="proximo_contato" type="date" defaultValue={editContato?.proximo_contato || ''} className="mt-1" /></div>
                    </div>
                    <div><Label>Observações</Label><Textarea name="observacoes" defaultValue={editContato?.observacoes || ''} className="mt-1" rows={2} /></div>
                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Nome</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Empresa</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Telefone</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground">E-mail</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Próx. Contato</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContatos.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-3 font-medium">{c.nome}</td>
                      <td className="p-3 text-muted-foreground text-xs">{getEmpresaName(c.empresa_id)}</td>
                      <td className="p-3 text-muted-foreground">{c.telefone || '—'}</td>
                      <td className="p-3 text-muted-foreground text-xs">{c.email || '—'}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={`text-[10px] ${c.status === 'ativado' ? 'text-accent border-accent' : c.status === 'contatado' ? 'text-primary border-primary' : c.status === 'descartado' ? 'text-muted-foreground' : 'text-warning border-warning'}`}>{c.status}</Badge>
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">{c.proximo_contato ? new Date(c.proximo_contato + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {c.whatsapp && (
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-accent border-accent/30 hover:bg-accent/10" onClick={() => window.open(`https://wa.me/${c.whatsapp!.replace(/\D/g, '')}`, '_blank')} title="WhatsApp">
                              <WhatsAppIcon />
                            </Button>
                          )}
                          {c.site && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(c.site!, '_blank')} title="Site">
                              <Globe className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditContato(c); setContatoOpen(true); }}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteContato(c.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredContatos.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {contatos.length === 0 ? 'Nenhum contato cadastrado.' : 'Nenhum contato encontrado.'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </AnimatedPage>
    </DashboardLayout>
  );
}
