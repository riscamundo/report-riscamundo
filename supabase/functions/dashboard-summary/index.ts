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
    const { metricsContext, connectionsContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load custom system prompt
    let basePrompt = "Você é o Agente Riscamundo, consultor estratégico de marketing digital e vendas.";
    const { data: configData } = await supabase
      .from("maestro_config")
      .select("system_prompt")
      .limit(1)
      .single();
    if (configData?.system_prompt) {
      basePrompt = configData.system_prompt;
    }

    const systemPrompt = `${basePrompt}

Sua tarefa é analisar os dados do cliente e retornar um JSON com:
1. "tech_summary" - Parágrafo 1: RESUMO TÉCNICO. Analise os tenants, status de conexões (Google Business, Evolution API, WhatsApp, Instagram, Facebook, etc), mensagens enviadas/recebidas, respostas pendentes e sincronizações. Destaque conexões com problemas e celebre as que estão funcionando bem. Use emojis (🔗 ✅ ⚠️ 📡 💬). Máximo 3 linhas.
2. "sales_summary" - Parágrafo 2: RESUMO DE VENDAS & CRM. Analise o trabalho interno: vendas fechadas, anúncios ativos, leads no funil, campanhas, forecast e performance do CRM da agência. Tom otimista mas realista. Use emojis (🚀 📈 💰 🎯). Máximo 3 linhas.
3. "suggestions" - Array de 3-5 sugestões práticas. Cada sugestão com:
   - "title": Título curto (max 60 chars)
   - "priority": "alta", "media" ou "baixa"
   - "category": "tech" ou "sales"

RESPONDA APENAS COM JSON VÁLIDO, sem markdown, sem code blocks.`;

    const userContent = `Dados técnicos de conexões dos tenants:\n\n${connectionsContext || 'Nenhuma conexão configurada ainda.'}\n\nDados de vendas e CRM:\n\n${metricsContext}\n\nGere o JSON com resumo técnico e de vendas.`;

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
                name: "generate_summary",
                description: "Generate a dual summary (tech + sales) with actionable suggestions.",
                parameters: {
                  type: "object",
                  properties: {
                    tech_summary: { type: "string", description: "Technical connections summary paragraph" },
                    sales_summary: { type: "string", description: "Sales and CRM summary paragraph" },
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "Short action title" },
                          priority: { type: "string", enum: ["alta", "media", "baixa"] },
                          category: { type: "string", enum: ["tech", "sales"] }
                        },
                        required: ["title", "priority", "category"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["tech_summary", "sales_summary", "suggestions"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "generate_summary" } },
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
    
    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        // Backward compat: also set "summary" for old clients
        if (!parsed.summary) {
          parsed.summary = `${parsed.tech_summary}\n\n${parsed.sales_summary}`;
        }
        return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        // fallback
      }
    }

    // Fallback: try to parse content as JSON
    const content = data.choices?.[0]?.message?.content || "";
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ summary: content, tech_summary: content, sales_summary: '', suggestions: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("dashboard-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
