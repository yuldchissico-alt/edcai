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

interface ChatMessage {
  role: "user" | "assistant";
  content?: string;
  imageUrl?: string;
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
  const [generatingImage, setGeneratingImage] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

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
        title: "Gerando imagem...",
        description: "Criando uma imagem ultra-realista para o seu prompt.",
      });

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: promptText,
          aspectRatio: imageAspect,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const imageUrl = data.image as string;

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Imagem gerada 👇",
          imageUrl,
        },
      ]);
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

  const handleImageChat = async (initialPrompt?: string) => {
    const messageContent = (initialPrompt ?? prompt).trim();

    if (!messageContent) {
      toast({
        title: "Digite um prompt",
        description: "Descreva a imagem que deseja gerar",
        variant: "destructive",
      });
      return;
    }

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: messageContent },
    ];

    setChatMessages(newMessages);
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "image-chat-assistant",
        {
          body: { messages: newMessages },
        },
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error as string);

      if (data?.reply) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply as string },
        ]);
      }

      if (data?.ready && data.finalPrompt) {
        await generateImagesFromPrompt(data.finalPrompt as string);
      }
    } catch (err) {
      console.error("Error in image chat:", err);
      toast({
        title: "Erro ao conversar com a IA de imagem",
        description:
          err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    await handleImageChat();
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

          <Card className="bg-muted/50 border-border/60 px-4 py-3 rounded-full shadow-sm">
            <form
              className="flex items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleImageChat();
              }}
            >
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
                  type="submit"
                  size="icon"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
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
            </form>
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
                disabled={generatingImage || chatLoading}
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

          {chatMessages.length > 0 && (
            <Card className="bg-muted/40 border-border/60 p-4 space-y-3">
              <h2 className="text-sm font-medium">Assistente de imagem</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm border border-border/40 bg-background/60 flex flex-col gap-2 ${
                      msg.role === "user" ? "ml-auto" : "mr-auto"
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                      {msg.role === "user" ? "Você" : "IA"}
                    </span>
                    {msg.content && (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                    {msg.imageUrl && (
                      <div className="space-y-2">
                        <div className="overflow-hidden rounded-lg border bg-background">
                          <img
                            src={msg.imageUrl}
                            alt="Imagem gerada pela IA"
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = msg.imageUrl!;
                            a.download = "imagem-gerada.png";
                            a.click();
                          }}
                        >
                          Baixar imagem
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {chatLoading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Pensando na melhor forma de gerar sua imagem...
                </p>
              )}
            </Card>
          )}

          {adContent && (
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Roteiro gerado
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateVideo}
                  disabled={generatingVideo}
                >
                  {generatingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando cenas...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Gerar vídeo com 3 cenas
                    </>
                  )}
                </Button>
              </div>

              <Card className="p-6 border border-border/60 bg-background/80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                        Hook
                      </span>
                      Abertura do anúncio
                    </h3>
                    <p className="text-sm leading-relaxed">{adContent.hook}</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(adContent.hook, "hook")}
                    >
                      {copiedField === "hook" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copiar
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                        Script
                      </span>
                      Roteiro em 3 cenas
                    </h3>
                    <div className="grid gap-3 md:grid-cols-3 text-sm">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Cena 1
                        </p>
                        <p className="leading-relaxed">{adContent.script.scene1}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Cena 2
                        </p>
                        <p className="leading-relaxed">{adContent.script.scene2}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Cena 3
                        </p>
                        <p className="leading-relaxed">{adContent.script.scene3}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        copyToClipboard(
                          `${adContent.script.scene1}\n\n${adContent.script.scene2}\n\n${adContent.script.scene3}`,
                          "script",
                        )
                      }
                    >
                      {copiedField === "script" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Script copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copiar script completo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[2fr,1fr] items-start">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                          Legenda
                        </span>
                        Texto para a descrição
                      </h3>
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {adContent.caption}
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(adContent.caption, "caption")}
                      >
                        {copiedField === "caption" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar legenda
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                          CTA
                        </span>
                        Chamada para ação
                      </h3>
                      <p className="text-sm leading-relaxed">{adContent.cta}</p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(adContent.cta, "cta")}
                      >
                        {copiedField === "cta" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar CTA
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {videoFrames && adContent && (
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Prévia das cenas
                </h2>
              </div>

              <VideoPlayer frames={videoFrames} script={adContent.script} />
            </section>
          )}
        </div>
      </section>
    </main>
  );
};

export default Index;
