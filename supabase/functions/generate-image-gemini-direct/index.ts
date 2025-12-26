import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { prompt, aspectRatio } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo 'prompt' é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não está configurada");
    }

    // Mapear aspect ratio para os tamanhos suportados pelo gpt-image-1
    // gpt-image-1 suporta: 1024x1024, 1536x1024, 1024x1536
    let size = "1024x1536"; // padrão vertical
    const ratio = typeof aspectRatio === "string" ? aspectRatio : "9:16";

    if (ratio === "1:1") {
      size = "1024x1024";
    } else if (ratio === "16:9") {
      size = "1536x1024";
    } else if (ratio === "9:16") {
      size = "1024x1536";
    }

    const basePrompt = `Você é um fotógrafo publicitário profissional.
Gere uma imagem de marketing ultra-realista com base no prompt abaixo.
A imagem deve parecer uma foto real (sem desenho ou ilustração).
Formato: vertical ou quadrado para anúncios em redes sociais.
Resolução: equivalente a pelo menos 1080p.
Estilo: fotografia realista, iluminação profissional, tons de pele naturais, proporções corretas.
Proporção aproximada: ${ratio}.

Prompt do usuário (português, descreva sujeito, cenário, clima):
${prompt}`;

    const url = "https://api.openai.com/v1/images/generations";

    const body = {
      model: "gpt-image-1",
      prompt: basePrompt,
      n: 1,
      size,
      // gpt-image-1 já retorna base64 por padrão; não utilizar response_format
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "OpenAI image API error (generate-image-gemini-direct -> gpt-image-1):",
        response.status,
        errorText,
      );

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de requisições da API de imagens foi excedido. Tente novamente em instantes.",
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
              "A chave da API de imagens é inválida ou não tem permissão para gerar imagens.",
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao chamar a API de imagens" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    console.log(
      "OpenAI image response (generate-image-gemini-direct -> gpt-image-1):",
      data,
    );

    const first = data?.data?.[0];
    const base64Data = first?.b64_json as string | undefined;

    if (!base64Data) {
      console.error(
        "Nenhuma imagem base64 retornada pela API de imagens:",
        JSON.stringify(data),
      );
      return new Response(
        JSON.stringify({
          error:
            "A API de imagens não retornou dados de imagem. Verifique se o modelo suporta geração de imagem.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const mimeType = "image/png";
    const imageDataUrl = `data:${mimeType};base64,${base64Data}`;

    return new Response(
      JSON.stringify({ image: imageDataUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro em generate-image-gemini-direct (gpt-image-1):", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao gerar imagem com a API de imagens",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
