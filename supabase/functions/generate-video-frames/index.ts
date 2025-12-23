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
    const { script, niche, platform } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!script || !script.scene1 || !script.scene2 || !script.scene3) {
      throw new Error("Script completo é necessário (scene1, scene2, scene3)");
    }

    console.log("Generating video frames for:", { niche, platform });

    const scenes = [
      { name: "scene1", description: script.scene1 },
      { name: "scene2", description: script.scene2 },
      { name: "scene3", description: script.scene3 }
    ];

    const frames: { [key: string]: string } = {};

    // Generate each scene image
    for (const scene of scenes) {
      console.log(`Generating ${scene.name}:`, scene.description);
      
      const visualPrompt = `Create a high-quality, professional ${platform} ad frame for ${niche} niche.
Scene: ${scene.description}

Style: Modern, clean, engaging, suitable for social media ads.
Format: 9:16 vertical (mobile-first).
Quality: High resolution, professional lighting, cinematic.
No text overlays - just the visual scene.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: visualPrompt
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Limite de requisições excedido. Tente novamente em alguns instantes.");
        }
        if (response.status === 402) {
          throw new Error("Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.");
        }
        const errorText = await response.text();
        console.error(`AI gateway error for ${scene.name}:`, response.status, errorText);
        throw new Error(`Erro ao gerar ${scene.name}`);
      }

      const data = await response.json();
      console.log(`Response for ${scene.name}:`, data);

      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageData) {
        console.error(`No image data in response for ${scene.name}:`, data);
        throw new Error(`Falha ao gerar imagem para ${scene.name}`);
      }

      frames[scene.name] = imageData;
      console.log(`Successfully generated ${scene.name}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("All frames generated successfully");

    return new Response(
      JSON.stringify({ frames }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-video-frames:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar frames" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
