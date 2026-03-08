import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  Upload, Brain, Loader2, FileSpreadsheet, Users, Mail, MessageCircle,
  CheckCircle2, AlertCircle, Sparkles, Image, Mic, ScanEye, X, FileAudio
} from 'lucide-react';

interface Contact {
  nome: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  segmento?: string;
  qualificacao?: 'quente' | 'morno' | 'frio';
  canal_recomendado?: 'email' | 'whatsapp' | 'ambos';
  notas?: string;
}

interface ProcessResult {
  summary: string;
  total_valid: number;
  total_duplicates?: number;
  total_invalid?: number;
  contacts: Contact[];
  segments?: { nome: string; count: number; recomendacao?: string }[];
}

interface MediaFile {
  type: 'image' | 'audio_transcript';
  data: string;
  name: string;
  preview?: string;
}

export function SalesManagerTab() {
  const [csvContent, setCsvContent] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Media analysis state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaContext, setMediaContext] = useState('');
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaAnalysis, setMediaAnalysis] = useState('');
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvContent(text);
      toast.success(`Arquivo "${file.name}" carregado com sucesso`);
    };
    reader.readAsText(file);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} é muito grande (máx 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setMediaFiles(prev => [...prev, {
          type: 'image',
          data: base64,
          name: file.name,
          preview: base64,
        }]);
        toast.success(`${file.name} adicionado`);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo de áudio muito grande (máx 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setMediaFiles(prev => [...prev, {
        type: 'image',
        data: base64,
        name: file.name,
      }]);
      toast.success(`Áudio "${file.name}" adicionado`);
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMediaAnalysis = async () => {
    if (mediaFiles.length === 0) {
      toast.error('Adicione pelo menos uma imagem ou áudio para análise');
      return;
    }
    setMediaLoading(true);
    setMediaAnalysis('');
    try {
      const { data, error } = await supabase.functions.invoke('sales-manager', {
        body: {
          action: 'analyze-media',
          mediaFiles: mediaFiles.map(f => ({ type: f.type, data: f.data })),
          mediaContext,
        },
      });

      if (error) {
        console.error(error);
        toast.error('Erro ao analisar mídia');
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setMediaAnalysis(data.analysis || 'Sem análise disponível.');
      toast.success('Análise concluída por Rocha Senior!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao conectar com Rocha Senior');
    } finally {
      setMediaLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!csvContent.trim()) {
      toast.error('Cole ou faça upload de uma planilha primeiro');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sales-manager', {
        body: { action: 'organize', csvContent, instructions },
      });
      if (error) { console.error(error); toast.error('Erro ao processar planilha'); return; }
      if (data?.error) { toast.error(data.error); return; }
      setResult(data);
      toast.success(`${data.total_valid || 0} contatos organizados com sucesso!`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao conectar com o Sales Manager');
    } finally {
      setLoading(false);
    }
  };

  const qualColors: Record<string, string> = {
    quente: 'bg-destructive/15 text-destructive border-destructive/20',
    morno: 'bg-warning/15 text-warning border-warning/20',
    frio: 'bg-info/15 text-info border-info/20',
  };

  const canalIcons: Record<string, typeof Mail> = {
    email: Mail,
    whatsapp: MessageCircle,
    ambos: Users,
  };

  const exportCSV = (filter?: string) => {
    if (!result?.contacts) return;
    let contacts = result.contacts;
    if (filter === 'email') contacts = contacts.filter(c => c.canal_recomendado === 'email' || c.canal_recomendado === 'ambos');
    if (filter === 'whatsapp') contacts = contacts.filter(c => c.canal_recomendado === 'whatsapp' || c.canal_recomendado === 'ambos');
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Segmento', 'Qualificação', 'Canal', 'Notas'];
    const rows = contacts.map(c => [c.nome, c.email || '', c.telefone || '', c.empresa || '', c.segmento || '', c.qualificacao || '', c.canal_recomendado || '', c.notas || '']);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contatos_${filter || 'todos'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Planilha exportada!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold font-display">Rocha Senior — Sales Director AI</h3>
          <p className="text-xs text-muted-foreground">Diretor Executivo de Vendas • Estratégia militar aplicada • IA + Performance</p>
        </div>
      </div>

      {/* Upload Area - Contacts */}
      <Card className="border-dashed border-2 border-primary/20 bg-primary/[0.02]">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Upload de Planilha</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, Excel ou cole os dados diretamente</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" /> Escolher Arquivo
              </Button>
              {fileName && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {fileName}
                </Badge>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">ou cole aqui</span></div>
            </div>
            <Textarea
              placeholder="Cole aqui os dados da planilha (CSV, texto separado por vírgula ou tab)..."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="min-h-[120px] text-xs font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Instruções adicionais (opcional)</label>
        <Textarea
          placeholder="Ex: Foco em empresas de saúde, ignorar contatos sem email, priorizar São Paulo..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="min-h-[60px] text-sm"
        />
      </div>

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={loading || !csvContent.trim()}
        className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Processando com IA...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Organizar Contatos</>
        )}
      </Button>

      {/* ========== MEDIA ANALYSIS SECTION ========== */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Análise Estratégica de Mídia
          </span>
        </div>
      </div>

      <Card className="border-2 border-accent/30 bg-accent/[0.03]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <ScanEye className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Rocha Senior — Análise Visual & Auditiva</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Envie fotos, anotações manuscritas, prints ou áudios para análise estratégica de vendas
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload buttons */}
          <div className="flex flex-wrap gap-3">
            <input
              ref={mediaFileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
            <input
              ref={audioFileRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => mediaFileRef.current?.click()}
              className="gap-2 border-accent/30 hover:bg-accent/10"
            >
              <Image className="h-4 w-4" /> Fotos / Imagens
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => audioFileRef.current?.click()}
              className="gap-2 border-accent/30 hover:bg-accent/10"
            >
              <Mic className="h-4 w-4" /> Áudio
            </Button>
          </div>

          {/* Media previews */}
          {mediaFiles.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {mediaFiles.map((file, i) => (
                <div key={i} className="relative group">
                  {file.preview ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border/50 bg-muted">
                      <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeMediaFile(i)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted text-xs">
                      <FileAudio className="h-4 w-4 text-muted-foreground" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeMediaFile(i)}
                        className="p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Context */}
          <Textarea
            placeholder="Contexto adicional: O que é esse material? Qual a situação? Ex: 'Foto do quadro de metas da equipe', 'Áudio de reunião com cliente X'..."
            value={mediaContext}
            onChange={(e) => setMediaContext(e.target.value)}
            className="min-h-[60px] text-sm"
          />

          {/* Analyze button */}
          <Button
            onClick={handleMediaAnalysis}
            disabled={mediaLoading || mediaFiles.length === 0}
            className="w-full gap-2"
            variant="default"
          >
            {mediaLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Rocha Senior analisando...</>
            ) : (
              <><ScanEye className="h-4 w-4" /> Analisar com Rocha Senior</>
            )}
          </Button>

          {/* Analysis result */}
          {mediaAnalysis && (
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Análise de Rocha Senior</span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{mediaAnalysis}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* ========== CONTACTS RESULTS ========== */}
      {result && (
        <div className="space-y-4">
          <Card className="border-success/20 bg-success/[0.03]">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{result.summary}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {result.total_valid} válidos</span>
                    {result.total_duplicates ? <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {result.total_duplicates} duplicados</span> : null}
                    {result.total_invalid ? <span>{result.total_invalid} inválidos</span> : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.segments && result.segments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-sans">Segmentação Identificada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.segments.map((seg, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg border border-border/50 bg-card text-xs">
                      <span className="font-medium">{seg.nome}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">{seg.count}</Badge>
                      {seg.recomendacao && <p className="text-muted-foreground mt-1">{seg.recomendacao}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => exportCSV()} className="gap-1.5">
              <FileSpreadsheet className="h-4 w-4" /> Exportar Todos
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV('email')} className="gap-1.5">
              <Mail className="h-4 w-4" /> Lista Email
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV('whatsapp')} className="gap-1.5">
              <MessageCircle className="h-4 w-4" /> Lista WhatsApp
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans">Contatos Organizados ({result.contacts.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Qualif.</TableHead>
                      <TableHead>Canal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.contacts.slice(0, 50).map((c, i) => {
                      const CanalIcon = canalIcons[c.canal_recomendado || 'ambos'] || Users;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{c.nome}</TableCell>
                          <TableCell className="text-xs">{c.email || '-'}</TableCell>
                          <TableCell className="text-xs font-mono">{c.telefone || '-'}</TableCell>
                          <TableCell className="text-xs">{c.empresa || '-'}</TableCell>
                          <TableCell>
                            {c.qualificacao && (
                              <Badge variant="outline" className={`text-[10px] ${qualColors[c.qualificacao] || ''}`}>
                                {c.qualificacao === 'quente' ? '🔥' : c.qualificacao === 'morno' ? '⚡' : '❄️'} {c.qualificacao}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <CanalIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {result.contacts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum contato válido encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {result.contacts.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Mostrando 50 de {result.contacts.length} contatos. Exporte para ver todos.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}