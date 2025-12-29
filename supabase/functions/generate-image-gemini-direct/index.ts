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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não está configurada");
    }

    // Ajustar instruções de proporção para o modelo de imagem do Gemini
    const ratio = typeof aspectRatio === "string" ? aspectRatio : "9:16";

    let ratioInstruction = "Proporção vertical, ideal para stories e reels.";
    if (ratio === "1:1") {
      ratioInstruction = "Proporção quadrada, ideal para feed de redes sociais.";
    } else if (ratio === "16:9") {
      ratioInstruction = "Proporção horizontal, ideal para banners e vídeos.";
    }

    const basePrompt = `Você é um fotógrafo publicitário profissional.
Gere uma imagem de marketing ultra-realista com base no prompt abaixo.
A imagem deve parecer uma foto real (sem desenho ou ilustração).
Formato: adequado para anúncios em redes sociais.
Resolução: equivalente a pelo menos 1080p.
Estilo: fotografia realista, iluminação profissional, tons de pele naturais, proporções corretas.
${ratioInstruction}

Prompt do usuário (português, descreva sujeito, cenário, clima):
${prompt}`;

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" +
      encodeURIComponent(GEMINI_API_KEY);

    const body = {
      contents: [
        {
          parts: [
            {
              text: basePrompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: ratio,
        },
      },
    } as unknown as Record<string, unknown>;

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
        "Gemini image API error (generate-image-gemini-direct -> gemini-2.5-flash):",
        response.status,
        errorText,
      );

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de requisições da API do Google Gemini foi excedido. Tente novamente em instantes.",
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
              "A chave da API Google Gemini é inválida ou não tem permissão para gerar imagens.",
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
      "Gemini image response (generate-image-gemini-direct -> gemini-2.5-flash):",
      data,
    );

    // A estrutura exata da resposta depende da configuração do modelo.
    // Procuramos pela primeira ocorrência de dado de imagem em base64.
    let base64Data: string | undefined;

    try {
      const candidates = (data as any)?.candidates ?? [];
      for (const candidate of candidates) {
        const parts = candidate?.content?.parts ?? [];
        for (const part of parts) {
          if (typeof part?.inlineData?.data === "string") {
            base64Data = part.inlineData.data;
            break;
          }
          if (typeof part?.fileData?.data === "string") {
            base64Data = part.fileData.data;
            break;
          }
        }
        if (base64Data) break;
      }
    } catch (e) {
      console.error("Erro ao extrair imagem em base64 da resposta do Gemini:", e);
    }

    if (!base64Data) {
      console.error(
        "Nenhuma imagem base64 retornada pela API Gemini:",
        JSON.stringify(data),
      );
      return new Response(
        JSON.stringify({
          error:
            "A API Google Gemini não retornou dados de imagem. Verifique se o modelo suporta geração de imagem.",
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
    console.error("Erro em generate-image-gemini-direct (Gemini):", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao gerar imagem com a API Google Gemini",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
