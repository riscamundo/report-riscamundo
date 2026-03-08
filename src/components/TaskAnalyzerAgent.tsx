import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Sparkles, AlertTriangle, Lightbulb, MessageSquare, Loader2,
  ChevronDown, ChevronUp, ShieldAlert, Info, Zap
} from 'lucide-react';

interface Correcao {
  titulo: string;
  descricao: string;
  severidade: 'alta' | 'media' | 'baixa';
}

interface Sugestao {
  titulo: string;
  descricao: string;
}

interface IdeiaConversa {
  topico: string;
  abordagem: string;
}

interface AnalysisResult {
  correcoes: Correcao[];
  sugestoes: Sugestao[];
  ideias_conversa: IdeiaConversa[];
  resumo_geral: string;
}

interface TarefaData {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  created_at: string;
}

interface Props {
  tarefas: TarefaData[];
  clienteNome: string;
}

const severidadeConfig = {
  alta: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: ShieldAlert },
  media: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', icon: AlertTriangle },
  baixa: { color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: Info },
};

export default function TaskAnalyzerAgent({ tarefas, clienteNome }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('task-analyzer', {
        body: { tarefas, clienteNome },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setAnalysis(data as AnalysisResult);
      setExpanded(true);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao analisar tarefas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Agente Gestor de Tarefas
            <Badge variant="outline" className="text-[10px] font-normal">IA</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {analysis && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            <Button size="sm" onClick={runAnalysis} disabled={loading} className="gap-1.5 text-xs">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {loading ? 'Analisando...' : analysis ? 'Reanalisar' : 'Analisar Tarefas'}
            </Button>
          </div>
        </div>
        {!analysis && !loading && (
          <p className="text-xs text-muted-foreground mt-1">
            Analisa o fluxo de tarefas, identifica gargalos e sugere melhorias baseadas em boas práticas de gestão.
          </p>
        )}
      </CardHeader>

      <AnimatePresence>
        {analysis && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-0 space-y-4">
              {/* Resumo */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-foreground leading-relaxed">{analysis.resumo_geral}</p>
              </div>

              {/* Correções */}
              {analysis.correcoes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Correções ({analysis.correcoes.length})
                  </h4>
                  {analysis.correcoes.map((c, i) => {
                    const sev = severidadeConfig[c.severidade] || severidadeConfig.media;
                    const SevIcon = sev.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-3 rounded-lg border ${sev.bg}`}
                      >
                        <div className="flex items-start gap-2">
                          <SevIcon className={`h-4 w-4 ${sev.color} mt-0.5 shrink-0`} />
                          <div>
                            <p className="text-sm font-medium">{c.titulo}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.descricao}</p>
                          </div>
                          <Badge variant="outline" className={`ml-auto text-[10px] shrink-0 ${sev.color}`}>
                            {c.severidade}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Sugestões */}
              {analysis.sugestoes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" /> Sugestões ({analysis.sugestoes.length})
                  </h4>
                  {analysis.sugestoes.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-lg border bg-primary/5 border-primary/20"
                    >
                      <p className="text-sm font-medium">{s.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.descricao}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Ideias para Conversa */}
              {analysis.ideias_conversa.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Ideias para Conversa com Cliente ({analysis.ideias_conversa.length})
                  </h4>
                  {analysis.ideias_conversa.map((ic, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-lg border bg-accent/5 border-accent/20"
                    >
                      <p className="text-sm font-medium">{ic.topico}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ic.abordagem}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
