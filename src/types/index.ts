import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// DB row types
export type Procedimento = Tables<'procedimentos'>;
export type ProcedimentoInsert = TablesInsert<'procedimentos'>;
export type ProcedimentoUpdate = TablesUpdate<'procedimentos'>;

export type Campanha = Tables<'campanhas'>;
export type CampanhaInsert = TablesInsert<'campanhas'>;
export type CampanhaUpdate = TablesUpdate<'campanhas'>;

export type Lead = Tables<'leads'>;
export type LeadInsert = TablesInsert<'leads'>;
export type LeadUpdate = TablesUpdate<'leads'>;

export type Venda = Tables<'vendas'>;
export type VendaInsert = TablesInsert<'vendas'>;
export type VendaUpdate = TablesUpdate<'vendas'>;

export type Profile = Tables<'profiles'>;
export type UserRole = Tables<'user_roles'>;
export type AppRole = 'master' | 'gestor' | 'equipe';

// Legacy compat aliases
export type Categoria = 'facial' | 'capilar' | 'combo_premium';
export type Prioridade = 'alta' | 'media' | 'baixa';
export type StatusFunil = 'novo' | 'qualificado' | 'avaliacao' | 'venda' | 'perdido';
export type NivelInteresse = 'baixo' | 'medio' | 'alto';
export type Canal = 'Google Ads' | 'Meta Ads' | 'Instagram Orgânico' | 'Indicação';
export type FormaPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'financiamento';
export type SeveridadeAlerta = 'critico' | 'atencao' | 'info';

export interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  severidade: SeveridadeAlerta;
  data: string;
  ativo: boolean;
}
