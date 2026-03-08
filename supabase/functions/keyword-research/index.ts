const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo, nicho, servicos } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt = '';
    if (termo && termo.trim()) {
      prompt = `Você é um especialista em SEO e pesquisa de palavras-chave do Google para o mercado brasileiro.

O usuário quer pesquisar o termo principal: "${termo}"
${nicho ? `Nicho/setor da empresa: ${nicho}` : ''}
${servicos ? `Serviços/produtos: ${servicos}` : ''}

Faça uma análise completa de palavras-chave relacionadas para SEO. Retorne EXATAMENTE um JSON válido (sem markdown, sem \`\`\`) com a estrutura:
{
  "termo_principal": "${termo}",
  "analise_termo": "breve análise do potencial do termo principal",
  "palavras_chave": [
    {
      "palavra": "palavra-chave",
      "tipo": "head tail | middle tail | long tail",
      "volume_estimado": "alto | médio | baixo",
      "dificuldade": "fácil | média | difícil",
      "intencao": "informacional | transacional | navegacional | comercial",
      "sugestao_uso": "como usar essa palavra no conteúdo"
    }
  ],
  "variacoes_long_tail": ["variação 1", "variação 2", "variação 3"],
  "perguntas_frequentes": ["pergunta 1?", "pergunta 2?", "pergunta 3?"],
  "dicas_seo": ["dica 1", "dica 2", "dica 3"]
}

Retorne entre 8-15 palavras-chave, 5-8 variações long tail e 5-8 perguntas frequentes.`;
    } else {
      prompt = `Você é um especialista em SEO e pesquisa de palavras-chave do Google para o mercado brasileiro.

${nicho ? `Nicho/setor da empresa: ${nicho}` : 'Empresa sem nicho definido'}
${servicos ? `Serviços/produtos: ${servicos}` : ''}

Como nenhum termo específico foi fornecido, sugira as MELHORES palavras-chave para esse nicho/serviço. Retorne EXATAMENTE um JSON válido (sem markdown, sem \`\`\`) com a estrutura:
{
  "termo_principal": "termo sugerido principal",
  "analise_termo": "por que esse termo é ideal para o negócio",
  "palavras_chave": [
    {
      "palavra": "palavra-chave",
      "tipo": "head tail | middle tail | long tail",
      "volume_estimado": "alto | médio | baixo",
      "dificuldade": "fácil | média | difícil",
      "intencao": "informacional | transacional | navegacional | comercial",
      "sugestao_uso": "como usar essa palavra no conteúdo"
    }
  ],
  "variacoes_long_tail": ["variação 1", "variação 2"],
  "perguntas_frequentes": ["pergunta 1?", "pergunta 2?"],
  "dicas_seo": ["dica 1", "dica 2", "dica 3"]
}

Retorne entre 8-15 palavras-chave, 5-8 variações long tail e 5-8 perguntas frequentes.`;
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
          { role: 'system', content: 'Você é um especialista em SEO brasileiro. Sempre responda APENAS com JSON válido, sem markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
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
          JSON.stringify({ success: false, error: 'Créditos insuficientes. Entre em contato com o suporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errText = await response.text();
      console.error('AI Gateway error:', response.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: `AI request failed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Clean markdown wrapping if present
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao processar resposta da IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
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
