import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Sparkles,
  Copy,
  CheckCircle2,
  Video,
  Image as ImageIcon,
  Plus,
  Mic,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import VideoPlayer from "@/components/VideoPlayer";

interface AdContent {
  hook: string;
  script: {
    scene1: string;
    scene2: string;
    scene3: string;
  };
  caption: string;
  cta: string;
}

interface VideoFrames {
  scene1: string;
  scene2: string;
  scene3: string;
}

const Index = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [loadingAd, setLoadingAd] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [adContent, setAdContent] = useState<AdContent | null>(null);
  const [videoFrames, setVideoFrames] = useState<VideoFrames | null>(null);

  const [imageAspect, setImageAspect] = useState("9:16");
  const [imageResult, setImageResult] = useState<{
    natural: string;
    corporate: string;
  } | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  const handleGenerateAd = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Digite um prompt",
        description: "Descreva o anúncio que deseja gerar",
        variant: "destructive",
      });
      return;
    }

    setLoadingAd(true);
    setAdContent(null);
    setVideoFrames(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ad", {
        body: { prompt },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAdContent(data as AdContent);
      toast({
        title: "Anúncio gerado!",
        description: "Seu anúncio está pronto para usar.",
      });
    } catch (error) {
      console.error("Error generating ad:", error);
      toast({
        title: "Erro ao gerar anúncio",
        description:
          error instanceof Error ? error.message : "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setLoadingAd(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!adContent) return;

    setGeneratingVideo(true);
    try {
      toast({
        title: "Gerando vídeo...",
        description: "Criando 3 cenas com IA. Isso pode levar até 30 segundos.",
      });

      const { data, error } = await supabase.functions.invoke("generate-video-frames", {
        body: {
          script: adContent.script,
          niche: "geral",
          platform: "meta",
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setVideoFrames(data.frames as VideoFrames);
      toast({
        title: "Vídeo gerado! 🎬",
        description: "Suas 3 cenas estão prontas.",
      });
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Erro ao gerar vídeo",
        description:
          error instanceof Error ? error.message : "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setGeneratingVideo(false);
    }
  };

  const generateImagesFromPrompt = async (promptText: string) => {
    if (!promptText.trim()) {
      toast({
        title: "Digite um prompt",
        description: "Descreva a imagem que deseja gerar",
        variant: "destructive",
      });
      return;
    }

    try {
      setGeneratingImage(true);
      toast({
        title: "Gerando imagens...",
        description: "Criando versões natural e profissional para o seu prompt.",
      });

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: promptText,
          aspectRatio: imageAspect,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setImageResult(data.images);
      toast({
        title: "Imagens geradas!",
        description: "Duas versões prontas para uso profissional.",
      });
    } catch (err) {
      console.error("Error generating image:", err);
      toast({
        title: "Erro ao gerar imagens",
        description:
          err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateImages = async () => {
    await generateImagesFromPrompt(prompt);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl space-y-8">
          <div className="text-center space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Estúdio de Criativos com IA
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold">
              Como posso te ajudar hoje?
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Digite em linguagem natural o que você quer: anúncio, roteiro, criativo de imagem
              ou ideia de vídeo.
            </p>
          </div>

          <Card className="bg-muted/50 border-border/60 px-4 py-3 rounded-full flex items-center gap-3 shadow-sm">
            <div className="shrink-0 rounded-full bg-background/40 w-8 h-8 flex items-center justify-center">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Crie um vídeo curto para TikTok vendendo meu curso de marketing para infoprodutores..."
              className="border-none bg-transparent resize-none min-h-10 max-h-24 px-0 text-sm md:text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="rounded-full w-8 h-8 flex items-center justify-center bg-background/40 text-muted-foreground"
                aria-label="Microfone (em breve)"
              >
                <Mic className="w-4 h-4" />
              </button>
              <Button
                size="icon"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleGenerateAd}
                disabled={loadingAd}
                aria-label="Gerar anúncio"
              >
                {loadingAd ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground/80">Ações rápidas:</span>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-muted text-foreground/80 hover:bg-muted/80 transition-colors"
                onClick={handleGenerateAd}
                disabled={loadingAd}
              >
                Gerar anúncio
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-muted text-foreground/80 hover:bg-muted/80 transition-colors"
                onClick={handleGenerateImages}
                disabled={generatingImage}
              >
                Gerar imagens
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span>Formato da imagem:</span>
              <Select value={imageAspect} onValueChange={setImageAspect}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 quadrado</SelectItem>
                  <SelectItem value="4:5">4:5 feed</SelectItem>
                  <SelectItem value="9:16">9:16 stories/reels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Exemplos de prompts de imagem:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm">
              {[
                "Crie a foto de uma mulher mocambicana, 30 anos, cabelo natural preto, sorrindo confiante, em um escritório moderno, iluminação natural, estilo realista, pronta para anúncio em redes sociais.",
                "Foto de um homem jovem empreendedor, sentado em frente ao notebook em um coworking moderno, estilo lifestyle, luz suave, focado em negócios digitais.",
                "Imagem de produto cosmético minimalista apoiado em superfície de pedra, fundo desfocado, luz lateral dramática, estilo editorial premium.",
                "Foto de casal se exercitando ao ar livre ao pôr do sol, clima de conquista e bem-estar, cores quentes, estilo campanha fitness profissional.",
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setPrompt(example);
                    generateImagesFromPrompt(example);
                  }}
                  className="text-left px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted transition-colors border border-border/40"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {(adContent || imageResult) && (
        <section className="border-t border-border/40 bg-background/95 backdrop-blur-sm px-4 py-10">
          <div className="max-w-5xl mx-auto space-y-8">
            {adContent && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Resultado do anúncio
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAdContent(null);
                      setVideoFrames(null);
                    }}
                  >
                    Limpar anúncio
                  </Button>
                </div>

                <div className="grid gap-6">
                  {/* Video Player */}
                  {!videoFrames && !generatingVideo && (
                    <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-2">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-2">Gerar Vídeo do Anúncio</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Transforme seu roteiro em 3 cenas visuais geradas com IA.
                          </p>
                        </div>
                        <Button
                          onClick={handleGenerateVideo}
                          disabled={generatingVideo}
                          size="lg"
                          className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        >
                          <Video className="mr-2 h-5 w-5" />
                          Gerar Vídeo com IA
                        </Button>
                      </div>
                    </Card>
                  )}

                  {generatingVideo && (
                    <Card className="p-8 border-2 border-primary/20">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <div>
                          <h3 className="font-bold text-lg">Gerando suas cenas...</h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            A IA está criando 3 cenas visuais únicas para seu anúncio.
                            <br />
                            Isso pode levar até 30 segundos.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {videoFrames && (
                    <VideoPlayer frames={videoFrames} script={adContent.script} />
                  )}

                  {/* Hook */}
                  <Card className="p-6 border-2 border-primary/20">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div>
                        <h3 className="font-bold text-lg">Hook (Gancho)</h3>
                        <p className="text-sm text-muted-foreground">
                          Use como primeira linha do vídeo ou criativo.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(adContent.hook, "hook")}
                      >
                        {copiedField === "hook" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-lg font-medium">{adContent.hook}</p>
                  </Card>

                  {/* Script */}
                  <Card className="p-6 border-2 border-secondary/20">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div>
                        <h3 className="font-bold text-lg">Roteiro Visual (3 cenas)</h3>
                        <p className="text-sm text-muted-foreground">
                          Estrutura do vídeo em blocos.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            `Cena 1: ${adContent.script.scene1}\nCena 2: ${adContent.script.scene2}\nCena 3: ${adContent.script.scene3}`,
                            "script",
                          )
                        }
                      >
                        {copiedField === "script" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <span className="font-semibold">Cena 1:</span> {adContent.script.scene1}
                      </li>
                      <li>
                        <span className="font-semibold">Cena 2:</span> {adContent.script.scene2}
                      </li>
                      <li>
                        <span className="font-semibold">Cena 3:</span> {adContent.script.scene3}
                      </li>
                    </ul>
                  </Card>

                  {/* Caption */}
                  <Card className="p-6 border-2 border-secondary/20">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div>
                        <h3 className="font-bold text-lg">Legenda</h3>
                        <p className="text-sm text-muted-foreground">
                          Use como descrição do anúncio ou post.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(adContent.caption, "caption")}
                      >
                        {copiedField === "caption" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed">
                      {adContent.caption}
                    </p>
                  </Card>

                  {/* CTA */}
                  <Card className="p-6 border-2 border-secondary/20">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div>
                        <h3 className="font-bold text-lg">Call to Action</h3>
                        <p className="text-sm text-muted-foreground">
                          Frase final para puxar o clique ou mensagem.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(adContent.cta, "cta")}
                      >
                        {copiedField === "cta" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm font-medium">{adContent.cta}</p>
                  </Card>
                </div>
              </div>
            )}

            {imageResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Imagens geradas
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImageResult(null)}
                  >
                    Limpar imagens
                  </Button>
                </div>

                <Card className="p-6 border-2 border-secondary/30 bg-gradient-to-br from-background to-muted/40">
                  <div className="grid gap-4 md:grid-cols-2 mt-2">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Versão Natural (UGC)</h4>
                      <div className="overflow-hidden rounded-lg border bg-background">
                        <img
                          src={imageResult.natural}
                          alt="Imagem gerada - estilo natural UGC"
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = imageResult.natural;
                          a.download = "imagem-natural.png";
                          a.click();
                        }}
                      >
                        Baixar versão natural
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Versão Profissional / Corporativa</h4>
                      <div className="overflow-hidden rounded-lg border bg-background">
                        <img
                          src={imageResult.corporate}
                          alt="Imagem gerada - estilo profissional corporativo"
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = imageResult.corporate;
                          a.download = "imagem-profissional.png";
                          a.click();
                        }}
                      >
                        Baixar versão profissional
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
};

export default Index;
