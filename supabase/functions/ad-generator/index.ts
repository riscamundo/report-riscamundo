import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { plataforma, tipo_anuncio, segmento, produto, objetivo, palavras_chave_atuais } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const platformSpecs: Record<string, string> = {
      google: `Google Ads (${tipo_anuncio || 'Search'}). Respeite limites: título até 30 chars (máx 15 títulos), descrição até 90 chars (máx 4 descrições). Inclua palavras-chave de cauda longa, extensões de sitelinks, e CTA forte. Considere Quality Score e Ad Rank.`,
      meta: `Meta Ads (${tipo_anuncio || 'Image'}). Crie copy para Facebook/Instagram. Texto principal até 125 chars, título até 40 chars. Sugira formato visual, gancho emocional, e CTA. Considere públicos lookalike e retargeting.`,
      linkedin: `LinkedIn Ads (${tipo_anuncio || 'Sponsored Content'}). Tom profissional B2B. Título até 70 chars, descrição até 150 chars. Foque em autoridade, cases, e geração de leads qualificados. Sugira segmentação por cargo/setor.`,
      tiktok: `TikTok Ads (${tipo_anuncio || 'In-Feed'}). Tom jovem e autêntico. Sugira hooks nos primeiros 3 segundos, tendências atuais, e CTAs naturais. Formato vertical 9:16. Considere UGC e spark ads.`,
    };

    const systemPrompt = `Você é um especialista em mídia paga e performance digital com 10+ anos de experiência.
Gere sugestões completas de anúncios para a plataforma especificada.

Para cada sugestão, forneça:
1. Títulos variados (3-5 opções)
2. Descrições/copy (2-3 opções)
3. Palavras-chave recomendadas (10-15, incluindo negativas)
4. Público-alvo sugerido
5. Estimativa de CPC médio do segmento
6. Dicas de otimização específicas da plataforma
7. Volumes estimados de busca dos termos principais

Responda SEMPRE em português brasileiro.`;

    const userPrompt = `Plataforma: ${platformSpecs[plataforma] || platformSpecs.google}
Segmento/Nicho: ${segmento || 'Não especificado'}
Produto/Serviço: ${produto || 'Não especificado'}
Objetivo da campanha: ${objetivo || 'Conversão'}
Palavras-chave atuais: ${palavras_chave_atuais?.join(', ') || 'Nenhuma'}

Gere 3 variações completas de anúncios otimizados para esta plataforma.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar sugestões" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ success: true, suggestions: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ad-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
