import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Procedimento, Campanha, Lead, Venda, ProcedimentoInsert, CampanhaInsert, LeadInsert, VendaInsert } from '@/types';

interface StoreContextType {
  procedimentos: Procedimento[];
  campanhas: Campanha[];
  leads: Lead[];
  vendas: Venda[];
  loading: boolean;
  addProcedimento: (p: ProcedimentoInsert) => Promise<void>;
  updateProcedimento: (id: string, p: Partial<Procedimento>) => Promise<void>;
  addCampanha: (c: CampanhaInsert) => Promise<void>;
  updateCampanha: (id: string, c: Partial<Campanha>) => Promise<void>;
  addLead: (l: LeadInsert) => Promise<void>;
  updateLead: (id: string, l: Partial<Lead>) => Promise<void>;
  addVenda: (v: VendaInsert) => Promise<void>;
  updateVenda: (id: string, v: Partial<Venda>) => Promise<void>;
  refresh: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [p, c, l, v] = await Promise.all([
      supabase.from('procedimentos').select('*').order('created_at'),
      supabase.from('campanhas').select('*').order('created_at'),
      supabase.from('leads').select('*').order('created_at'),
      supabase.from('vendas').select('*').order('created_at'),
    ]);
    setProcedimentos(p.data || []);
    setCampanhas(c.data || []);
    setLeads(l.data || []);
    setVendas(v.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addProcedimento = useCallback(async (p: ProcedimentoInsert) => {
    const { data } = await supabase.from('procedimentos').insert(p).select().single();
    if (data) setProcedimentos(prev => [...prev, data]);
  }, []);

  const updateProcedimento = useCallback(async (id: string, p: Partial<Procedimento>) => {
    const { data } = await supabase.from('procedimentos').update(p).eq('id', id).select().single();
    if (data) setProcedimentos(prev => prev.map(x => x.id === id ? data : x));
  }, []);

  const addCampanha = useCallback(async (c: CampanhaInsert) => {
    const { data } = await supabase.from('campanhas').insert(c).select().single();
    if (data) setCampanhas(prev => [...prev, data]);
  }, []);

  const updateCampanha = useCallback(async (id: string, c: Partial<Campanha>) => {
    const { data } = await supabase.from('campanhas').update(c).eq('id', id).select().single();
    if (data) setCampanhas(prev => prev.map(x => x.id === id ? data : x));
  }, []);

  const addLead = useCallback(async (l: LeadInsert) => {
    const { data } = await supabase.from('leads').insert({ ...l, created_by: user?.id }).select().single();
    if (data) setLeads(prev => [...prev, data]);
  }, [user]);

  const updateLead = useCallback(async (id: string, l: Partial<Lead>) => {
    const { data } = await supabase.from('leads').update(l).eq('id', id).select().single();
    if (data) setLeads(prev => prev.map(x => x.id === id ? data : x));
  }, []);

  const addVenda = useCallback(async (v: VendaInsert) => {
    const { data } = await supabase.from('vendas').insert({ ...v, vendedor: user?.id }).select().single();
    if (data) setVendas(prev => [...prev, data]);
  }, [user]);

  const updateVenda = useCallback(async (id: string, v: Partial<Venda>) => {
    const { data } = await supabase.from('vendas').update(v).eq('id', id).select().single();
    if (data) setVendas(prev => prev.map(x => x.id === id ? data : x));
  }, []);

  return (
    <StoreContext.Provider value={{
      procedimentos, campanhas, leads, vendas, loading,
      addProcedimento, updateProcedimento,
      addCampanha, updateCampanha,
      addLead, updateLead,
      addVenda, updateVenda,
      refresh: fetchAll,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStoreContext must be used within StoreProvider');
  return ctx;
}
