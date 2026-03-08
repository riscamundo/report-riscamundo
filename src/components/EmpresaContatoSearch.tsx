import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Plus, X } from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  segmento?: string | null;
}
interface Contato {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  empresa_id?: string | null;
}

interface EmpresaContatoSearchProps {
  onEmpresaSelected: (empresa: Empresa | null) => void;
  onContatoSelected: (contato: Contato | null) => void;
  selectedEmpresa: Empresa | null;
  selectedContato: Contato | null;
}

export function EmpresaContatoSearch({
  onEmpresaSelected,
  onContatoSelected,
  selectedEmpresa,
  selectedContato,
}: EmpresaContatoSearchProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [empresaQuery, setEmpresaQuery] = useState('');
  const [contatoQuery, setContatoQuery] = useState('');
  const [showEmpresaResults, setShowEmpresaResults] = useState(false);
  const [showContatoResults, setShowContatoResults] = useState(false);
  const [creatingEmpresa, setCreatingEmpresa] = useState(false);
  const [newEmpresaNome, setNewEmpresaNome] = useState('');
  const [newEmpresaSegmento, setNewEmpresaSegmento] = useState('');
  const empresaRef = useRef<HTMLDivElement>(null);
  const contatoRef = useRef<HTMLDivElement>(null);

  // Fetch empresas
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('empresas_ativacao')
        .select('id, nome, segmento')
        .order('nome');
      setEmpresas(data || []);
    };
    fetch();
  }, []);

  // Fetch contatos
  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('contatos_ativacao')
        .select('id, nome, telefone, email, empresa_id')
        .order('nome');
      const { data } = await query;
      setContatos(data || []);
    };
    fetch();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (empresaRef.current && !empresaRef.current.contains(e.target as Node)) setShowEmpresaResults(false);
      if (contatoRef.current && !contatoRef.current.contains(e.target as Node)) setShowContatoResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredEmpresas = empresaQuery.trim()
    ? empresas.filter(e => e.nome.toLowerCase().includes(empresaQuery.toLowerCase()))
    : empresas;

  const filteredContatos = contatoQuery.trim()
    ? contatos.filter(c => c.nome.toLowerCase().includes(contatoQuery.toLowerCase()) || c.telefone?.includes(contatoQuery) || c.email?.toLowerCase().includes(contatoQuery.toLowerCase()))
    : contatos;

  const handleSelectEmpresa = (empresa: Empresa) => {
    onEmpresaSelected(empresa);
    setEmpresaQuery('');
    setShowEmpresaResults(false);
  };

  const handleSelectContato = (contato: Contato) => {
    onContatoSelected(contato);
    setContatoQuery('');
    setShowContatoResults(false);
    // Auto-select empresa if contato has one
    if (contato.empresa_id && !selectedEmpresa) {
      const emp = empresas.find(e => e.id === contato.empresa_id);
      if (emp) onEmpresaSelected(emp);
    }
  };

  const handleCreateEmpresa = async () => {
    if (!newEmpresaNome.trim()) return;
    const { data, error } = await supabase
      .from('empresas_ativacao')
      .insert({ nome: newEmpresaNome.trim(), segmento: newEmpresaSegmento.trim() || null })
      .select('id, nome, segmento')
      .single();
    if (data && !error) {
      setEmpresas(prev => [...prev, data]);
      onEmpresaSelected(data);
      setCreatingEmpresa(false);
      setNewEmpresaNome('');
      setNewEmpresaSegmento('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Empresa field */}
      <div ref={empresaRef} className="relative">
        <Label className="flex items-center gap-1.5 mb-1">
          <Building2 className="h-3.5 w-3.5" /> Empresa
        </Label>
        {selectedEmpresa ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{selectedEmpresa.nome}</span>
            {selectedEmpresa.segmento && <Badge variant="outline" className="text-[10px]">{selectedEmpresa.segmento}</Badge>}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEmpresaSelected(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <Input
              placeholder="Buscar empresa..."
              value={empresaQuery}
              onChange={e => { setEmpresaQuery(e.target.value); setShowEmpresaResults(true); }}
              onFocus={() => setShowEmpresaResults(true)}
            />
            {showEmpresaResults && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                {filteredEmpresas.slice(0, 8).map(e => (
                  <button key={e.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-accent/10 flex items-center gap-2"
                    onClick={() => handleSelectEmpresa(e)}>
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{e.nome}</span>
                    {e.segmento && <span className="text-xs text-muted-foreground ml-auto">{e.segmento}</span>}
                  </button>
                ))}
                {filteredEmpresas.length === 0 && empresaQuery.trim() && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Nenhuma empresa encontrada</div>
                )}
                <button type="button" className="w-full px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/5 flex items-center gap-2 border-t"
                  onClick={() => { setCreatingEmpresa(true); setShowEmpresaResults(false); setNewEmpresaNome(empresaQuery); }}>
                  <Plus className="h-3.5 w-3.5" /> Nova Empresa{empresaQuery.trim() ? `: "${empresaQuery}"` : ''}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Inline new empresa form */}
      {creatingEmpresa && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-primary flex items-center gap-1"><Plus className="h-3 w-3" /> Nova Empresa</p>
          <Input placeholder="Nome da empresa *" value={newEmpresaNome} onChange={e => setNewEmpresaNome(e.target.value)} />
          <Input placeholder="Segmento (opcional)" value={newEmpresaSegmento} onChange={e => setNewEmpresaSegmento(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleCreateEmpresa} disabled={!newEmpresaNome.trim()}>Criar Empresa</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreatingEmpresa(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Contato field */}
      <div ref={contatoRef} className="relative">
        <Label className="flex items-center gap-1.5 mb-1">
          <User className="h-3.5 w-3.5" /> Contato
        </Label>
        {selectedContato ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{selectedContato.nome}</span>
            {selectedContato.telefone && <span className="text-xs text-muted-foreground">{selectedContato.telefone}</span>}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onContatoSelected(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <Input
              placeholder="Buscar contato..."
              value={contatoQuery}
              onChange={e => { setContatoQuery(e.target.value); setShowContatoResults(true); }}
              onFocus={() => setShowContatoResults(true)}
            />
            {showContatoResults && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                {filteredContatos.slice(0, 8).map(c => {
                  const emp = empresas.find(e => e.id === c.empresa_id);
                  return (
                    <button key={c.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-accent/10 flex items-center gap-2"
                      onClick={() => handleSelectContato(c)}>
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span>{c.nome}</span>
                        {emp && <span className="text-xs text-muted-foreground ml-1">· {emp.nome}</span>}
                      </div>
                      {c.telefone && <span className="text-xs text-muted-foreground">{c.telefone}</span>}
                    </button>
                  );
                })}
                {filteredContatos.length === 0 && contatoQuery.trim() && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum contato encontrado</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
