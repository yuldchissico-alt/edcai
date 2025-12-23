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
    const { niche, platform, objective, productName, targetAudience, mainBenefit } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating ad for:", { niche, platform, objective, productName });

    const systemPrompt = `Você é um especialista em copywriting e anúncios digitais de alta conversão para ${platform}.
Seu objetivo é criar anúncios de ${objective === 'leads' ? 'geração de leads' : 'venda direta'} no nicho de ${niche}.

Retorne SEMPRE um JSON válido com esta estrutura exata:
{
  "hook": "Frase de abertura ultra impactante (máx 15 palavras)",
  "script": {
    "scene1": "Descrição primeira cena: problema/dor principal",
    "scene2": "Descrição segunda cena: solução/transformação",
    "scene3": "Descrição terceira cena: prova/resultado"
  },
  "caption": "Legenda completa do post (5-8 linhas, com emojis estratégicos)",
  "cta": "Call-to-action direto e urgente"
}

REGRAS CRÍTICAS:
- Hook deve gerar CURIOSIDADE ou DOR imediata
- Script visual: cada cena máx 10 palavras descritivas
- Caption: storytelling + benefício + urgência
- CTA: ação clara + motivo de urgência
- Use linguagem do público ${targetAudience}
- Foque no benefício: ${mainBenefit}`;

    const userPrompt = `Crie um anúncio para ${platform} no nicho de ${niche}.

Produto/Oferta: ${productName}
Público-alvo: ${targetAudience}
Benefício principal: ${mainBenefit}
Objetivo: ${objective === 'leads' ? 'capturar leads qualificados' : 'gerar vendas imediatas'}

Retorne APENAS o JSON, sem texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar anúncio. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from AI response
    let adContent;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      adContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Formato de resposta inválido da IA");
    }

    // Validate structure
    if (!adContent.hook || !adContent.script || !adContent.caption || !adContent.cta) {
      throw new Error("Resposta da IA incompleta");
    }

    console.log("Ad generated successfully");

    return new Response(
      JSON.stringify(adContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-ad:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar anúncio" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
