import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tarefas, clienteNome } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tarefasResumo = (tarefas || []).map((t: any) => 
      `- [${t.status}] ${t.titulo} (prioridade: ${t.prioridade || 'media'}, criada: ${t.created_at?.slice(0,10)}, desc: ${t.descricao || 'sem descrição'})`
    ).join('\n');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um gestor de projetos sênior especializado em agências de marketing digital e clínicas de estética.
Analise as tarefas do cliente e forneça insights acionáveis.

Sua análise deve cobrir:
1. **Correções**: Problemas no fluxo atual (tarefas paradas, gargalos, prioridades erradas, tarefas duplicadas ou muito similares)
2. **Sugestões**: Melhorias de processo baseadas em metodologias ágeis (Kanban, Scrum), PMBOK e boas práticas de gestão
3. **Ideias para conversa**: Pontos que o gestor master pode conversar com o cliente para melhorar performance e resultados

Responda em português brasileiro, de forma direta e prática.
Formato JSON obrigatório.`
          },
          {
            role: "user",
            content: `Cliente: ${clienteNome || 'N/A'}\n
Tarefas atuais:\n${tarefasResumo || 'Nenhuma tarefa cadastrada.'}\n
Total: ${(tarefas || []).length} tarefas
Fazendo: ${(tarefas || []).filter((t: any) => t.status === 'fazendo').length}
Esperando: ${(tarefas || []).filter((t: any) => t.status === 'esperando').length}
Pronta: ${(tarefas || []).filter((t: any) => t.status === 'pronta').length}
Verificar: ${(tarefas || []).filter((t: any) => t.status === 'verificar').length}

Analise o fluxo, identifique padrões repetitivos e sugira melhorias.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_analysis",
              description: "Return task management analysis with corrections, suggestions and conversation ideas",
              parameters: {
                type: "object",
                properties: {
                  correcoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titulo: { type: "string", description: "Short title of the correction" },
                        descricao: { type: "string", description: "Detailed description" },
                        severidade: { type: "string", enum: ["alta", "media", "baixa"] }
                      },
                      required: ["titulo", "descricao", "severidade"],
                      additionalProperties: false
                    },
                    description: "Issues found in current task flow"
                  },
                  sugestoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titulo: { type: "string", description: "Short title of the suggestion" },
                        descricao: { type: "string", description: "Actionable suggestion" }
                      },
                      required: ["titulo", "descricao"],
                      additionalProperties: false
                    },
                    description: "Process improvement suggestions"
                  },
                  ideias_conversa: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topico: { type: "string", description: "Conversation topic" },
                        abordagem: { type: "string", description: "How to approach the client about this" }
                      },
                      required: ["topico", "abordagem"],
                      additionalProperties: false
                    },
                    description: "Ideas for master to discuss with client"
                  },
                  resumo_geral: { type: "string", description: "One paragraph overall assessment" }
                },
                required: ["correcoes", "sugestoes", "ideias_conversa", "resumo_geral"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_analysis" } }
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let analysis = { correcoes: [], sugestoes: [], ideias_conversa: [], resumo_geral: "Análise indisponível." };
    
    if (toolCall?.function?.arguments) {
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch {
        // keep default
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("task-analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

