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

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content:
                "Você é um assistente especialista em criativos de performance (Meta Ads, TikTok, Reels) que ajuda a lapidar prompts de imagem ultra realistas em português. Sempre que alguém pedir uma imagem:\n- Responda em tom direto, amigável e profissional.\n- Priorize anúncios realistas em estilo lifestyle/UGC, com pessoas reais, cenário crível e foco em performance.\n- Quando o pedido estiver vago, faça até 3 perguntas objetivas para clarear: tipo de negócio/produto, público-alvo, objetivo da campanha (captar leads, vender, awareness), plataforma/formato (feed, stories/reels, criativo estático), emoção/ângulo principal (prova social, oportunidade, dor, desejo).\n- Estruture suas respostas em frases curtas ou bullets, sem parágrafos muito longos.\n- Quando tiver informações suficientes para gerar um criativo forte, use a ferramenta decide_image_generation com ready = true e final_prompt detalhando claramente: quem aparece, onde está, o que está fazendo, qual emoção, estilo de luz, enquadramento e contexto de anúncio.",
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
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de requisições de IA excedido. Tente novamente em alguns instantes.",
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

    const toolCalls = message.tool_calls as
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
