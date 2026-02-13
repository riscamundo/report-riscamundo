import { Procedimento, Campanha, Lead, Venda } from '@/types';

export const seedProcedimentos: Procedimento[] = [
  { id: 'p1', nome_procedimento: 'Harmonização Facial', categoria: 'facial', ticket_medio: 3500, margem_estimada: 65, status: 'ativo', prioridade_vendas: 'alta' },
  { id: 'p2', nome_procedimento: 'Botox Full Face', categoria: 'facial', ticket_medio: 2200, margem_estimada: 70, status: 'ativo', prioridade_vendas: 'alta' },
  { id: 'p3', nome_procedimento: 'Preenchimento Labial', categoria: 'facial', ticket_medio: 1800, margem_estimada: 68, status: 'ativo', prioridade_vendas: 'media' },
  { id: 'p4', nome_procedimento: 'Transplante Capilar FUE', categoria: 'capilar', ticket_medio: 15000, margem_estimada: 55, status: 'ativo', prioridade_vendas: 'alta' },
  { id: 'p5', nome_procedimento: 'Microagulhamento Capilar', categoria: 'capilar', ticket_medio: 800, margem_estimada: 75, status: 'ativo', prioridade_vendas: 'media' },
  { id: 'p6', nome_procedimento: 'Combo Premium Face', categoria: 'combo_premium', ticket_medio: 6500, margem_estimada: 60, status: 'ativo', prioridade_vendas: 'alta' },
  { id: 'p7', nome_procedimento: 'Combo Premium Total', categoria: 'combo_premium', ticket_medio: 12000, margem_estimada: 58, status: 'ativo', prioridade_vendas: 'alta' },
  { id: 'p8', nome_procedimento: 'Lipo de Papada', categoria: 'corporal', ticket_medio: 4500, margem_estimada: 62, status: 'ativo', prioridade_vendas: 'media' },
  { id: 'p9', nome_procedimento: 'Sculptra Glúteos', categoria: 'corporal', ticket_medio: 5000, margem_estimada: 60, status: 'inativo', prioridade_vendas: 'baixa' },
  { id: 'p10', nome_procedimento: 'Skinbooster', categoria: 'facial', ticket_medio: 1200, margem_estimada: 72, status: 'ativo', prioridade_vendas: 'media' },
];

export const seedCampanhas: Campanha[] = [
  { id: 'c1', canal: 'Meta Ads', nome_campanha: 'Harmonização - Verão 2026', procedimento_foco: 'p1', investimento: 8500, periodo_inicio: '2026-01-01', periodo_fim: '2026-02-28', status: 'ativa' },
  { id: 'c2', canal: 'Google Ads', nome_campanha: 'Transplante Capilar - Search', procedimento_foco: 'p4', investimento: 12000, periodo_inicio: '2026-01-15', periodo_fim: '2026-03-15', status: 'ativa' },
  { id: 'c3', canal: 'Meta Ads', nome_campanha: 'Combo Premium - Campanha', procedimento_foco: 'p6', investimento: 6000, periodo_inicio: '2026-01-10', periodo_fim: '2026-02-10', status: 'ativa' },
  { id: 'c4', canal: 'Instagram Orgânico', nome_campanha: 'Conteúdo Botox', procedimento_foco: 'p2', investimento: 1500, periodo_inicio: '2026-01-01', periodo_fim: '2026-02-28', status: 'ativa' },
  { id: 'c5', canal: 'Google Ads', nome_campanha: 'Preenchimento - Display', procedimento_foco: 'p3', investimento: 4000, periodo_inicio: '2025-12-01', periodo_fim: '2026-01-31', status: 'finalizada' },
];

