import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio, model } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo 'prompt' é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não está configurada");
    }

    const resolvedAspect =
      aspectRatio === "1:1" || aspectRatio === "4:5" || aspectRatio === "9:16"
        ? aspectRatio
        : "9:16";

    const basePrompt = `Você é um fotógrafo publicitário profissional.
Gere uma imagem de marketing ultra-realista com base no prompt abaixo.
A imagem deve parecer uma foto real (sem desenho ou ilustração).
Formato: vertical ou quadrado para anúncios em redes sociais.
Resolução: equivalente a pelo menos 1080p.
Estilo: fotografia realista, iluminação profissional, tons de pele naturais, proporções corretas.
Proporção: ${resolvedAspect}.

Prompt do usuário (português, descreva sujeito, cenário, clima):
${prompt}`;

    const modelName =
      typeof model === "string" && model.trim().length > 0
        ? model
        : "gemini-2.0-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: basePrompt }],
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
        "Gemini image API error (generate-image-gemini-direct):",
        response.status,
        errorText,
      );

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de requisições da API Gemini excedido. Tente novamente em instantes.",
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
              "A chave da API Gemini é inválida ou não tem permissão para gerar imagens.",
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao chamar a API do Gemini" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    console.log("Gemini image response (generate-image-gemini-direct):", data);

    const inlinePart =
      data?.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData && p.inlineData.data,
      );

    const inlineData = inlinePart?.inlineData;

    if (!inlineData?.data) {
      console.error(
        "Nenhuma imagem inlineData retornada pelo Gemini:",
        JSON.stringify(data),
      );
      return new Response(
        JSON.stringify({
          error:
            "A API do Gemini não retornou dados de imagem. Verifique se o modelo suporta geração de imagem.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const mimeType = inlineData.mimeType || "image/png";
    const base64Data = inlineData.data as string;

    const imageDataUrl = `data:${mimeType};base64,${base64Data}`;

    return new Response(
      JSON.stringify({ image: imageDataUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro em generate-image-gemini-direct:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao gerar imagem com Gemini",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
