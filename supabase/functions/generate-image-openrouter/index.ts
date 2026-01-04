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
    const { prompt, aspectRatio } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt é obrigatório e deve ser uma string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
 
    if (!OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY não está configurada");
      return new Response(
        JSON.stringify({ error: "Chave da API OpenRouter não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
 
    console.log(`[generate-image-openrouter] Gerando imagem com prompt: "${prompt.substring(0, 50)}..."`);
 
    // Usar OpenRouter para gerar imagem com modelo sourceful/riverflow-v2-standard-preview
    const imageResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sourceful/riverflow-v2-standard-preview",
          messages: [
            {
              role: "user",
              content: `Generate a professional marketing image with the following description: ${prompt}. Make it ultra-realistic, high quality, 8K resolution.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error(`[generate-image-openrouter] Erro ao gerar imagem (${imageResponse.status}): ${errorText}`);

      if (imageResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições da API de imagens foi excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (imageResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos da Lovable AI esgotados. Recarregue sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao gerar imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await imageResponse.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("[generate-image-openrouter] Resposta não contém imagem:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "A API não retornou uma imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-image-openrouter] Imagem gerada com sucesso");

    return new Response(
      JSON.stringify({ image: imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[generate-image-openrouter] Erro inesperado:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
