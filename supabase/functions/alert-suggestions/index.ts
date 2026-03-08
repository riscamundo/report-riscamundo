import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { alertType, alertMessage, metrics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Você é um consultor de negócios especializado em clínicas de estética. 
Dada uma situação de alerta, forneça 2-3 sugestões práticas e acionáveis em português brasileiro.
Responda em formato JSON: { "sugestoes": ["sugestão 1", "sugestão 2", "sugestão 3"] }
Seja direto, conciso (max 1 linha por sugestão) e prático.`
          },
          {
            role: "user",
            content: `Alerta: ${alertMessage}\nTipo: ${alertType}\nMétricas atuais: ${JSON.stringify(metrics || {})}\n\nDê sugestões práticas para resolver.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_suggestions",
              description: "Return actionable suggestions for the alert",
              parameters: {
                type: "object",
                properties: {
                  sugestoes: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 practical suggestions"
                  }
                },
                required: ["sugestoes"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_suggestions" } }
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
    let sugestoes: string[] = [];
    
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        sugestoes = parsed.sugestoes || [];
      } catch {
        sugestoes = ["Analise as métricas em detalhe e ajuste a estratégia"];
      }
    }

    return new Response(JSON.stringify({ sugestoes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("alert-suggestions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
