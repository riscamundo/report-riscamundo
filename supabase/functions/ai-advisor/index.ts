import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_PROMPT = "Você é o Maestro BI, um assistente especialista em marketing, vendas e crescimento empresarial. Responda em português brasileiro.";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, saveConversation } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load system prompt from DB
    let systemPrompt = FALLBACK_PROMPT;
    const { data: configData } = await supabase
      .from("maestro_config")
      .select("system_prompt")
      .limit(1)
      .single();
    if (configData?.system_prompt) {
      systemPrompt = configData.system_prompt;
    }

    // Load recent conversations as knowledge base context
    const { data: recentConvos } = await supabase
      .from("maestro_conversations")
      .select("pergunta, resposta")
      .order("created_at", { ascending: false })
      .limit(20);

    let knowledgeContext = "";
    if (recentConvos && recentConvos.length > 0) {
      knowledgeContext = "\n\n━━━━━━━━━━━━━━━━━━━━━━\nBASE DE CONHECIMENTO (conversas anteriores)\n━━━━━━━━━━━━━━━━━━━━━━\n";
      knowledgeContext += recentConvos
        .reverse()
        .map((c: any) => `P: ${c.pergunta}\nR: ${c.resposta}`)
        .join("\n---\n");
      knowledgeContext += "\n\nUse essas conversas anteriores como contexto para dar respostas mais consistentes e alinhadas com decisões já tomadas.";
    }

    const fullPrompt = systemPrompt + knowledgeContext;

    // If this is a save-only request (to archive a conversation)
    if (saveConversation) {
      const { pergunta, resposta, contexto } = saveConversation;
      // Extract user from auth header
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      await supabase.from("maestro_conversations").insert({
        pergunta,
        resposta,
        contexto: contexto || null,
        created_by: user?.id || null,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
            { role: "system", content: fullPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro no serviço de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-advisor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
