import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Image as ImageIcon, Video, ArrowRight } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Estúdio de Criativos com IA - Início";
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/60 text-foreground">
      <header className="max-w-6xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80">
              Estúdio de Criativos
            </p>
            <p className="text-xs text-muted-foreground">IA para anúncios que convertem</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <Link to="/gallery">Minhas fotos</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => navigate("/auth")}
          >
            Entrar
          </Button>
          <Button size="sm" onClick={() => navigate("/auth")}>Começar</Button>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-4 pb-16 pt-6 grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
        <div className="space-y-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
            Landing Page
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            Crie criativos de anúncios em minutos usando IA, texto e imagens.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            Gere roteiros, imagens e variações de criativos para campanhas em Meta, TikTok e outras
            plataformas. Tudo em um único estúdio, conectado ao seu fluxo de trabalho.
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Acessar estúdio completo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/app")}
            >
              Ver demo rápida
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="w-3 h-3 text-primary" />
              </div>
              <span>Scripts e cenas de vídeo automáticos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-primary" />
              </div>
              <span>Imagens realistas otimizadas para anúncios</span>
            </div>
          </div>
        </div>

        <Card className="bg-card/80 border-border/60 p-5 md:p-6 shadow-lg shadow-primary/10">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
            Prévia do estúdio
          </p>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium text-foreground text-sm">Prompt de exemplo</p>
              <p className="bg-muted/70 rounded-lg p-3 border border-border/60 text-xs leading-relaxed">
                "Crie um anúncio em vídeo de 30s para um curso online de tráfego pago, focado em
                resultados rápidos para pequenos negócios."
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 pt-2">
              <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Geração de roteiro</p>
                <p className="text-[11px] leading-relaxed">
                  A IA cria o gancho, 3 cenas e CTA pronto para colar no gerenciador de anúncios.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Imagens e variações</p>
                <p className="text-[11px] leading-relaxed">
                  Gere imagens verticais e quadradas prontas para testes A/B em campanhas.
                </p>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-muted-foreground/90">
              Nenhum cartão de crédito é necessário para começar. Faça login, teste o estúdio e conecte
              suas campanhas quando estiver pronto.
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
};

export default Landing;
