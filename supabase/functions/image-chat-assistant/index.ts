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

    if (!Array.isArray(messages)) {
      throw new Error("Campo 'messages' é obrigatório e deve ser um array");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Descobre se a IA já respondeu alguma vez neste chat
    const hasPreviousAssistantReply = messages.some((m: any) => m.role === "assistant");

    const baseSystemPrompt =
      "Você é um assistente de imagens que funciona em modo de chat contínuo.\n\n" +
      "REGRAS DE INTERFACE (CRÍTICAS):\n" +
      "- Na PRIMEIRA resposta após qualquer mensagem do usuário, você DEVE começar a mensagem com o comando exato, em uma linha separada: [UI_MODE:CHAT]\n" +
      "- Esse comando serve apenas para a interface e NUNCA deve ser explicado, comentado ou descrito para o usuário.\n" +
      "- O comando [UI_MODE:CHAT] deve aparecer apenas UMA vez, na sua primeira resposta nesse chat. Depois disso, NUNCA repita esse comando.\n\n" +
      "COMPORTAMENTO DE CONVERSA (IMPORTANTE):\n" +
      "- Você PODE fazer no máximo UMA rodada de perguntas curtas para entender o contexto antes de gerar a imagem.\n" +
      "- Depois dessa primeira rodada, você NÃO PODE mais fazer novas perguntas. Use o que já tem para decidir e gerar a imagem.\n" +
      "- Nunca peça para o usuário ‘escrever um prompt’, apenas faça perguntas naturais.\n" +
      "- Nunca reinicie a conversa por conta própria e nunca mude o modo de interação.\n" +
      "- Responda SEMPRE em português do Brasil.\n\n" +
      "OBJETIVO DA ASSISTENTE:\n" +
      "- Você é especialista em criativos de performance (Meta Ads, TikTok, Reels, Instagram) e ajuda a definir e refinar imagens ultra realistas para anúncios.\n" +
      "- Quando o pedido estiver vago, faça perguntas curtas sobre: negócio/produto, público, objetivo da campanha, plataforma/formato, estilo visual.\n" +
      "- Quando tiver informações suficientes, explique rapidamente o que vai gerar e use a ferramenta decide_image_generation com um final_prompt muito detalhado (quem aparece, cenário, luz, emoção, enquadramento, estilo, plataforma, ângulo de marketing etc.).\n\n" +
      "FORMATO DA PRIMEIRA RESPOSTA:\n" +
      "- Na sua primeira resposta, a estrutura deve ser exatamente:\n[UI_MODE:CHAT]\n<linha em branco>\n<sua resposta em formato de conversa>.";

    // Mensagem extra para reforçar o comportamento quando já houve uma resposta anterior
    const followupBehaviorPrompt = hasPreviousAssistantReply
      ? "Atenção: já existe ao menos uma resposta SUA (assistant) no histórico desta conversa. A partir de agora você NÃO PODE mais fazer novas perguntas.\n" +
        "Use obrigatoriamente a ferramenta decide_image_generation, com ready=true e um final_prompt completo baseado em tudo que já foi conversado.\n" +
        "Na mensagem para o usuário, seja breve: explique em 1–2 frases o conceito da imagem que será gerada."
      : "Você ainda não respondeu nada nesta conversa. Você PODE fazer UMA rodada de perguntas curtas para clarificar o contexto ANTES de decidir gerar a imagem. Depois disso, não faça mais perguntas adicionais, apenas decida e gere.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: baseSystemPrompt,
          },
          {
            role: "system",
            content: followupBehaviorPrompt,
          },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "decide_image_generation",
              description:
                "Use quando você já tiver detalhes suficientes para gerar uma imagem realista e pronta para anúncio.",
              parameters: {
                type: "object",
                properties: {
                  ready: {
                    type: "boolean",
                    description:
                      "Se true, significa que já temos informações suficientes para gerar a imagem.",
                  },
                  final_prompt: {
                    type: "string",
                    description:
                      "Prompt completo, claro e detalhado descrevendo a imagem a ser gerada (personas, cenário, iluminação, estilo, emoção, enquadramento). Obrigatório quando ready = true.",
                  },
                },
                required: ["ready"],
                additionalProperties: false,
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Limite de requisições de IA excedido. Tente novamente em alguns instantes.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Créditos de IA insuficientes. Adicione créditos em Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const errorText = await response.text();
      console.error("AI gateway error (image-chat-assistant):", response.status, errorText);
      throw new Error("Erro ao conversar com a IA de imagem");
    }

    const data = await response.json();
    console.log("image-chat-assistant raw response:", data);

    const choice = data?.choices?.[0];
    const message = choice?.message ?? {};

    let assistantText = "";
    const content: any = message.content;
    if (typeof content === "string") {
      assistantText = content;
    } else if (Array.isArray(content)) {
      assistantText = content
        .map((c) => (typeof c === "string" ? c : c?.text ?? ""))
        .join("");
    }

    let ready = false;
    let finalPrompt: string | null = null;

    const toolCalls = (message as any).tool_calls as
      | Array<{ function?: { arguments?: string } }>
      | undefined;

    if (toolCalls && toolCalls.length > 0) {
      const argsString = toolCalls[0]?.function?.arguments;
      if (argsString) {
        try {
          const parsed = JSON.parse(argsString);
          if (typeof parsed.ready === "boolean") {
            ready = parsed.ready;
          }
          if (parsed.final_prompt && typeof parsed.final_prompt === "string") {
            finalPrompt = parsed.final_prompt;
          }
        } catch (err) {
          console.error("Erro ao parsear argumentos da ferramenta:", err);
        }
      }
    }

    if (!assistantText) {
      assistantText =
        "Não tenho certeza se entendi. Pode explicar com um pouco mais de detalhe o tipo de imagem que você quer?";
    }

    // Garante que SEMPRE haja o marcador de modo de interface apenas na primeira resposta
    if (!assistantText.includes("[UI_MODE:CHAT]") && !hasPreviousAssistantReply) {
      assistantText = `[UI_MODE:CHAT]\n\n${assistantText}`;
    }

    return new Response(
      JSON.stringify({
        reply: assistantText,
        ready,
        finalPrompt,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in image-chat-assistant:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao conversar com a IA de imagem",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
