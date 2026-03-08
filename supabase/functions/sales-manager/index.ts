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

    const systemPrompt = `Você é o Sales Manager AI da agência Riscamundo. Sua especialidade é organizar contatos de vendas para campanhas de email marketing e WhatsApp.

Quando receber dados de planilha (CSV), você deve:
1. Analisar e limpar os dados (remover duplicados, padronizar telefones, validar emails)
2. Segmentar os contatos em categorias trabalháveis
3. Retornar os dados organizados em formato estruturado

Para cada contato, extraia: nome, email, telefone (formato +55...), empresa, segmento, origem, e uma nota de qualificação.

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
