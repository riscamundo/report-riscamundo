import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_PROMPT_MASTER = `Você é o Agente Riscamundo, o assistente estratégico da agência Riscamundo.

Modo MASTER ADMIN: Você tem visão 360° de TODOS os tenants/clientes da agência.
- Faça um apanhado geral de todos os acontecimentos de todos os tenants
- Alerte por importância e urgência (🔴 Urgente, 🟡 Atenção, 🟢 OK)
- Priorize problemas críticos: conexões caídas, cobranças atrasadas, campanhas com baixo ROI
- Sugira ações imediatas para resolver pendências
- Responda em português brasileiro com tom profissional e direto.`;

const FALLBACK_PROMPT_TENANT = `Você é o Agente Riscamundo, o assistente exclusivo deste cliente.

REGRA FUNDAMENTAL: Você SOMENTE deve trabalhar com dados INDIVIDUAIS deste tenant/cliente específico.
- NUNCA mencione dados de outros clientes
- NUNCA compare com outros tenants
- NUNCA revele informações de outros clientes
- Foque exclusivamente nos dados deste cliente: campanhas, SEO, vendas, tarefas, anúncios
- Responda em português brasileiro com tom acolhedor e profissional.
- Assine como "Equipe Riscamundo".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, saveConversation, isMaster, clienteId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load system prompt from DB (for master customization)
    let systemPrompt = isMaster ? FALLBACK_PROMPT_MASTER : FALLBACK_PROMPT_TENANT;
    const { data: configData } = await supabase
      .from("maestro_config")
      .select("system_prompt")
      .limit(1)
      .single();
    if (configData?.system_prompt && isMaster) {
      systemPrompt = configData.system_prompt;
    }

    // Build context based on role
    let dataContext = "";

    if (isMaster) {
      // Master: load summary of ALL tenants
      const { data: clientes } = await supabase
        .from("clientes")
        .select("id, nome, status, email, mensalidade_valor")
        .order("nome");
      
      if (clientes && clientes.length > 0) {
        const clienteIds = clientes.map((c: any) => c.id);
        
        const [connectionsRes, financeiroRes, tarefasRes, anunciosRes] = await Promise.all([
          supabase.from("tenant_connections").select("cliente_id, servico, status, respostas_pendentes").in("cliente_id", clienteIds),
          supabase.from("financeiro").select("cliente_id, status, valor, data_vencimento").in("cliente_id", clienteIds).eq("status", "pendente"),
          supabase.from("tarefas_cliente").select("cliente_id, titulo, status, prioridade").in("cliente_id", clienteIds).neq("status", "concluido"),
          supabase.from("anuncios").select("cliente_id, titulo, status, plataforma, investimento, conversoes").in("cliente_id", clienteIds).eq("status", "ativo"),
        ]);

        dataContext = "\n\n━━━ DADOS DE TODOS OS TENANTS ━━━\n";
        for (const cliente of clientes) {
          const c = cliente as any;
          const conns = (connectionsRes.data || []).filter((x: any) => x.cliente_id === c.id);
          const bills = (financeiroRes.data || []).filter((x: any) => x.cliente_id === c.id);
          const tasks = (tarefasRes.data || []).filter((x: any) => x.cliente_id === c.id);
          const ads = (anunciosRes.data || []).filter((x: any) => x.cliente_id === c.id);
          
          dataContext += `\n📋 ${c.nome} (${c.status}):\n`;
          if (conns.length > 0) {
            dataContext += `  Conexões: ${conns.map((x: any) => `${x.servico}:${x.status}${x.respostas_pendentes ? ` (${x.respostas_pendentes} pendentes)` : ''}`).join(', ')}\n`;
          }
          if (bills.length > 0) {
            dataContext += `  💰 Cobranças pendentes: ${bills.length} (R$ ${bills.reduce((s: number, b: any) => s + Number(b.valor), 0).toFixed(2)})\n`;
          }
          if (tasks.length > 0) {
            const urgentes = tasks.filter((t: any) => t.prioridade === 'alta');
            dataContext += `  📝 Tarefas abertas: ${tasks.length}${urgentes.length > 0 ? ` (${urgentes.length} urgentes)` : ''}\n`;
          }
          if (ads.length > 0) {
            dataContext += `  📢 Anúncios ativos: ${ads.length} (R$ ${ads.reduce((s: number, a: any) => s + Number(a.investimento), 0).toFixed(2)} investidos)\n`;
          }
        }
      }
    } else if (clienteId) {
      // Tenant: load ONLY this client's data
      const [mktRes, kwRes, tarefasRes, anunciosRes, vendasRes, connRes] = await Promise.all([
        supabase.from("marketing_reports").select("*").eq("cliente_id", clienteId).order("periodo_mes", { ascending: false }).limit(3),
        supabase.from("seo_keywords").select("palavra_chave, posicao_atual, volume_busca").eq("cliente_id", clienteId).limit(20),
        supabase.from("tarefas_cliente").select("titulo, status, prioridade").eq("cliente_id", clienteId).neq("status", "concluido"),
        supabase.from("anuncios").select("titulo, plataforma, status, investimento, cliques, conversoes").eq("cliente_id", clienteId).eq("status", "ativo"),
        supabase.from("vendas").select("valor_venda, status, data_venda").limit(20),
        supabase.from("tenant_connections").select("servico, status").eq("cliente_id", clienteId),
      ]);

      dataContext = "\n\n━━━ SEUS DADOS ━━━\n";
      
      if (mktRes.data && mktRes.data.length > 0) {
        const latest = mktRes.data[0] as any;
        dataContext += `\n📊 Marketing (último mês): ${latest.visitas_site || 0} visitas, ${latest.leads_gerados || 0} leads, ${latest.visitas_organicas || 0} orgânicas\n`;
      }
      if (kwRes.data && kwRes.data.length > 0) {
        dataContext += `\n🔍 SEO: ${kwRes.data.length} palavras-chave monitoradas\n`;
        const top5 = kwRes.data.slice(0, 5) as any[];
        top5.forEach((k: any) => { dataContext += `  - "${k.palavra_chave}" pos.${k.posicao_atual || '?'} (vol: ${k.volume_busca})\n`; });
      }
      if (tarefasRes.data && tarefasRes.data.length > 0) {
        dataContext += `\n📝 Tarefas abertas: ${tarefasRes.data.length}\n`;
        (tarefasRes.data as any[]).forEach((t: any) => { dataContext += `  - [${t.prioridade}] ${t.titulo} (${t.status})\n`; });
      }
      if (anunciosRes.data && anunciosRes.data.length > 0) {
        dataContext += `\n📢 Anúncios ativos: ${anunciosRes.data.length}\n`;
        (anunciosRes.data as any[]).forEach((a: any) => { dataContext += `  - ${a.titulo} (${a.plataforma}) R$${a.investimento}\n`; });
      }
      if (connRes.data && connRes.data.length > 0) {
        dataContext += `\n🔗 Conexões: ${(connRes.data as any[]).map((c: any) => `${c.servico}:${c.status}`).join(', ')}\n`;
      }
    }

    // Load recent conversations as knowledge base context (master only)
    let knowledgeContext = "";
    if (isMaster) {
      const { data: recentConvos } = await supabase
        .from("maestro_conversations")
        .select("pergunta, resposta")
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentConvos && recentConvos.length > 0) {
        knowledgeContext = "\n\n━━━ BASE DE CONHECIMENTO ━━━\n";
        knowledgeContext += recentConvos
          .reverse()
          .map((c: any) => `P: ${c.pergunta}\nR: ${c.resposta}`)
          .join("\n---\n");
      }
    }

    const fullPrompt = systemPrompt + dataContext + knowledgeContext;

    // If this is a save-only request
    if (saveConversation) {
      const { pergunta, resposta, contexto } = saveConversation;
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