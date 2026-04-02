import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Suggestion {
  title: string;
  priority: 'alta' | 'media' | 'baixa';
}

interface TenantAiChecklistProps {
  metricsContext: string;
  clienteId: string;
  clienteNome: string;
}

const priorityConfig = {
  alta: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  media: { label: 'Média', className: 'bg-warning/10 text-warning border-warning/20' },
  baixa: { label: 'Baixa', className: 'bg-muted text-muted-foreground border-border' },
};

export function TenantAiChecklist({ metricsContext, clienteId, clienteNome }: TenantAiChecklistProps) {
  const [summary, setSummary] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [creatingTask, setCreatingTask] = useState<number | null>(null);
  const [createdTasks, setCreatedTasks] = useState<Set<number>>(new Set());

  const fetchSummary = useCallback(async () => {
    if (!metricsContext) return;
    setLoading(true);
    setSuggestions([]);
    setCreatedTasks(new Set());
    try {
      const { data, error } = await supabase.functions.invoke('dashboard-summary', {
        body: { metricsContext },
      });

      if (error) {
        console.error('Summary error:', error);
        toast.error('Não foi possível gerar o resumo do Agente Riscamundo');
        return;
      }

      if (data?.summary) setSummary(data.summary);
      if (data?.suggestions) setSuggestions(data.suggestions);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao conectar com o Agente Riscamundo');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [metricsContext]);

  useEffect(() => {
    if (metricsContext && !hasLoaded) {
      fetchSummary();
    }
  }, [metricsContext, fetchSummary, hasLoaded]);

  // Reset when client changes
  useEffect(() => {
    setHasLoaded(false);
    setSummary('');
    setSuggestions([]);
    setCreatedTasks(new Set());
  }, [clienteId]);

  const handleCreateTask = async (index: number, suggestion: Suggestion) => {
    if (createdTasks.has(index)) return;
    setCreatingTask(index);
    try {
      const { error } = await supabase.from('tarefas_cliente').insert({
        cliente_id: clienteId,
        titulo: suggestion.title,
        descricao: `Sugestão gerada pelo Agente Riscamundo para ${clienteNome}`,
        prioridade: suggestion.priority,
        status: 'esperando',
      });

      if (error) {
        console.error('Task creation error:', error);
        toast.error('Erro ao criar tarefa');
        return;
      }

      setCreatedTasks(prev => new Set(prev).add(index));
      toast.success(`Tarefa "${suggestion.title}" criada para ${clienteNome}`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar tarefa');
    } finally {
      setCreatingTask(null);
    }
  };

  return (
    <Card className="mb-6 border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent executive-card overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20 shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Maestro BI — Resumo de {clienteNome}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto shrink-0"
                onClick={fetchSummary}
                disabled={loading}
                title="Atualizar resumo"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </div>

            {loading && !summary ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analisando dados de {clienteNome}...</span>
              </div>
            ) : summary ? (
              <>
                {/* Summary paragraph */}
                <p className="text-sm leading-relaxed text-foreground/90 mb-4">{summary}</p>

                {/* Suggestions checklist */}
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Sugestões — marque para criar tarefa
                    </p>
                    {suggestions.map((s, i) => {
                      const isCreated = createdTasks.has(i);
                      const isCreating = creatingTask === i;
                      const pConfig = priorityConfig[s.priority] || priorityConfig.media;

                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                            isCreated
                              ? 'bg-accent/5 border-accent/20 opacity-70'
                              : 'bg-card border-border/50 hover:border-primary/30 hover:bg-primary/[0.02]'
                          }`}
                        >
                          {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                          ) : isCreated ? (
                            <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                          ) : (
                            <Checkbox
                              className="shrink-0"
                              checked={false}
                              onCheckedChange={() => handleCreateTask(i, s)}
                            />
                          )}
                          <span className={`text-sm flex-1 ${isCreated ? 'line-through text-muted-foreground' : ''}`}>
                            {s.title}
                          </span>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${pConfig.className}`}>
                            {pConfig.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Clique em atualizar para gerar o resumo inteligente do cliente.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
