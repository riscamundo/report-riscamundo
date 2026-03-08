const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { palavra_chave, nicho } = await req.json();

    if (!palavra_chave?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Palavra-chave é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em SEO do mercado brasileiro. Responda APENAS com o JSON solicitado, sem markdown.'
          },
          {
            role: 'user',
            content: `Analise a palavra-chave "${palavra_chave}" ${nicho ? `no nicho de ${nicho}` : ''} para o mercado brasileiro do Google.

Estime os seguintes dados com base no seu conhecimento de SEO:
- posicao_estimada: número inteiro de 1 a 100 representando a posição estimada típica para um site novo competindo por essa palavra-chave
- volume_busca: número inteiro estimado de buscas mensais no Brasil
- dificuldade: "facil", "media" ou "dificil" baseado na competitividade

Retorne EXATAMENTE este JSON:
{"posicao_estimada": 0, "volume_busca": 0, "dificuldade": "media"}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Créditos insuficientes.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errText = await response.text();
      console.error('AI Gateway error:', response.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro na IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('Failed to parse:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao processar resposta da IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          posicao_estimada: parsed.posicao_estimada || 50,
          volume_busca: parsed.volume_busca || 0,
          dificuldade: ['facil', 'media', 'dificil'].includes(parsed.dificuldade) ? parsed.dificuldade : 'media',
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
