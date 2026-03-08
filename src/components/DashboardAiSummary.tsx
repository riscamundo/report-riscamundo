import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface DashboardAiSummaryProps {
  metricsContext: string;
}

export function DashboardAiSummary({ metricsContext }: DashboardAiSummaryProps) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchSummary = async () => {
    if (!metricsContext) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dashboard-summary', {
        body: { metricsContext },
      });

      if (error) {
        console.error('Summary error:', error);
        toast.error('Não foi possível gerar o resumo do Maestro BI');
        return;
      }

      if (data?.summary) {
        setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao conectar com o Maestro BI');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    if (metricsContext && !hasLoaded) {
      fetchSummary();
    }
  }, [metricsContext]);

  return (
    <Card className="mb-8 border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent executive-card overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20 shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Maestro BI — Resumo do Mês</span>
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
                <span className="text-sm text-muted-foreground">Analisando seus dados...</span>
              </div>
            ) : summary ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/90">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Clique em atualizar para gerar o resumo inteligente do mês.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
