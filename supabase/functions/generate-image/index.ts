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
      throw new Error("Prompt é obrigatório");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const resolvedAspect =
      aspectRatio === "1:1" || aspectRatio === "4:5" || aspectRatio === "9:16"
        ? aspectRatio
        : "9:16";

    const basePrompt = `You are a professional commercial photographer.
Generate an ultra-realistic, high-resolution marketing image strictly based on the following user prompt.
The image must look like a real photo (no cartoon, no illustration).
Format: vertical or square for social media ads.
Resolution: at least 1080p equivalent.
Style: realistic photography, professional lighting, natural skin tones, correct proportions.
Aspect ratio: ${resolvedAspect}.

User prompt (Portuguese, describe subject, setting, mood):
${prompt}`;

    async function generateVariant(variant: "natural" | "corporate") {
      const styleHint =
        variant === "natural"
          ? "Style: natural, lifestyle, user-generated content, candid moment, everyday context."
          : "Style: professional, corporate, clean composition, suitable for paid ads and landing pages.";

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: `${basePrompt}\n\n${styleHint}`,
              },
            ],
            modalities: ["image", "text"],
          }),
        },
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Limite de requisições excedido. Tente novamente em alguns instantes.",
          );
        }
        if (response.status === 402) {
          throw new Error(
            "Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.",
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error (generate-image):", response.status, errorText);
        throw new Error("Erro ao gerar imagem");
      }

      const data = await response.json();
      console.log("generate-image response (", variant, "):", data);

      const imageData = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageData) {
        console.error("No image data in response for variant", variant, data);
        throw new Error("Falha ao gerar imagem");
      }

      return imageData as string;
    }

    const [naturalImage, corporateImage] = await Promise.all([
      generateVariant("natural"),
      generateVariant("corporate"),
    ]);

    return new Response(
      JSON.stringify({
        images: {
          natural: naturalImage,
          corporate: corporateImage,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-image:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "Erro desconhecido ao gerar imagem",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
