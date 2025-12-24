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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não está configurada");
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
      "- Quando tiver informações suficientes, explique rapidamente o que vai gerar.\n\n" +
      "FORMATO DE SAÍDA (CRÍTICO):\n" +
      "Você DEVE responder APENAS com um JSON válido, sem nenhum texto antes ou depois. O formato EXATO é:\n" +
      "{\n" +
      "  \"assistant_reply\": \"mensagem em formato de chat para o usuário, em português\",\n" +
      "  \"ready\": true ou false,\n" +
      "  \"final_prompt\": \"prompt ultra detalhado para gerar a imagem, ou string vazia se ready=false\"\n" +
      "}\n\n" +
      "NUNCA inclua comentários, explicações ou texto fora do JSON.\n";

    const followupBehaviorPrompt = hasPreviousAssistantReply
      ? "Atenção: já existe ao menos uma resposta SUA (assistant) no histórico desta conversa. A partir de agora você NÃO PODE mais fazer novas perguntas. Use as mensagens já existentes para decidir se está pronto para gerar a imagem (ready=true) e, se sim, produza um final_prompt completo."
      : "Você ainda não respondeu nada nesta conversa. Você PODE fazer UMA rodada de perguntas curtas para clarificar o contexto ANTES de decidir gerar a imagem (ready=true). Depois disso, não faça mais perguntas adicionais, apenas decida e gere.";

    // Constrói um resumo textual da conversa para enviar ao Gemini
    const conversationText = messages
      .map((m: any) => {
        const role = m.role === "assistant" ? "Assistente" : "Usuário";
        const content = (m.content ?? "").toString();
        return `${role}: ${content}`;
      })
      .join("\n");

    const fullPrompt = `${baseSystemPrompt}\n\nCONTEXTO ADICIONAL SOBRE O COMPORTAMENTO:\n${followupBehaviorPrompt}\n\nHISTÓRICO DE CONVERSA ATÉ AGORA:\n${conversationText}\n\nLembre-se: responda APENAS com o JSON no formato especificado.`;

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" +
      `?key=${GEMINI_API_KEY}`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Gemini error (image-chat-assistant):",
        response.status,
        errorText,
      );

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de requisições da API Gemini excedido. Tente novamente em alguns instantes.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({
            error:
              "A chave da API Gemini é inválida ou não tem permissão para este modelo.",
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw new Error("Erro ao conversar com a API do Gemini");
    }

    const data = await response.json();
    console.log("image-chat-assistant Gemini response:", data);

    const firstCandidate = data?.candidates?.[0];
    const parts = firstCandidate?.content?.parts ?? [];
    const textPart = parts.find((p: any) => typeof p.text === "string");
    const rawText: string = textPart?.text ?? "";

    let assistant_reply = "";
    let ready = false;
    let final_prompt: string | null = null;

    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed.assistant_reply === "string") {
        assistant_reply = parsed.assistant_reply;
      }
      if (typeof parsed.ready === "boolean") {
        ready = parsed.ready;
      }
      if (typeof parsed.final_prompt === "string" && parsed.final_prompt.trim().length > 0) {
        final_prompt = parsed.final_prompt;
      }
    } catch (err) {
      console.error("Falha ao parsear JSON do Gemini em image-chat-assistant:", err, rawText);
      assistant_reply = rawText ||
        "Não tenho certeza se entendi. Pode explicar com um pouco mais de detalhe o tipo de imagem que você quer?";
      ready = false;
      final_prompt = null;
    }

    if (!assistant_reply) {
      assistant_reply =
        "Não tenho certeza se entendi. Pode explicar com um pouco mais de detalhe o tipo de imagem que você quer?";
    }

    // Garante que SEMPRE haja o marcador de modo de interface apenas na primeira resposta
    if (!assistant_reply.includes("[UI_MODE:CHAT]") && !hasPreviousAssistantReply) {
      assistant_reply = `[UI_MODE:CHAT]\n\n${assistant_reply}`;
    }

    return new Response(
      JSON.stringify({
        reply: assistant_reply,
        ready,
        finalPrompt: final_prompt,
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
