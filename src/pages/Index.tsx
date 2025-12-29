import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, Copy, CheckCircle2, Video, Image as ImageIcon, Plus, Mic, LogOut, Images, Clock, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";
import VideoPlayer from "@/components/VideoPlayer";

const DEFAULT_MONTHLY_IMAGE_LIMIT = 50;

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
  const [processingFile, setProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [monthlyUsage, setMonthlyUsage] = useState<{ used: number; limit: number } | null>(null);
 
  const showImageApiErrorToast = (err: unknown, context: "image" | "chat") => {
    const anyErr = err as any;
 
    // Tenta extrair status de várias formas (edge function + Supabase + mensagem)
    let status: number | undefined = anyErr?.status ?? anyErr?.cause?.status ?? anyErr?.context?.response?.status;
 
    const msg: string | undefined =
      typeof anyErr?.message === "string" ? anyErr.message : undefined;
 
    if (!status && typeof anyErr?.code === "string" && /^\d{3}$/.test(anyErr.code)) {
      status = Number(anyErr.code);
    }
 
    if (!status && msg) {
      // Procura um código HTTP na mensagem (ex: "Edge function returned 429")
      const match = msg.match(/\b(400|401|403|429|500)\b/);
      if (match) {
        status = Number(match[1]);
      } else if (msg.includes("Limite de requisições da API de imagens foi excedido")) {
        status = 429;
      }
    }
 
    const title =
      context === "image"
        ? "Erro ao gerar imagens"
        : "Erro ao conversar com a IA de imagem";
 
    let description: string;
 
    switch (status) {
      case 400:
        description =
          "Requisição inválida enviada para a API de imagens. Revise o prompt e tente novamente.";
        break;
      case 401:
      case 403:
        description =
          "Chave da API de imagens inválida ou sem permissão. Verifique a configuração da chave de imagens no backend.";
        break;
      case 429:
        description =
          "Limite de requisições da API de imagens excedido. Aguarde alguns segundos e tente novamente. Se o erro persistir, verifique limites da sua conta na API.";
        break;
      case 500:
        description =
          "Erro interno na API de imagens. Tente novamente em alguns instantes.";
        break;
      default:
        description =
          msg ??
          "Ocorreu um erro ao se comunicar com a API de imagens. Tente novamente em alguns instantes.";
    }
 
    toast({
      title,
      description,
      variant: "destructive",
    });
  };

  const getCurrentMonthPeriodStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  };

  const fetchMonthlyUsage = useCallback(
    async (userId: string) => {
      const periodStart = getCurrentMonthPeriodStart();
      const { data, error } = await supabase
        .from("image_usage_monthly")
        .select("images_generated, plan_limit")
        .eq("user_id", userId)
        .eq("period_start", periodStart)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar uso mensal de imagens:", error);
        return;
      }

      const used = data?.images_generated ?? 0;
      const limit = data?.plan_limit ?? DEFAULT_MONTHLY_IMAGE_LIMIT;
      setMonthlyUsage({ used, limit });
    },
    [],
  );

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
        fetchMonthlyUsage(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchMonthlyUsage(session.user.id);
      }
    });

    const hasSeenOnboarding = window.localStorage.getItem("imageStudioOnboardingSeen");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    return () => subscription.unsubscribe();
  }, [navigate, fetchConversations, fetchMonthlyUsage]);

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

    if (!user) {
      toast({
        title: "Sessão expirada",
        description: "Entre novamente para gerar imagens.",
        variant: "destructive",
      });
      return;
    }

    const periodStart = getCurrentMonthPeriodStart();
    let used = monthlyUsage?.used ?? 0;
    const limit = monthlyUsage?.limit ?? DEFAULT_MONTHLY_IMAGE_LIMIT;

    if (used >= limit) {
      toast({
        title: "Limite mensal atingido",
        description: `Você já gerou ${limit} imagens neste mês. Atualize seu plano para continuar gerando novas imagens.`,
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

      const { data, error } = await supabase.functions.invoke(
        "generate-image-gemini-direct",
        {
          body: {
            prompt: promptText,
            aspectRatio: imageAspect,
          },
        },
      );

      const geminiErrorMessage =
        (data as any)?.error || (error as any)?.message || "Erro ao gerar imagem";
      const status = (error as any)?.context?.response?.status as
        | number
        | undefined;

      if (status === 429) {
        toast({
          title: "Limite da API do Google Gemini",
          description:
            "Você atingiu o limite de requisições do Gemini. Tente novamente em alguns minutos.",
          variant: "destructive",
        });
        return;
      }

      if (status && status >= 400) {
        toast({
          title: "Erro na API do Google Gemini",
          description: geminiErrorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Erro ao gerar imagem",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (error) {
        throw error;
      }

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

      // Atualiza uso mensal de imagens
      used += 1;
      setMonthlyUsage({ used, limit });
      const { error: usageError } = await supabase
        .from("image_usage_monthly")
        .upsert(
          {
            user_id: user.id,
            period_start: periodStart,
            images_generated: used,
            plan_limit: limit,
          },
          { onConflict: "user_id,period_start" },
        );

      if (usageError) {
        console.error("Erro ao atualizar uso mensal de imagens:", usageError);
      }

      // Salvar imagem gerada na galeria do usuário
      if (user && imageUrl.startsWith("data:image")) {
        try {
          const [header, base64Data] = imageUrl.split(",");
          const mimeMatch = header.match(/data:(.*);base64/);
          const mimeType = mimeMatch?.[1] || "image/png";

          const binaryString = atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const blob = new Blob([bytes], { type: mimeType });
          const fileExt = mimeType.split("/")[1] || "png";
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("user-photos")
            .upload(fileName, blob);

          if (uploadError) {
            console.error("Erro ao salvar imagem gerada no storage:", uploadError);
          } else {
            const { error: dbError } = await supabase.from("photos").insert({
              user_id: user.id,
              storage_path: fileName,
              title: promptText.slice(0, 80),
            });

            if (dbError) {
              console.error("Erro ao salvar registro de foto gerada:", dbError);
            }
          }
        } catch (saveError) {
          console.error("Erro ao salvar imagem gerada na galeria:", saveError);
        }
      }
    } catch (err) {
      console.error("Error generating image:", err);
      showImageApiErrorToast(err, "image");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setProcessingFile(true);

      if (file.type.startsWith("audio/")) {
        const formData = new FormData();
        formData.append("audio", file, file.name || "audio-file");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-transcribe`,
          {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error("Erro ao transcrever áudio");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const transcribedText = (data.text as string | undefined)?.trim();

        if (!transcribedText) {
          toast({
            title: "Nenhum texto encontrado",
            description: "Não foi possível extrair texto deste áudio.",
            variant: "destructive",
          });
        } else {
          setPrompt(transcribedText);
          await generateImagesFromPrompt(transcribedText);
        }
      } else if (file.type.startsWith("image/")) {
        toast({
          title: "Imagem selecionada",
          description: "Imagem adicionada como referência. Descreva no prompt como deseja usá-la.",
        });
      } else {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Selecione apenas imagens ou áudios.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Não foi possível processar o arquivo selecionado.",
        variant: "destructive",
      });
    } finally {
      setProcessingFile(false);
      event.target.value = "";
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
      showImageApiErrorToast(err, "chat");
    } finally {
      setChatLoading(false);
    }
  };

  const ConversationsSidebar = () => null;

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

        {monthlyUsage && (
          <div className="w-full max-w-3xl mx-auto mt-3 mb-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Uso mensal de imagens</span>
              <span>
                {monthlyUsage.used} / {monthlyUsage.limit} imagens
              </span>
            </div>
            <Progress value={(monthlyUsage.used / monthlyUsage.limit) * 100} className="h-2" />
          </div>
        )}

        <div className="w-full flex flex-col lg:flex-row gap-6 items-center lg:items-start">
          <ConversationsSidebar />

          <div className="flex-1 flex flex-col gap-8 items-center animate-fade-in relative">
            {showOnboarding && (
              <div className="absolute inset-0 z-20 flex items-start justify-center bg-background/80 backdrop-blur-sm rounded-3xl border border-border/60 px-4 py-6">
                <div className="max-w-lg text-center space-y-4">
                  <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-muted-foreground/80">
                    Tour rápido do estúdio
                  </p>
                  {onboardingStep === 1 && (
                    <>
                      <h2 className="text-lg md:text-2xl font-semibold tracking-tight">
                        1. Escreva ou grave o seu pedido
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Use o campo principal para descrever quem aparece, o ambiente e o estilo. Se preferir, segure o botão de microfone para ditar o prompt.
                      </p>
                    </>
                  )}
                  {onboardingStep === 2 && (
                    <>
                      <h2 className="text-lg md:text-2xl font-semibold tracking-tight">
                        2. Use prompts prontos por categoria
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Logo abaixo você encontra exemplos organizados por tipo de uso (negócios locais, produtos, retratos, lifestyle). Clique em um exemplo para preencher o prompt automaticamente.
                      </p>
                    </>
                  )}
                  {onboardingStep === 3 && (
                    <>
                      <h2 className="text-lg md:text-2xl font-semibold tracking-tight">
                        3. Combine estilos visuais
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Adicione estilos como "realista", "cinematográfico" ou "editorial" com um clique para deixar a imagem com a cara da sua marca.
                      </p>
                    </>
                  )}
                  <div className="flex justify-center gap-3 pt-2">
                    {onboardingStep > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOnboardingStep((prev) => (prev - 1) as 1 | 2 | 3)}
                      >
                        Voltar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        if (onboardingStep < 3) {
                          setOnboardingStep((prev) => (prev + 1) as 1 | 2 | 3);
                        } else {
                          window.localStorage.setItem("imageStudioOnboardingSeen", "true");
                          setShowOnboarding(false);
                        }
                      }}
                    >
                      {onboardingStep < 3 ? "Próximo" : "Começar a criar"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

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
                      <button
                        type="button"
                        className="shrink-0 rounded-full bg-muted w-9 h-9 flex items-center justify-center"
                        aria-label="Adicionar arquivo (imagem ou áudio)"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>
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
                          } disabled:opacity-60`}
                          aria-label={isRecording ? "Gravando áudio..." : "Segure para gravar áudio"}
                          onMouseDown={async () => {
                            await startRecording();
                          }}
                          onMouseUp={async () => {
                            const transcribedText = await stopRecording();
                            if (transcribedText) {
                              setPrompt(transcribedText);
                              await handleImageChat(transcribedText);
                            }
                          }}
                          onMouseLeave={async () => {
                            if (isRecording) {
                              const transcribedText = await stopRecording();
                              if (transcribedText) {
                                setPrompt(transcribedText);
                                await handleImageChat(transcribedText);
                              }
                            }
                          }}
                          onTouchStart={async () => {
                            await startRecording();
                          }}
                          onTouchEnd={async () => {
                            const transcribedText = await stopRecording();
                            if (transcribedText) {
                              setPrompt(transcribedText);
                              await handleImageChat(transcribedText);
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
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,audio/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
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

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">Prompts prontos por categoria:</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm">
                      {[
                        {
                          categoria: "Negócios locais",
                          prompt:
                            "Foto realista de dona de pequena pastelaria em Maputo, em pé atrás do balcão, sorrindo, ambiente aconchegante, luz natural entrando pela janela, foco em produtos frescos na frente.",
                        },
                        {
                          categoria: "Produtos / e-commerce",
                          prompt:
                            "Imagem de tênis esportivo sobre superfície branca minimalista, sombra suave, fundo desfocado com toque de azul, estilo foto de catálogo premium.",
                        },
                        {
                          categoria: "Retratos profissionais",
                          prompt:
                            "Retrato de mulher executiva africana em escritório moderno, fundo desfocado, iluminação de estúdio suave, expressão confiante, estilo foto corporativa LinkedIn.",
                        },
                        {
                          categoria: "Lifestyle / redes sociais",
                          prompt:
                            "Foto de grupo de amigos jovens rindo em cafeteria moderna, tons quentes, luz de fim de tarde, estilo lifestyle para feed do Instagram.",
                        },
                      ].map((item) => (
                        <button
                          key={item.prompt}
                          type="button"
                          onClick={() => {
                            setPrompt(item.prompt);
                            generateImagesFromPrompt(item.prompt);
                          }}
                          className="text-left px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted transition-colors border border-border/40 text-[11px] md:text-xs leading-relaxed"
                        >
                          <span className="block text-[10px] font-medium text-primary mb-1 uppercase tracking-[0.15em]">
                            {item.categoria}
                          </span>
                          {item.prompt}
                        </button>
                      ))}
                    </div>

                    <div className="pt-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Sugestões de estilos visuais:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "estilo foto realista, iluminação suave, cores neutras",
                          "estilo cinematográfico, contraste alto, sombras marcadas",
                          "estilo editorial de revista, composição minimalista",
                          "estilo foto de campanha fitness, cores quentes e dinâmicas",
                          "estilo retrato corporativo, fundo desfocado profissional",
                        ].map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => {
                              setPrompt((prev) =>
                                prev.includes(style) ? prev : `${prev.trim()}${prev ? ", " : ""}${style}`,
                              );
                            }}
                            className="px-3 py-1 rounded-full border border-border/50 bg-background/60 text-[11px] md:text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                          >
                            {style}
                          </button>
                        ))}
                      </div>
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