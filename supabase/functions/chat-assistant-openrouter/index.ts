import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    if (!OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY não está configurada");
      return new Response(
        JSON.stringify({ error: "Chave da API OpenRouter não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[chat-assistant-openrouter] Recebidas ${messages.length} mensagens`);

    // Construir prompt do sistema
    const isFirstAssistantReply = !messages.some((m: any) => m.role === "assistant");

    const systemPrompt = `You are an AI image generation assistant. Your role is to help users refine their image prompts to create stunning, professional images.

## Interface Rules
${isFirstAssistantReply ? "- YOU MUST START YOUR FIRST REPLY WITH EXACTLY: [UI_MODE:CHAT]" : ""}
- NEVER include [UI_MODE:CHAT] in subsequent messages
- Keep responses concise and helpful
- Ask ONE clarifying question at a time
- Suggest improvements to make prompts more specific

## Conversational Behavior
1. When user gives vague prompt: Ask for ONE specific detail (style, mood, or subject detail)
2. When prompt is detailed enough: Confirm you're ready and show the final prompt
3. Always be encouraging and creative
4. Keep responses short (2-3 sentences max)

## Output Format
When prompt is ready for image generation, respond with:
READY_TO_GENERATE: true
FINAL_PROMPT: [the refined prompt here]

Otherwise just chat normally to refine the prompt.`;

    // Chamar OpenRouter
    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lovable.dev",
          "X-Title": "Lovable Image Assistant",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-nano-12b-v2-vl:free",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error(`[chat-assistant-openrouter] Erro da API OpenRouter (${openRouterResponse.status}): ${errorText}`);

      if (openRouterResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições da API OpenRouter excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (openRouterResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos da OpenRouter esgotados. Recarregue sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao chamar a API OpenRouter" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await openRouterResponse.json();
    console.log("[chat-assistant-openrouter] Resposta recebida da OpenRouter");

    let assistantReply = data.choices?.[0]?.message?.content || "";

    // Adicionar [UI_MODE:CHAT] se for a primeira resposta do assistente
    if (isFirstAssistantReply && !assistantReply.includes("[UI_MODE:CHAT]")) {
      assistantReply = `[UI_MODE:CHAT]\n${assistantReply}`;
    }

    // Verificar se está pronto para gerar imagem
    const isReady = assistantReply.includes("READY_TO_GENERATE: true");
    let finalPrompt = "";

    if (isReady) {
      const match = assistantReply.match(/FINAL_PROMPT:\s*(.+)/);
      if (match) {
        finalPrompt = match[1].trim();
      }
    }

    return new Response(
      JSON.stringify({
        reply: assistantReply,
        ready: isReady,
        finalPrompt: finalPrompt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[chat-assistant-openrouter] Erro inesperado:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
