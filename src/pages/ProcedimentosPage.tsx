import { useState } from 'react';
import { useStoreContext } from '@/contexts/StoreContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Procedimento, Categoria, Prioridade } from '@/types';
import { Plus, Edit2, ArrowUpDown } from 'lucide-react';

const categoriaLabels: Record<Categoria, string> = { facial: 'Facial', corporal: 'Corporal', capilar: 'Capilar', combo_premium: 'Combo Premium' };

export default function ProcedimentosPage() {
  const { procedimentos, vendas, addProcedimento, updateProcedimento } = useStoreContext();
  const [editItem, setEditItem] = useState<Procedimento | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'faturamento' | 'nome'>('faturamento');

  const getFaturamento = (id: string) => vendas.filter(v => v.procedimento_vendido === id && v.status === 'fechado').reduce((s, v) => s + v.valor_venda, 0);
  const getVendasCount = (id: string) => vendas.filter(v => v.procedimento_vendido === id && v.status === 'fechado').length;

  const sorted = [...procedimentos].sort((a, b) =>
    sortBy === 'faturamento' ? getFaturamento(b.id) - getFaturamento(a.id) : a.nome_procedimento.localeCompare(b.nome_procedimento)
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const proc: Procedimento = {
      id: editItem?.id || `p${Date.now()}`,
      nome_procedimento: fd.get('nome') as string,
      categoria: fd.get('categoria') as Categoria,
      ticket_medio: Number(fd.get('ticket')),
      margem_estimada: Number(fd.get('margem')),
      status: (fd.get('status') as 'ativo' | 'inativo') || 'ativo',
      prioridade_vendas: fd.get('prioridade') as Prioridade,
    };
    editItem ? updateProcedimento(proc) : addProcedimento(proc);
    setIsOpen(false);
    setEditItem(null);
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

  return (
    <DashboardLayout>
      <PageHeader
        title="Procedimentos"
        subtitle="Gestão de procedimentos e combos"
        action={
          <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader><DialogTitle className="font-display">{editItem ? 'Editar' : 'Novo'} Procedimento</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div><Label htmlFor="nome">Nome</Label><Input id="nome" name="nome" defaultValue={editItem?.nome_procedimento} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Categoria</Label>
                    <Select name="categoria" defaultValue={editItem?.categoria || 'facial'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(categoriaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Prioridade</Label>
                    <Select name="prioridade" defaultValue={editItem?.prioridade_vendas || 'media'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="alta">Alta</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="baixa">Baixa</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label htmlFor="ticket">Ticket Médio (R$)</Label><Input id="ticket" name="ticket" type="number" defaultValue={editItem?.ticket_medio} required /></div>
                  <div><Label htmlFor="margem">Margem (%)</Label><Input id="margem" name="margem" type="number" defaultValue={editItem?.margem_estimada} required /></div>
                </div>
                {editItem && (
                  <div><Label>Status</Label>
                    <Select name="status" defaultValue={editItem.status}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Ticket Médio</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead className="cursor-pointer" onClick={() => setSortBy(sortBy === 'faturamento' ? 'nome' : 'faturamento')}>
                  <span className="flex items-center gap-1">Faturamento <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome_procedimento}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{categoriaLabels[p.categoria]}</Badge></TableCell>
                  <TableCell>{fmt(p.ticket_medio)}</TableCell>
                  <TableCell>{getVendasCount(p.id)}</TableCell>
                  <TableCell className="font-medium">{fmt(getFaturamento(p.id))}</TableCell>
                  <TableCell>
                    <Badge className={p.status === 'ativo' ? 'bg-success/20 text-success border-0' : 'bg-muted text-muted-foreground border-0'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => { setEditItem(p); setIsOpen(true); }}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
