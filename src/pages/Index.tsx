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
  const {
    toast
  } = useToast();
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

  const ConversationsSidebar = () => (
    <aside className="hidden md:flex w-64 flex-col gap-3 border-r border-border/40 pr-3">
      <button
        type="button"
        className="flex items-center justify-between gap-2 text-left w-full group"
        onClick={() => setIsConversationsOpen((prev) => !prev)}
      >
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conversas antigas
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              handleNewConversation();
            }}
            title="Nova conversa"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 text-muted-foreground ${
              isConversationsOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </div>
      </button>

      {isConversationsOpen && (
        <div className="flex-1 overflow-y-auto space-y-2 mt-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma conversa ainda.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id as string}
                type="button"
                onClick={() => handleSelectConversation(conversation.id as string)}
                className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                  conversation.id === currentConversationId
                    ? "bg-primary/10 border-primary/60"
                    : "bg-muted/40 border-border/40 hover:bg-muted/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium line-clamp-1">
                    {conversation.title || "Conversa sem título"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {conversation.updated_at
                      ? new Date(conversation.updated_at as string).toLocaleString("pt-BR")
                      : ""}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </aside>
  );

  if (uiMode === "CHAT") {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-6 md:py-10">
        <section className="w-full max-w-5xl mx-auto flex gap-4 h-full max-h-[90vh]">
          <ConversationsSidebar />

          <div className="flex-1 flex flex-col gap-4">
            <header className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Estúdio de Criativos com IA
                </p>
                <h1 className="text-lg md:text-xl font-semibold mt-1">Chat de imagens</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUiMode("DASHBOARD")}
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
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <section className="flex-1 flex flex-col px-4 py-6 md:py-10 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/gallery")}
            className="flex items-center gap-2"
          >
            <Images className="w-4 h-4" />
            Minhas Fotos
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Configurações
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
        
        <div className="w-full max-w-5xl mx-auto flex gap-6 items-start">
          <ConversationsSidebar />

          <div className="flex-1 flex flex-col gap-6 items-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Estúdio de Criativos com IA
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold">Como posso te ajudar hoje?</h1>
            </div>

          <Tabs defaultValue="dashboard" className="flex-1 flex flex-col">
            <TabsList className="w-full max-w-xs mx-auto">
              <TabsTrigger value="dashboard" className="flex-1">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">
                Chat de imagens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="flex-1">
              <div className="w-full max-w-3xl space-y-8 mt-4">
                <Card className="bg-muted/50 border-border/60 px-4 py-3 rounded-full shadow-sm max-w-3xl mx-auto">
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
                        {loadingAd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </Button>
                    </div>
                  </form>
                </Card>

                <div className="flex flex-col items-center gap-4 text-xs md:text-sm text-muted-foreground text-center">
                  <div className="flex flex-wrap items-center justify-center gap-2">
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

                  <div className="flex items-center justify-center gap-2">
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
                    {["Crie a foto de uma mulher mocambicana, 30 anos, cabelo natural preto, sorrindo confiante, em um escritório moderno, iluminação natural, estilo realista, pronta para anúncio em redes sociais.", "Foto de um homem jovem empreendedor, sentado em frente ao notebook em um coworking moderno, estilo lifestyle, luz suave, focado em negócios digitais.", "Imagem de produto cosmético minimalista apoiado em superfície de pedra, fundo desfocado, luz lateral dramática, estilo editorial premium.", "Foto de casal se exercitando ao ar livre ao pôr do sol, clima de conquista e bem-estar, cores quentes, estilo campanha fitness profissional."].map(
                      (example) => (
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
                      ),
                    )}
                  </div>
                </div>

                {chatMessages.length > 0 && (
                  <Card className="bg-muted/40 border-border/60 p-4 space-y-3 flex flex-col h-[60vh]">
                    <h2 className="text-sm font-medium">Assistente de imagem</h2>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
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