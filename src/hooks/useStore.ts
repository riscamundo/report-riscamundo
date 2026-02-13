import { useState, useEffect, useCallback } from 'react';
import { Procedimento, Campanha, Lead, Venda, Perfil } from '@/types';
import { seedProcedimentos, seedCampanhas, seedLeads, seedVendas } from '@/data/seed';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useStore() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>(() => loadFromStorage('procedimentos', seedProcedimentos));
  const [campanhas, setCampanhas] = useState<Campanha[]>(() => loadFromStorage('campanhas', seedCampanhas));
  const [leads, setLeads] = useState<Lead[]>(() => loadFromStorage('leads', seedLeads));
  const [vendas, setVendas] = useState<Venda[]>(() => loadFromStorage('vendas', seedVendas));
  const [perfil, setPerfil] = useState<Perfil>(() => loadFromStorage('perfil', 'gestor' as Perfil));

  useEffect(() => saveToStorage('procedimentos', procedimentos), [procedimentos]);
  useEffect(() => saveToStorage('campanhas', campanhas), [campanhas]);
  useEffect(() => saveToStorage('leads', leads), [leads]);
  useEffect(() => saveToStorage('vendas', vendas), [vendas]);
  useEffect(() => saveToStorage('perfil', perfil), [perfil]);

  const addProcedimento = useCallback((p: Procedimento) => setProcedimentos(prev => [...prev, p]), []);
  const updateProcedimento = useCallback((p: Procedimento) => setProcedimentos(prev => prev.map(x => x.id === p.id ? p : x)), []);
  const addCampanha = useCallback((c: Campanha) => setCampanhas(prev => [...prev, c]), []);
  const updateCampanha = useCallback((c: Campanha) => setCampanhas(prev => prev.map(x => x.id === c.id ? c : x)), []);
  const addLead = useCallback((l: Lead) => setLeads(prev => [...prev, l]), []);
  const updateLead = useCallback((l: Lead) => setLeads(prev => prev.map(x => x.id === l.id ? l : x)), []);
  const addVenda = useCallback((v: Venda) => setVendas(prev => [...prev, v]), []);
  const updateVenda = useCallback((v: Venda) => setVendas(prev => prev.map(x => x.id === v.id ? v : x)), []);

  return {
    procedimentos, campanhas, leads, vendas, perfil,
    setPerfil,
    addProcedimento, updateProcedimento,
    addCampanha, updateCampanha,
    addLead, updateLead,
    addVenda, updateVenda,
  };
}
