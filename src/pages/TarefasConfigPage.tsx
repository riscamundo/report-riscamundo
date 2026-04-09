import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit2, Trash2, ListTodo } from 'lucide-react';

interface Cliente { id: string; nome: string; }
interface Tarefa {
  id: string; cliente_id: string; titulo: string; descricao: string | null;
  status: string; prioridade: string; created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  fazendo: { label: 'Fazendo', color: 'bg-primary/10 text-primary border-primary/30' },
  esperando: { label: 'Esperando', color: 'bg-warning/10 text-warning border-warning/30' },
  pronta: { label: 'Pronta', color: 'bg-accent/10 text-accent border-accent/30' },
  verificar: { label: 'Verificar', color: 'bg-chart-3/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/30' },
};

const emptyForm = { cliente_id: '', titulo: '', descricao: '', status: 'esperando', prioridade: 'media' };

export default function TarefasConfigPage() {
  const { toast } = useToast();
  const { isMaster, isCliente, user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [selectedCliente, setSelectedCliente] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [myClienteId, setMyClienteId] = useState<string | null>(null);

  // For client users, resolve their cliente_id
  useEffect(() => {
    if (!isCliente || !user) return;
    const load = async () => {
      const { data } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (data) setMyClienteId(data.id);
    };
    load();
  }, [isCliente, user]);

  const fetchData = async () => {
    const [cRes, tRes] = await Promise.all([
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('tarefas_cliente').select('*').order('created_at', { ascending: false }),
    ]);
    setClientes((cRes.data || []) as Cliente[]);
    setTarefas((tRes.data || []) as Tarefa[]);
  };

  useEffect(() => { fetchData(); }, []);

  const getClienteName = (id: string) => clientes.find(c => c.id === id)?.nome || '—';

  const openForm = (t?: Tarefa) => {
    if (t) {
      setEditing(t);
      setForm({ cliente_id: t.cliente_id, titulo: t.titulo, descricao: t.descricao || '', status: t.status, prioridade: t.prioridade });
    } else {
      setEditing(null);
      const defaultCliente = isCliente && myClienteId ? myClienteId : (selectedCliente !== 'all' ? selectedCliente : '');
      setForm({ ...emptyForm, cliente_id: defaultCliente });
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const clienteId = isCliente && myClienteId ? myClienteId : form.cliente_id;
    if (!clienteId) { toast({ title: 'Selecione um cliente', variant: 'destructive' }); return; }
    const payload = { cliente_id: clienteId, titulo: form.titulo, descricao: form.descricao || null, status: form.status, prioridade: form.prioridade };
    if (editing) {
      const { error } = await supabase.from('tarefas_cliente').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Tarefa atualizada!' });
    } else {
      const { error } = await supabase.from('tarefas_cliente').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Tarefa criada!' });
      // Notify master admin via notificacoes (uses service-side trigger)
    }
    setIsOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('tarefas_cliente').delete().eq('id', id);
    toast({ title: 'Tarefa removida' });
    fetchData();
  };

  const quickStatus = async (id: string, status: string) => {
    await supabase.from('tarefas_cliente').update({ status }).eq('id', id);
    fetchData();
  };

  const filtered = selectedCliente === 'all' ? tarefas : tarefas.filter(t => t.cliente_id === selectedCliente);

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader
          title="Tarefas dos Clientes"
          subtitle={isCliente ? "Crie e acompanhe suas tarefas" : "Gerencie tarefas e acompanhamento de cada cliente"}
          action={<Button size="sm" onClick={() => openForm()}><Plus className="h-4 w-4 mr-1" /> {isCliente ? 'Criar Tarefa' : 'Nova Tarefa'}</Button>}
        />

        {/* Filter by client - only for master/staff */}
        {!isCliente && (
          <div className="mb-4">
            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Filtrar por cliente..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ListTodo className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!isCliente && <TableHead>Cliente</TableHead>}
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Prioridade</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    {isMaster && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(t => {
                    const sc = statusConfig[t.status] || statusConfig.esperando;
                    return (
                      <TableRow key={t.id}>
                        {!isCliente && <TableCell className="text-sm">{getClienteName(t.cliente_id)}</TableCell>}
                        <TableCell>
                          <div className="text-sm font-medium">{t.titulo}</div>
                          {t.descricao && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{t.descricao}</div>}
                        </TableCell>
                        <TableCell>
                          {isMaster ? (
                            <Select value={t.status} onValueChange={v => quickStatus(t.id, v)}>
                              <SelectTrigger className="h-7 w-[120px] text-xs">
                                <Badge variant="outline" className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fazendo">Fazendo</SelectItem>
                                <SelectItem value="esperando">Esperando</SelectItem>
                                <SelectItem value="pronta">Pronta</SelectItem>
                                <SelectItem value="verificar">Verificar</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={`text-[10px] ${t.prioridade === 'alta' ? 'text-destructive border-destructive' : t.prioridade === 'baixa' ? 'text-muted-foreground' : 'text-warning border-warning'}`}>
                            {t.prioridade === 'alta' ? 'Alta' : t.prioridade === 'baixa' ? 'Baixa' : 'Média'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        {isMaster && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openForm(t)}><Edit2 className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-card max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Criar'} Tarefa</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Client selector - only for master/staff */}
              {!isCliente && (
                <div>
                  <Label>Cliente *</Label>
                  <Select value={form.cliente_id} onValueChange={v => setForm(p => ({ ...p, cliente_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required className="mt-1" placeholder="ex: Revisar landing page" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={3} className="mt-1" placeholder="Detalhes da tarefa..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={v => setForm(p => ({ ...p, prioridade: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isCliente && (
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fazendo">Fazendo</SelectItem>
                        <SelectItem value="esperando">Esperando</SelectItem>
                        <SelectItem value="pronta">Pronta</SelectItem>
                        <SelectItem value="verificar">Verificar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full">{editing ? 'Atualizar' : 'Criar Tarefa'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </AnimatedPage>
    </DashboardLayout>
  );
}
