import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Loader2, Target, Hash, HelpCircle, Lightbulb, TrendingUp, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface KeywordResult {
  palavra: string;
  tipo: string;
  volume_estimado: string;
  dificuldade: string;
  intencao: string;
  sugestao_uso: string;
}

interface ResearchResult {
  termo_principal: string;
  analise_termo: string;
  palavras_chave: KeywordResult[];
  variacoes_long_tail: string[];
  perguntas_frequentes: string[];
  dicas_seo: string[];
}

interface Props {
  clienteNome?: string;
  clienteServicos?: string;
}

const volumeColors: Record<string, string> = {
  alto: 'bg-accent/10 text-accent border-accent/30',
  médio: 'bg-warning/10 text-warning border-warning/30',
  medio: 'bg-warning/10 text-warning border-warning/30',
  baixo: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

const diffColors: Record<string, string> = {
  fácil: 'bg-accent/10 text-accent border-accent/30',
  facil: 'bg-accent/10 text-accent border-accent/30',
  média: 'bg-warning/10 text-warning border-warning/30',
  media: 'bg-warning/10 text-warning border-warning/30',
  difícil: 'bg-destructive/10 text-destructive border-destructive/30',
  dificil: 'bg-destructive/10 text-destructive border-destructive/30',
};

const intentColors: Record<string, string> = {
  informacional: 'bg-primary/10 text-primary border-primary/30',
  transacional: 'bg-accent/10 text-accent border-accent/30',
  navegacional: 'bg-muted text-muted-foreground border-muted-foreground/30',
  comercial: 'bg-warning/10 text-warning border-warning/30',
};

export default function KeywordResearchAgent({ clienteNome, clienteServicos }: Props) {
  const [termo, setTermo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('keyword-research', {
        body: {
          termo: termo.trim(),
          nicho: clienteNome || '',
          servicos: clienteServicos || '',
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido');

      setResult(data.data);
      toast.success('Pesquisa concluída!');
    } catch (err: any) {
      console.error('Keyword research error:', err);
      toast.error('Erro ao pesquisar palavras-chave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Agente Pesquisador de Palavras-Chave
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pesquise um termo principal para descobrir variações e oportunidades de SEO. Deixe vazio para sugestões automáticas baseadas no seu nicho.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ex: harmonização facial, transplante capilar..."
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="gap-2 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Pesquisando...' : 'Pesquisar'}
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Analisando palavras-chave com IA...</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Analysis */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Termo Principal: {result.termo_principal}</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.analise_termo}</p>
                  </div>
                </div>
              </div>

              {/* Keywords Table */}
              {result.palavras_chave?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-primary" />
                      Palavras-Chave Encontradas ({result.palavras_chave.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Palavra-Chave</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Tipo</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Volume</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Dificuldade</th>
                            <th className="text-center p-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Intenção</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Sugestão de Uso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.palavras_chave.map((kw, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-medium text-sm">{kw.palavra}</td>
                              <td className="p-3 text-center">
                                <Badge variant="outline" className="text-[10px]">{kw.tipo}</Badge>
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant="outline" className={`text-[10px] ${volumeColors[kw.volume_estimado?.toLowerCase()] || ''}`}>
                                  {kw.volume_estimado}
                                </Badge>
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant="outline" className={`text-[10px] ${diffColors[kw.dificuldade?.toLowerCase()] || ''}`}>
                                  {kw.dificuldade}
                                </Badge>
                              </td>
                              <td className="p-3 text-center hidden md:table-cell">
                                <Badge variant="outline" className={`text-[10px] ${intentColors[kw.intencao?.toLowerCase()] || ''}`}>
                                  {kw.intencao}
                                </Badge>
                              </td>
                              <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell max-w-[250px] truncate">
                                {kw.sugestao_uso}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Long Tail & Questions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {result.variacoes_long_tail?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        Variações Long Tail
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {result.variacoes_long_tail.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                          <span className="text-foreground">{v}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {result.perguntas_frequentes?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2">
                        <HelpCircle className="h-3.5 w-3.5 text-primary" />
                        Perguntas Frequentes (People Also Ask)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {result.perguntas_frequentes.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <HelpCircle className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-foreground">{q}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* SEO Tips */}
              {result.dicas_seo?.length > 0 && (
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-accent" />
                      Dicas de SEO para este Termo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.dicas_seo.map((dica, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-accent font-bold text-xs mt-0.5">{i + 1}.</span>
                        <span className="text-foreground text-xs">{dica}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
