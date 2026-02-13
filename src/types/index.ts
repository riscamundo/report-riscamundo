export type Categoria = 'facial' | 'corporal' | 'capilar' | 'combo_premium';
export type Prioridade = 'alta' | 'media' | 'baixa';
export type StatusFunil = 'novo' | 'qualificado' | 'avaliacao' | 'venda' | 'perdido';
export type NivelInteresse = 'baixo' | 'medio' | 'alto';
export type Canal = 'Google Ads' | 'Meta Ads' | 'Instagram Orgânico' | 'Indicação';
export type FormaPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'financiamento';
export type Perfil = 'gestor' | 'marketing' | 'vendas';
export type SeveridadeAlerta = 'critico' | 'atencao' | 'info';

export interface Procedimento {
  id: string;
  nome_procedimento: string;
  categoria: Categoria;
  ticket_medio: number;
  margem_estimada: number;
  status: 'ativo' | 'inativo';
  prioridade_vendas: Prioridade;
}

export interface Campanha {
  id: string;
  canal: Canal;
  nome_campanha: string;
  procedimento_foco: string;
  investimento: number;
  periodo_inicio: string;
  periodo_fim: string;
  status: 'ativa' | 'pausada' | 'finalizada';
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  origem: Canal;
  campanha_id: string;
  procedimento_interesse: string;
  nivel_interesse: NivelInteresse;
  status_funil: StatusFunil;
  data_criacao: string;
  valor_potencial: number;
}

export interface Venda {
  id: string;
  lead_id: string;
  procedimento_vendido: string;
  valor_venda: number;
  forma_pagamento: FormaPagamento;
  data_venda: string;
  vendedor: string;
  status: 'fechado' | 'cancelado';
}

export interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  severidade: SeveridadeAlerta;
  data: string;
  ativo: boolean;
}
