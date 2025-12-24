import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Copy, CheckCircle2, Video, Image as ImageIcon, Plus, Mic, LogOut, Images, Clock, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";
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
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceRecording();
  
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
  const [uiMode, setUiMode] = useState<"DASHBOARD" | "CHAT">("DASHBOARD");
  const [conversations, setConversations] = useState<Tables<"conversations">[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isConversationsOpen, setIsConversationsOpen] = useState(true);

  const fetchConversations = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar conversas:", error);
      return;
    }

    if (data) {
      setConversations(data as Tables<"conversations">[]);
    }
  }, []);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar mensagens:", error);
      return;
    }

    const mapped = (data || []).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content || undefined,
      imageUrl: (msg as any).image_url || undefined,
    }));

    setChatMessages(mapped);
    setCurrentConversationId(conversationId);
  }, []);

  const ensureConversation = useCallback(
    async (initialTitle?: string): Promise<string | null> => {
      if (currentConversationId) return currentConversationId;
      if (!user) return null;

      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: initialTitle || "Nova conversa" })
        .select("*")
        .single();

      if (error) {
        console.error("Erro ao criar conversa:", error);
        return null;
      }

      const conversation = data as Tables<"conversations">;
      setConversations((prev) => [conversation, ...prev]);
      setCurrentConversationId(conversation.id as string);
      return conversation.id as string;
    },
    [currentConversationId, user],
  );

  const handleSelectConversation = (conversationId: string) => {
    loadConversationMessages(conversationId);
  };

  const handleNewConversation = async () => {
    setChatMessages([]);
    setCurrentConversationId(null);
    await ensureConversation("Nova conversa");
  };

  useEffect(() => {
    // Verifica se está autenticado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchConversations(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência"
    });
  };
  const handleGenerateAd = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Digite um prompt",
        description: "Descreva o anúncio que deseja gerar",
        variant: "destructive"
      });
      return;
    }
    setLoadingAd(true);
    setAdContent(null);
    setVideoFrames(null);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("generate-ad", {
        body: {
          prompt
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAdContent(data as AdContent);
      toast({
        title: "Anúncio gerado!",
        description: "Seu anúncio está pronto para usar."
      });
    } catch (error) {
      console.error("Error generating ad:", error);
      toast({
        title: "Erro ao gerar anúncio",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes",
        variant: "destructive"
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
        description: "Criando 3 cenas com IA. Isso pode levar até 30 segundos."
      });
      const {
        data,
        error
      } = await supabase.functions.invoke("generate-video-frames", {
        body: {
          script: adContent.script,
          niche: "geral",
          platform: "meta"
        }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setVideoFrames(data.frames as VideoFrames);
      toast({
        title: "Vídeo gerado! 🎬",
        description: "Suas 3 cenas estão prontas."
      });
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Erro ao gerar vídeo",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setGeneratingVideo(false);
    }
  };
  const generateImagesFromPrompt = async (promptText: string, conversationId?: string) => {
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

      let convId = conversationId;
      if (!convId) {
        convId = await ensureConversation(promptText.slice(0, 80));
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Imagem gerada 👇",
          imageUrl,
        },
      ]);

      if (convId) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: "Imagem gerada 👇",
          image_url: imageUrl,
        });
        if (user) {
          await fetchConversations(user.id);
        }
      }
    } catch (err) {
      console.error("Error generating image:", err);
      toast({
        title: "Erro ao gerar imagens",
        description: err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
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

    const conversationId = await ensureConversation(messageContent.slice(0, 80));
    if (!conversationId) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageContent,
    };

    const newMessages: ChatMessage[] = [...chatMessages, userMessage];

    setChatMessages(newMessages);
    setUiMode("CHAT");
    setChatLoading(true);
    try {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: messageContent,
      });

      const { data, error } = await supabase.functions.invoke("image-chat-assistant", {
        body: {
          messages: newMessages,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error as string);

      let assistantReply = data?.reply as string | undefined;

      if (assistantReply && assistantReply.includes("[UI_MODE:CHAT]")) {
        setUiMode("CHAT");
        assistantReply = assistantReply.replace("[UI_MODE:CHAT]", "").trim();
      }

      if (assistantReply) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: assistantReply,
        };

        setChatMessages((prev) => [...prev, assistantMessage]);

        await supabase.from("chat_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantReply,
        });
      }

      if (data?.ready && data.finalPrompt) {
        await generateImagesFromPrompt(data.finalPrompt as string, conversationId);
      }

      if (user) {
        await fetchConversations(user.id);
      }
    } catch (err) {
      console.error("Error in image chat:", err);
      toast({
        title: "Erro ao conversar com a IA de imagem",
        description: err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setChatLoading(false);
    }
  };
  const handleGenerateImages = async () => {
    await handleImageChat();
  };

  const ConversationsSidebar = () => null;

  if (uiMode === "CHAT") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/60 text-foreground flex items-center justify-center px-4 py-6 md:py-10">
        <section className="w-full max-w-5xl mx-auto flex gap-4 h-full max-h-[90vh]">
          <ConversationsSidebar />

          <div className="flex-1 flex flex-col gap-5 animate-fade-in">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/40">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground/80">
                  Estúdio de Criativos com IA
                </p>
                <h1 className="text-base sm:text-lg md:text-2xl font-semibold tracking-tight leading-snug break-words">
                  Chat de imagens em tempo real
                </h1>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-start sm:justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUiMode("DASHBOARD")}
                  className="rounded-full px-3 text-xs md:text-sm w-full sm:w-auto justify-center"
                >
                  Voltar para dashboard
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} title="Configurações">
                  <Clock className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate("/gallery")} title="Minhas Fotos">
                  <Images className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </header>

            <Card className="bg-muted/40 border-border/60 p-4 space-y-3 flex flex-col flex-1 min-h-0">
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {chatMessages.length === 0 && !chatLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-sm text-muted-foreground">
                    <p>Comece a conversa descrevendo o que você precisa em uma imagem.</p>
                    <p className="text-xs max-w-sm">
                      Fale comigo como se estivesse falando com um especialista humano em criativos. Eu vou entender seu contexto e sugerir as melhores imagens.
                    </p>
                  </div>
                )}

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
                    {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
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
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  IA está digitando...
                </p>
              )}
            </Card>

            <Card className="bg-muted/50 border-border/60 px-4 py-3 rounded-full shadow-sm">
              <form
                className="flex items-center gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleImageChat();
                  setPrompt("");
                }}
              >
                <div className="shrink-0 rounded-full bg-background/40 w-8 h-8 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Descreva a imagem que quer gerar..."
                  className="border-none bg-transparent resize-none min-h-10 max-h-24 px-0 text-sm md:text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={chatLoading || generatingImage}
                    aria-label="Enviar para IA de imagem"
                  >
                    {chatLoading || generatingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-4 md:px-6 md:py-8">
      <section className="w-full max-w-6xl mx-auto flex flex-col relative">
        <div className="w-full flex justify-center md:justify-end mb-4 md:mb-0">
          <div className="flex items-center gap-2 z-10 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 border border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/gallery")}
              className="flex items-center gap-2 rounded-full px-2 py-0.5 text-xs md:text-sm"
            >
              <Images className="w-3 h-3" />
              Minhas Fotos
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="rounded-full text-xs md:text-sm text-muted-foreground hover:text-foreground"
              title="Configurações"
            >
              <Clock className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full text-xs md:text-sm text-muted-foreground hover:text-destructive"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-6 items-center lg:items-start">
          <ConversationsSidebar />

          <div className="flex-1 flex flex-col gap-8 items-center animate-fade-in">
{/* layout fixed */}
             <div className="flex flex-col items-center gap-3 text-center">

              <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-muted-foreground/80">
                Estúdio de Criativos com IA
              </p>
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
                Como posso te ajudar hoje?
              </h1>
            </div>

            <Tabs defaultValue="dashboard" className="flex-1 flex flex-col w-full mt-2">

              <TabsContent value="dashboard" className="flex-1 w-full">
                <div className="w-full max-w-3xl mx-auto space-y-8 mt-4">
                  <Card className="bg-card/80 border-border/60 px-4 py-3 md:px-6 md:py-4 rounded-2xl shadow-sm max-w-3xl mx-auto">
                    <form
                      className="flex items-center gap-3 md:gap-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleImageChat();
                        setPrompt("");
                      }}
                    >
                      <div className="shrink-0 rounded-full bg-muted w-9 h-9 flex items-center justify-center">
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
                          className={`rounded-full w-9 h-9 flex items-center justify-center transition-colors ${
                            isRecording
                              ? "bg-destructive text-destructive-foreground animate-pulse"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                          aria-label={isRecording ? "Gravando..." : "Gravar voz"}
                          onMouseDown={async () => {
                            await startRecording();
                          }}
                          onMouseUp={async () => {
                            const transcribedText = await stopRecording();
                            if (transcribedText) {
                              setPrompt(transcribedText);
                              await generateImagesFromPrompt(transcribedText);
                            }
                          }}
                          onTouchStart={async () => {
                            await startRecording();
                          }}
                          onTouchEnd={async () => {
                            const transcribedText = await stopRecording();
                            if (transcribedText) {
                              setPrompt(transcribedText);
                              await generateImagesFromPrompt(transcribedText);
                            }
                          }}
                          disabled={isTranscribing}
                        >
                          {isTranscribing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </button>
                        <Button
                          type="submit"
                          size="icon"
                          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          disabled={chatLoading || generatingImage}
                          aria-label="Gerar imagem"
                        >
                          {chatLoading || generatingImage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </form>
                  </Card>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Exemplos de prompts de imagem:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm">
                      {["Crie a foto de uma mulher mocambicana, 30 anos, cabelo natural preto, sorrindo confiante, em um escritório moderno, iluminação natural, estilo realista, pronta para anúncio em redes sociais.", "Foto de um homem jovem empreendedor, sentado em frente ao notebook em um coworking moderno, estilo lifestyle, luz suave, focado em negócios digitais.", "Imagem de produto cosmético minimalista apoiado em superfície de pedra, fundo desfocado, luz lateral dramática, estilo editorial premium.", "Foto de casal se exercitando ao ar livre ao pôr do sol, clima de conquista e bem-estar, cores quentes, estilo campanha fitness profissional."].map(
                        (example) => (
                          <button
                            key={example}
                            type="button"
                            onClick={() => {
                              setPrompt(example);
                              generateImagesFromPrompt(example);
                            }}
                            className="text-left px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted transition-colors border border-border/40 text-[11px] md:text-xs leading-relaxed"
                          >
                            {example}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

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
                            <p className="text-sm leading-relaxed whitespace-pre-line">{adContent.caption}</p>
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
            </TabsContent>

            <TabsContent value="chat" className="flex-1 mt-4">
              <div className="h-[70vh] flex flex-col gap-4">
                <Card className="bg-muted/40 border-border/60 p-4 space-y-3 flex flex-col flex-1">
                  <div className="flex flex-1 flex-col items-center justify-center text-center gap-3">
                    <h2 className="text-lg md:text-xl font-semibold">Como posso te ajudar hoje?</h2>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Converse comigo como se estivesse falando com um especialista humano em criativos.
                      Eu vou entender seu contexto e sugerir as melhores imagens.
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium">Exemplos de uso:</p>
                      <p>• "Quero uma imagem para anúncio de Instagram sobre aula de inglês online"</p>
                      <p>• "Preciso de uma capa profissional para meu e-book de finanças pessoais"</p>
                      <p>• "Crie uma imagem minimalista para anúncio de perfume de luxo"</p>
                    </div>
                  </div>
                </Card>

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
                      placeholder="Descreva a imagem que quer gerar..."
                      className="border-none bg-transparent resize-none min-h-10 max-h-24 px-0 text-sm md:text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="submit"
                        size="icon"
                        className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={chatLoading || generatingImage}
                        aria-label="Enviar para IA de imagem"
                      >
                        {chatLoading || generatingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </section>
    </main>
  );
};

export default Index;