export const seedLeads: Lead[] = [
  { id: 'l1', nome: 'Ana Silva', telefone: '11999001122', origem: 'Meta Ads', campanha_id: 'c1', procedimento_interesse: 'p1', nivel_interesse: 'alto', status_funil: 'venda', data_criacao: '2026-01-05', valor_potencial: 3500 },
  { id: 'l2', nome: 'Carlos Mendes', telefone: '11998223344', origem: 'Google Ads', campanha_id: 'c2', procedimento_interesse: 'p4', nivel_interesse: 'alto', status_funil: 'avaliacao', data_criacao: '2026-01-18', valor_potencial: 15000 },
  { id: 'l3', nome: 'Maria Oliveira', telefone: '11997554466', origem: 'Meta Ads', campanha_id: 'c3', procedimento_interesse: 'p6', nivel_interesse: 'medio', status_funil: 'qualificado', data_criacao: '2026-01-20', valor_potencial: 6500 },
  { id: 'l4', nome: 'João Santos', telefone: '11996887700', origem: 'Meta Ads', campanha_id: 'c1', procedimento_interesse: 'p1', nivel_interesse: 'alto', status_funil: 'venda', data_criacao: '2026-01-08', valor_potencial: 3500 },
  { id: 'l5', nome: 'Patricia Lima', telefone: '11995112233', origem: 'Instagram Orgânico', campanha_id: 'c4', procedimento_interesse: 'p2', nivel_interesse: 'baixo', status_funil: 'novo', data_criacao: '2026-02-01', valor_potencial: 2200 },
  { id: 'l6', nome: 'Roberto Alves', telefone: '11994556677', origem: 'Google Ads', campanha_id: 'c2', procedimento_interesse: 'p4', nivel_interesse: 'alto', status_funil: 'venda', data_criacao: '2026-01-12', valor_potencial: 15000 },
  { id: 'l7', nome: 'Fernanda Costa', telefone: '11993889900', origem: 'Meta Ads', campanha_id: 'c3', procedimento_interesse: 'p7', nivel_interesse: 'alto', status_funil: 'avaliacao', data_criacao: '2026-01-25', valor_potencial: 12000 },
  { id: 'l8', nome: 'Lucas Pereira', telefone: '11992001122', origem: 'Google Ads', campanha_id: 'c5', procedimento_interesse: 'p3', nivel_interesse: 'medio', status_funil: 'perdido', data_criacao: '2025-12-15', valor_potencial: 1800 },
  { id: 'l9', nome: 'Isabela Martins', telefone: '11991334455', origem: 'Meta Ads', campanha_id: 'c1', procedimento_interesse: 'p1', nivel_interesse: 'alto', status_funil: 'qualificado', data_criacao: '2026-02-05', valor_potencial: 3500 },
  { id: 'l10', nome: 'Diego Ferreira', telefone: '11990667788', origem: 'Instagram Orgânico', campanha_id: 'c4', procedimento_interesse: 'p2', nivel_interesse: 'medio', status_funil: 'novo', data_criacao: '2026-02-10', valor_potencial: 2200 },
  { id: 'l11', nome: 'Camila Rodrigues', telefone: '11989001122', origem: 'Meta Ads', campanha_id: 'c3', procedimento_interesse: 'p6', nivel_interesse: 'alto', status_funil: 'venda', data_criacao: '2026-01-15', valor_potencial: 6500 },
  { id: 'l12', nome: 'Rafael Nascimento', telefone: '11988334455', origem: 'Google Ads', campanha_id: 'c2', procedimento_interesse: 'p4', nivel_interesse: 'medio', status_funil: 'qualificado', data_criacao: '2026-02-03', valor_potencial: 15000 },
  { id: 'l13', nome: 'Juliana Souza', telefone: '11987667788', origem: 'Meta Ads', campanha_id: 'c1', procedimento_interesse: 'p10', nivel_interesse: 'baixo', status_funil: 'novo', data_criacao: '2026-02-12', valor_potencial: 1200 },
  { id: 'l14', nome: 'Thiago Barbosa', telefone: '11986001122', origem: 'Google Ads', campanha_id: 'c5', procedimento_interesse: 'p3', nivel_interesse: 'alto', status_funil: 'venda', data_criacao: '2025-12-20', valor_potencial: 1800 },
  { id: 'l15', nome: 'Amanda Teixeira', telefone: '11985334455', origem: 'Meta Ads', campanha_id: 'c3', procedimento_interesse: 'p7', nivel_interesse: 'alto', status_funil: 'avaliacao', data_criacao: '2026-02-01', valor_potencial: 12000 },
];

export const seedVendas: Venda[] = [
  { id: 'v1', lead_id: 'l1', procedimento_vendido: 'p1', valor_venda: 3500, forma_pagamento: 'cartao_credito', data_venda: '2026-01-15', vendedor: 'Dra. Marina', status: 'fechado' },
  { id: 'v2', lead_id: 'l4', procedimento_vendido: 'p1', valor_venda: 3800, forma_pagamento: 'pix', data_venda: '2026-01-22', vendedor: 'Dra. Marina', status: 'fechado' },
  { id: 'v3', lead_id: 'l6', procedimento_vendido: 'p4', valor_venda: 15000, forma_pagamento: 'financiamento', data_venda: '2026-01-28', vendedor: 'Dr. André', status: 'fechado' },
  { id: 'v4', lead_id: 'l11', procedimento_vendido: 'p6', valor_venda: 6500, forma_pagamento: 'cartao_credito', data_venda: '2026-02-02', vendedor: 'Dra. Marina', status: 'fechado' },
  { id: 'v5', lead_id: 'l14', procedimento_vendido: 'p3', valor_venda: 1800, forma_pagamento: 'pix', data_venda: '2026-01-10', vendedor: 'Dr. André', status: 'fechado' },
  { id: 'v6', lead_id: 'l8', procedimento_vendido: 'p3', valor_venda: 1800, forma_pagamento: 'cartao_debito', data_venda: '2026-01-05', vendedor: 'Dra. Marina', status: 'cancelado' },
];
