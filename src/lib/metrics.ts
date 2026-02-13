import { Procedimento, Campanha, Lead, Venda, Alerta } from '@/types';

export function calcFaturamentoMes(vendas: Venda[]) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return vendas
    .filter(v => v.status === 'fechado' && new Date(v.data_venda).getMonth() === month && new Date(v.data_venda).getFullYear() === year)
    .reduce((sum, v) => sum + v.valor_venda, 0);
}

export function calcInvestimentoTotal(campanhas: Campanha[]) {
  return campanhas.filter(c => c.status === 'ativa').reduce((sum, c) => sum + c.investimento, 0);
}

export function calcROI(vendas: Venda[], campanhas: Campanha[]) {
  const receita = calcFaturamentoMes(vendas);
  const investimento = calcInvestimentoTotal(campanhas);
  return investimento > 0 ? receita / investimento : 0;
}

export function calcTicketMedio(vendas: Venda[]) {
  const fechadas = vendas.filter(v => v.status === 'fechado');
  return fechadas.length > 0 ? fechadas.reduce((s, v) => s + v.valor_venda, 0) / fechadas.length : 0;
}

export function calcConversao(leads: Lead[], vendas: Venda[]) {
  const totalLeads = leads.length;
  const vendasFechadas = vendas.filter(v => v.status === 'fechado').length;
  return totalLeads > 0 ? (vendasFechadas / totalLeads) * 100 : 0;
}

export function calcCombosPremium(vendas: Venda[], procedimentos: Procedimento[]) {
  const fechadas = vendas.filter(v => v.status === 'fechado');
  if (fechadas.length === 0) return 0;
  const combos = fechadas.filter(v => {
    const proc = procedimentos.find(p => p.id === v.procedimento_vendido);
    return proc?.categoria === 'combo_premium';
  });
  return (combos.length / fechadas.length) * 100;
}

export function calcCPL(campanhas: Campanha[], leads: Lead[]) {
  const investimento = calcInvestimentoTotal(campanhas);
  const totalLeads = leads.filter(l => campanhas.some(c => c.id === l.campanha_id && c.status === 'ativa')).length;
  return totalLeads > 0 ? investimento / totalLeads : 0;
}

export function getLeadsPorEtapa(leads: Lead[]) {
  const etapas = ['novo', 'qualificado', 'avaliacao', 'venda', 'perdido'] as const;
  return etapas.map(e => ({
    etapa: e,
    label: e === 'avaliacao' ? 'Avaliação' : e.charAt(0).toUpperCase() + e.slice(1),
    count: leads.filter(l => l.status_funil === e).length,
    valor: leads.filter(l => l.status_funil === e).reduce((s, l) => s + l.valor_potencial, 0),
  }));
}

export function getReceitaPorProcedimento(vendas: Venda[], procedimentos: Procedimento[]) {
  return procedimentos.map(p => ({
    nome: p.nome_procedimento,
    receita: vendas.filter(v => v.procedimento_vendido === p.id && v.status === 'fechado').reduce((s, v) => s + v.valor_venda, 0),
  })).filter(x => x.receita > 0).sort((a, b) => b.receita - a.receita);
}

export function getReceitaPorCanal(vendas: Venda[], leads: Lead[]) {
  const canais = ['Google Ads', 'Meta Ads', 'Instagram Orgânico', 'Indicação'] as const;
  return canais.map(canal => {
    const leadsDoCanal = leads.filter(l => l.origem === canal);
    const receita = vendas.filter(v => v.status === 'fechado' && leadsDoCanal.some(l => l.id === v.lead_id)).reduce((s, v) => s + v.valor_venda, 0);
    return { canal, receita };
  }).filter(x => x.receita > 0);
}

export function getROIPorCampanha(campanhas: Campanha[], vendas: Venda[], leads: Lead[]) {
  return campanhas.map(c => {
    const leadsC = leads.filter(l => l.campanha_id === c.id);
    const receita = vendas.filter(v => v.status === 'fechado' && leadsC.some(l => l.id === v.lead_id)).reduce((s, v) => s + v.valor_venda, 0);
    return { nome: c.nome_campanha, roi: c.investimento > 0 ? receita / c.investimento : 0, investimento: c.investimento, receita };
  });
}

export function calcAlertas(procedimentos: Procedimento[], campanhas: Campanha[], leads: Lead[], vendas: Venda[]): Alerta[] {
  const alertas: Alerta[] = [];
  const now = new Date().toISOString();

  // CPL > 20% above average
  const cpl = calcCPL(campanhas, leads);
  if (cpl > 300) {
    alertas.push({ id: 'a1', tipo: 'cpl_alto', mensagem: `CPL atual (R$ ${cpl.toFixed(0)}) está acima do ideal`, severidade: 'atencao', data: now, ativo: true });
  }

  // ROI < 8x
  const roiData = getROIPorCampanha(campanhas, vendas, leads);
  roiData.forEach(r => {
    if (r.roi < 8 && r.roi > 0) {
      alertas.push({ id: `a-roi-${r.nome}`, tipo: 'roi_baixo', mensagem: `ROI da campanha "${r.nome}" está em ${r.roi.toFixed(1)}x (abaixo de 8x)`, severidade: 'critico', data: now, ativo: true });
    }
  });

  // Combos premium < 30%
  const comboPct = calcCombosPremium(vendas, procedimentos);
  if (comboPct < 30) {
    alertas.push({ id: 'a-combo', tipo: 'combo_baixo', mensagem: `Vendas de combos premium em ${comboPct.toFixed(0)}% (meta: 30%)`, severidade: 'atencao', data: now, ativo: true });
  }

  // Leads sem contato > 24h (novos há mais de 1 dia)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const leadsParados = leads.filter(l => l.status_funil === 'novo' && new Date(l.data_criacao).getTime() < oneDayAgo);
  if (leadsParados.length > 0) {
    alertas.push({ id: 'a-leads', tipo: 'leads_parados', mensagem: `${leadsParados.length} lead(s) sem contato há mais de 24h`, severidade: 'critico', data: now, ativo: true });
  }

  return alertas;
}

export function calcForecast(leads: Lead[], vendas: Venda[], procedimentos: Procedimento[]) {
  const leadsAtivos = leads.filter(l => ['novo', 'qualificado', 'avaliacao'].includes(l.status_funil));
  const taxaConversao = calcConversao(leads, vendas) / 100;
  const ticketMedio = calcTicketMedio(vendas);
  const receitaProjetadaMensal = leadsAtivos.length * taxaConversao * ticketMedio;
  const receitaProjetadaTrimestral = receitaProjetadaMensal * 3;
  const investimentoIdeal = receitaProjetadaMensal / 8; // ROI 8x target

  return {
    leadsAtivos: leadsAtivos.length,
    taxaConversao,
    ticketMedio,
    receitaProjetadaMensal,
    receitaProjetadaTrimestral,
    investimentoIdeal,
    pontoEscala: investimentoIdeal * 1.2,
  };
}
