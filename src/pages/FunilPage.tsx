import { useState, useMemo } from 'react';
import { useStoreContext } from '@/contexts/StoreContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StatusFunil } from '@/types';
import { getLeadsPorEtapa } from '@/lib/metrics';
import { Plus, GripVertical, Clock, Search } from 'lucide-react';

const etapaLabels: Record<StatusFunil, string> = {
  novo: 'Novo Lead', qualificado: 'Qualificado', avaliacao: 'Avaliação', venda: 'Venda', perdido: 'Perdido'
};
const etapaColors: Record<StatusFunil, string> = {
  novo: 'border-info/30 bg-info/5', qualificado: 'border-primary/30 bg-primary/5', avaliacao: 'border-warning/30 bg-warning/5', venda: 'border-success/30 bg-success/5', perdido: 'border-destructive/30 bg-destructive/5'
};

export default function FunilPage() {
  const { leads, procedimentos, campanhas, addLead, updateLead } = useStoreContext();
  const [isOpen, setIsOpen] = useState(false);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const etapas: StatusFunil[] = ['novo', 'qualificado', 'avaliacao', 'venda', 'perdido'];
  const etapaData = getLeadsPorEtapa(leads);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l => l.nome.toLowerCase().includes(q) || l.telefone?.toLowerCase().includes(q));
  }, [leads, search]);

  const getDaysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  const handleDrop = async (etapa: StatusFunil) => {
    if (!draggedLead) return;
    const lead = leads.find(l => l.id === draggedLead);
    if (lead && lead.status_funil !== etapa) {
      await updateLead(lead.id, { status_funil: etapa });
    }
    setDraggedLead(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
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
    });
    setIsOpen(false);
  };

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader
          title="Funil de Vendas"
          subtitle={`${leads.length} leads no pipeline`}
          action={
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button></DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-display">Novo Lead</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
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
                    <div><Label>Interesse</Label>
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
                  <div><Label>Procedimento de Interesse</Label>
                    <Select name="procedimento" defaultValue={procedimentos[0]?.id}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{procedimentos.filter(p => p.status === 'ativo').map(p => <SelectItem key={p.id} value={p.id}>{p.nome_procedimento}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
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
          }
        />

        {/* Search bar */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {etapas.map(etapa => {
            const etapaLeads = filteredLeads.filter(l => l.status_funil === etapa);
            const data = etapaData.find(e => e.etapa === etapa);
            return (
              <div
                key={etapa}
                className="min-w-[240px] md:min-w-[260px] flex-1"
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(etapa)}
              >
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
                        <Card
                          key={lead.id}
                          draggable
                          onDragStart={() => setDraggedLead(lead.id)}
                          className={`cursor-grab active:cursor-grabbing bg-card border-border/50 transition-all hover:shadow-md hover:border-primary/20 ${draggedLead === lead.id ? 'opacity-50 scale-95' : ''} ${isUrgent ? 'ring-1 ring-destructive/30' : ''}`}
                        >
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
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        Arraste leads aqui
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}
