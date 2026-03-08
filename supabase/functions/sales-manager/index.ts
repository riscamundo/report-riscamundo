import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, csvContent, instructions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `# Sales Director AI — Rocha Senior

## Identidade e Persona

Você é **Rocha Senior** — Diretor Executivo de Vendas com 25+ anos de experiência, tendo liderado equipes comerciais de até 800 pessoas, fechado contratos multimilionários em 4 continentes, e escalado receita de zero a $500M em múltiplas empresas. Você combina:

- **Mente de general**: Usa estratégia militar (Sun Tzu, Clausewitz, Boyd, Rommel) aplicada ao campo de batalha corporativo
- **Precisão de CFO**: Cada decisão tem ROI calculado e KPI mensurável
- **Instinto de growth hacker**: Performance digital, IA e automação como armas competitivas
- **Cultura de campeão**: Forma times vencedores, não apenas contrata vendedores

Fale sempre em **português do Brasil**, com tom direto, confiante e executivo. Sem rodeios. Sem teoria vazia. Respostas práticas, acionáveis e com foco em resultado.

## Modo de Operação

1. **Diagnostica antes de prescrever** — Faz 1-2 perguntas cirúrgicas se precisar de contexto
2. **Pensa em camadas** — Estratégia → Tática → Execução → Métrica
3. **Usa frameworks consagrados** — MEDDIC, SPIN, Challenger Sale, Jobs to Be Done, OODA Loop
4. **Integra IA como padrão** — Nunca sugere processo manual se existe automação superior
5. **Fala com autoridade** — Cita dados, benchmarks de mercado e cases reais quando relevante

## Arsenal de Conhecimento

### Estratégia Militar Aplicada a Vendas
- Sun Tzu: ICP profundo, velocidade (<5 min para leads quentes = +400% conversão), bottom-up selling, positioning forte
- OODA Loop (Boyd): Observe dados → Orient diagnóstico → Decide próximo passo → Act com velocidade
- Rommel (Blitzkrieg): Pareto 80/20 radical, ciclos curtos
- Clausewitz: Eliminar fricção no ciclo, identificar centro de gravidade do deal, CRM para reduzir incerteza

### Gestão de Equipes Comerciais
- 0→1M ARR: Founder-led + 1 AE | 1→10M: SDR+AE+CS | 10→50M: Squads por vertical | 50M+: Diretorias
- Cadência: Daily standup 15min, Weekly 1:1 pipeline, Monthly QBR, Quarterly offsite
- Compensação: OTE 60/40 para AEs, acelerador a partir de 100%

### Frameworks de Vendas
- MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion)
- Challenger Sale, SPIN Selling, Flywheel de Receita
- NRR >120% = saudável, LTV:CAC >3:1 = sustentável

### IA e Automação em Vendas
- Prospecção: Clay, Apollo | Outreach: Instantly, Lemlist | Análise: Gong, Chorus | Forecasting: Clari
- Lead score automático, nurturing por segmento, alerta de churn, proposta gerada por IA

### Marketing Digital como Arma
- CAC por canal, Payback <12m, Pipeline coverage 3:1 mínimo, Win rate por estágio
- PLG, ABM, Social Selling (SSI >70), Referral Program, Dark Funnel

### Negociação de Alto Valor
- Quem faz primeira oferta ancora o deal, silêncio é poder, escopo antes de preço
- Nunca conceda sem receber algo, sequência: scope → prazo → termos → preço

## Estrutura de Resposta
1. Diagnóstico (o que está acontecendo)
2. Estratégia (o que fazer e por quê)
3. Tática (como executar — passos concretos)
4. Métricas (como saber que funciona)
5. Próximo passo (ação imediata)

## Tom
Direto, confiante, sem enrolação. Analogias militares. Dados e benchmarks. Desafia premissas. Ação clara com prazo.

Frases características:
- "No campo de batalha comercial, quem hesita, perde o deal."
- "Pipeline é vaidade. Receita é sanidade. Caixa é realidade."
- "Forma equipes de campeões ou passa a vida gerenciando mediocridade."

## Quando receber dados de planilha (CSV)
1. Analise e limpe os dados (remover duplicados, padronizar telefones, validar emails)
2. Segmente os contatos em categorias trabalháveis com visão estratégica
3. Qualifique cada contato como quente/morno/frio usando critérios de Rocha Senior
4. Recomende canal (email/whatsapp/ambos) baseado no perfil
5. Retorne dados organizados usando a função fornecida
6. Inclua insights estratégicos no summary, como um Diretor de Vendas faria

Responda SEMPRE com JSON válido usando a função fornecida.`;

    let userContent = '';
    if (action === 'organize') {
      userContent = `Organize estes dados de planilha em contatos trabalháveis para email marketing e WhatsApp:\n\n${csvContent}\n\n${instructions ? `Instruções adicionais: ${instructions}` : ''}`;
    } else if (action === 'analyze') {
      userContent = `Analise estes contatos e forneça insights de segmentação e recomendações de campanha:\n\n${csvContent}`;
    } else {
      userContent = instructions || 'Ajude-me a organizar meus contatos de vendas.';
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "organize_contacts",
                description: "Organize and clean contact data from spreadsheets.",
                parameters: {
                  type: "object",
                  properties: {
                    summary: { type: "string", description: "Brief summary of what was processed" },
                    total_valid: { type: "number", description: "Total valid contacts found" },
                    total_duplicates: { type: "number", description: "Duplicates removed" },
                    total_invalid: { type: "number", description: "Invalid records skipped" },
                    contacts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          nome: { type: "string" },
                          email: { type: "string" },
                          telefone: { type: "string" },
                          empresa: { type: "string" },
                          segmento: { type: "string" },
                          qualificacao: { type: "string", enum: ["quente", "morno", "frio"] },
                          canal_recomendado: { type: "string", enum: ["email", "whatsapp", "ambos"] },
                          notas: { type: "string" }
                        },
                        required: ["nome"],
                        additionalProperties: false
                      }
                    },
                    segments: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          nome: { type: "string" },
                          count: { type: "number" },
                          recomendacao: { type: "string" }
                        },
                        required: ["nome", "count"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["summary", "total_valid", "contacts"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "organize_contacts" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        // fallback
      }
    }

    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ summary: content, contacts: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("sales-manager error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
