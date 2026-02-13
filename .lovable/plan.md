

# Dashboard Clínica Estética Premium

## Visão Geral
Aplicação completa de dashboard executivo e operacional para clínica estética, com visual dark mode premium (fundo escuro, acentos dourados/bronze), dados funcionais via localStorage e estrutura preparada para migração futura a backend.

---

## Design & Layout

- **Tema**: Dark mode com tons de cinza escuro, acentos em dourado/bronze e branco
- **Sidebar**: Navegação lateral colapsável com ícones e labels
- **Perfis de acesso**: Gestor (acesso total), Marketing (mídia + leads), Vendas (funil + fechamento) — controlado via seleção local inicialmente
- **Responsivo**: Layout adaptável para desktop e tablet

---

## Tela 1: Visão Executiva (Home)

**Cards KPI no topo:**
- Faturamento do mês
- Investimento em mídia
- ROI atual
- Ticket médio
- Conversão Lead → Venda
- % vendas de combos premium

**Gráficos:**
- Funil completo (barra horizontal: Leads → Qualificação → Avaliação → Venda)
- Receita por procedimento (barras)
- Receita por canal (pizza/donut)
- ROI por campanha (barras comparativas)

**Alertas:** Banner no topo com alertas críticos ativos

---

## Tela 2: Controle de Procedimentos

- Tabela com nome, categoria, ticket médio, vendas no mês, faturamento total, status
- Ordenação por faturamento
- Modal de cadastro/edição de procedimentos (nome, categoria, ticket, margem, prioridade)
- Ativar/desativar procedimentos
- Drill-down: histórico de vendas por procedimento

---

## Tela 3: Mídia e Performance

- Cards: investimento total, leads gerados, CPL médio, receita atribuída, ROI geral
- Tabela de campanhas com todos os campos e métricas calculadas
- Cadastro/edição de campanhas
- Gráficos: CPL x Ticket médio (scatter), Receita x Investimento (barras comparativas)

---

## Tela 4: Funil de Vendas (Kanban)

- Colunas: Novo Lead → Qualificado → Avaliação → Venda → Perdido
- Cards de lead com nome, procedimento de interesse, valor potencial, tempo no estágio
- Drag & drop entre etapas
- Resumo por etapa: quantidade de leads e valor potencial total
- Cadastro rápido de novos leads

---

## Tela 5: Controle de Vendas & Forecast

**Vendas:**
- Registro de vendas vinculado a leads
- Tabela com procedimento, valor, forma de pagamento, vendedor, data

**Forecast:**
- Projeção mensal e trimestral baseada em leads ativos × taxa de conversão × ticket médio
- Cards: receita projetada, investimento ideal para escalar, ponto de escala seguro
- Gráfico de projeção vs meta

---

## Tela 6: Central de Alertas

- Lista de todos os alertas ativos e histórico
- Regras automáticas calculadas sobre os dados:
  - CPL subiu >20% vs média
  - ROI de campanha < 8x
  - Ticket médio caindo por 2 períodos
  - Combos premium < 30% das vendas
  - Leads sem contato > 24h
- Indicadores de severidade (crítico, atenção, info)

---

## Dados & Persistência

- Todas as entidades (procedimentos, campanhas, leads, vendas) armazenadas em localStorage
- Dados de exemplo pré-carregados para demonstração
- Cálculos de métricas, alertas e forecast feitos em tempo real no frontend
- Estrutura de dados preparada para migração futura a Supabase

---

## Navegação por Perfil

- Seletor de perfil no sidebar (Gestor / Marketing / Vendas)
- Marketing vê: Mídia, Leads, Dashboard (sem vendas)
- Vendas vê: Funil, Vendas, Dashboard (sem mídia)
- Gestor vê: tudo

