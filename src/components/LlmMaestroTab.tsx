import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Save, Search, Trash2, MessageSquare, Settings, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

interface Conversation {
  id: string;
  pergunta: string;
  resposta: string;
  contexto: string | null;
  created_at: string;
}

interface MaestroConfig {
  id: string;
  system_prompt: string;
  updated_at: string;
}

export function LlmMaestroTab() {
  const [config, setConfig] = useState<MaestroConfig | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    const [configRes, convosRes] = await Promise.all([
      supabase.from('maestro_config' as any).select('*').limit(1).single(),
      supabase.from('maestro_conversations' as any).select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (configRes.data) {
      const c = configRes.data as unknown as MaestroConfig;
      setConfig(c);
      setEditPrompt(c.system_prompt);
    }
    if (convosRes.data) {
      setConversations(convosRes.data as unknown as Conversation[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSavePrompt = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase
      .from('maestro_config' as any)
      .update({ system_prompt: editPrompt, updated_at: new Date().toISOString() } as any)
      .eq('id', config.id);
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar prompt');
      return;
    }
    toast.success('System prompt atualizado!');
    setConfig({ ...config, system_prompt: editPrompt, updated_at: new Date().toISOString() });
  };

  const handleDeleteConvo = async (id: string) => {
    if (!confirm('Excluir esta conversa do arquivo?')) return;
    await supabase.from('maestro_conversations' as any).delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    toast.success('Conversa removida');
  };

  const filteredConvos = conversations.filter(c => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return c.pergunta.toLowerCase().includes(q) || c.resposta.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse text-sm">Carregando LLM Maestro...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">LLM Maestro</h3>
          <p className="text-[11px] text-muted-foreground">Base de conhecimento e configuração do agente IA</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px] gap-1">
          <MessageSquare className="h-3 w-3" />
          {conversations.length} conversas arquivadas
        </Badge>
      </div>

      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Arquivo de Conversas</TabsTrigger>
          <TabsTrigger value="prompt" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> System Prompt</TabsTrigger>
        </TabsList>

        {/* ═══ CONVERSATIONS ═══ */}
        <TabsContent value="conversations" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar nas conversas..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="pl-9" />
            </div>
            <p className="text-xs text-muted-foreground">{filteredConvos.length} resultado(s)</p>
          </div>

          {filteredConvos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {conversations.length === 0
                    ? 'Nenhuma conversa arquivada ainda. As conversas com o Maestro BI serão salvas aqui automaticamente.'
                    : 'Nenhum resultado encontrado.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredConvos.map(convo => {
                const isExpanded = expandedId === convo.id;
                return (
                  <Card key={convo.id} className="border-border/60 overflow-hidden">
                    <div
                      className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : convo.id)}
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5 shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{convo.pergunta}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(convo.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                          {convo.contexto && (
                            <Badge variant="outline" className="text-[9px]">{convo.contexto}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleDeleteConvo(convo.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-4 pb-4 pt-3 bg-muted/5 space-y-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Pergunta</p>
                          <p className="text-sm text-foreground bg-primary/5 rounded-lg p-3">{convo.pergunta}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Resposta do Maestro</p>
                          <div className="text-sm bg-card border rounded-lg p-3 prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown>{convo.resposta}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ SYSTEM PROMPT ═══ */}
        <TabsContent value="prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-sans flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  System Prompt Atual
                </CardTitle>
                {config && (
                  <span className="text-[10px] text-muted-foreground">
                    Atualizado {formatDistanceToNow(new Date(config.updated_at), { addSuffix: true, locale: ptBR })}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                className="min-h-[400px] font-mono text-xs leading-relaxed"
                placeholder="Digite o system prompt do Maestro BI..."
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">
                  {editPrompt.length} caracteres · Alterações refletem imediatamente nas próximas conversas
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { if (config) setEditPrompt(config.system_prompt); }}
                    disabled={editPrompt === config?.system_prompt}
                  >
                    Desfazer
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={handleSavePrompt}
                    disabled={saving || editPrompt === config?.system_prompt}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? 'Salvando...' : 'Salvar Prompt'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
