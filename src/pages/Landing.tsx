import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, Image as ImageIcon, Video, ArrowRight } from "lucide-react";
import Snowfall from "@/components/Snowfall";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Estúdio de Criativos com IA - Início";
  }, []);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-background via-background to-muted/60 text-foreground overflow-hidden">
      <Snowfall />

      <header className="relative z-20 max-w-6xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between gap-4">
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

      <section className="relative z-20 max-w-3xl mx-auto px-4 pb-16 pt-10 space-y-10 text-center">
        <div className="space-y-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
            Landing Page
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            Crie imagens em minutos usando IA.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Gere fotos e imagens ultra realistas em poucos cliques.
            Tudo em um único estúdio de criação visual com IA.
          </p>

          <div className="flex flex-wrap justify-center gap-3 items-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Acessar estúdio completo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-primary" />
              </div>
              <span>Imagens realistas otimizadas para anúncios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-primary" />
              </div>
              <span>Formatos prontos para feeds, stories e reels</span>
            </div>
          </div>
        </div>

        <Card className="bg-card/80 border-border/40 p-6 md:p-7 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
            Prévia do estúdio
          </p>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium text-foreground text-sm">Prompt de exemplo</p>
              <p className="bg-muted/60 rounded-lg p-3 border border-border/40 text-xs leading-relaxed text-left">
                "Crie uma foto em estilo realista mostrando uma mulher empreendedora em um escritório moderno,
                com atmosfera profissional e cores que remetam a confiança."
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 pt-2">
              <div className="rounded-lg border border-border/50 bg-background/60 p-3 space-y-2 text-left">
                <p className="text-xs font-medium text-foreground">Briefing inteligente</p>
                <p className="text-[11px] leading-relaxed">
                  A IA entende a sua descrição simples e transforma em um briefing visual claro para gerar imagens.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/60 p-3 space-y-2 text-left">
                <p className="text-xs font-medium text-foreground">Imagens e variações</p>
                <p className="text-[11px] leading-relaxed">
                  Gere fotos em diferentes formatos (quadrado, vertical, horizontal) para usar onde quiser.
                </p>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-muted-foreground/90 text-left">
              Nenhum cartão de crédito é necessário para começar. Faça login e teste a criação de fotos com IA
              no seu próprio tempo.
            </div>
          </div>
        </Card>
      </section>

      <section className="relative z-20 max-w-3xl mx-auto px-4 pb-20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
              Planos pensados para criativos
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Comece grátis e evolua conforme cria mais fotos com IA.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Do seu primeiro teste até uma biblioteca completa de imagens, escolha um plano que acompanha o seu ritmo.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => navigate("/settings")}
          >
            Ver detalhes dos planos
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-muted/40 border-border/60 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Starter</h3>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                Início
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex-1">
              Para quem está começando a testar criação de fotos com IA.
            </p>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-xl">MT 0</p>
              <p className="text-xs text-muted-foreground">Ideal para teste</p>
            </div>
          </Card>

          <Card className="bg-primary/5 border-primary/40 p-4 flex flex-col gap-3 shadow-md shadow-primary/20">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                Pro
                <Badge className="text-[10px] uppercase tracking-wide bg-primary text-primary-foreground">
                  Mais usado
                </Badge>
              </h3>
            </div>
            <p className="text-sm text-muted-foreground flex-1">
              Para quem precisa produzir imagens novas com frequência sem depender de bancos de imagem.
            </p>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-xl">MT 1.150/mês</p>
              <p className="text-xs text-muted-foreground">Foco em performance</p>
            </div>
          </Card>

          <Card className="bg-muted/40 border-border/60 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Agência</h3>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                Escala
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex-1">
              Para times que precisam padronizar a criação de fotos e visuais em vários projetos.
            </p>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-xl">MT 3.500/mês</p>
              <p className="text-xs text-muted-foreground">Pensado para equipes</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="relative z-20 max-w-3xl mx-auto px-4 pb-16 pt-6 space-y-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
            Como o estúdio funciona
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Da ideia à foto final em três passos.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Use prompts simples, refine com a IA e gere imagens prontas para usar em qualquer lugar.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-background/60 border-border/60 p-4 space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em]">Passo 1</p>
            <h3 className="text-base font-semibold">Descreva o que quer ver</h3>
            <p className="text-sm text-muted-foreground">
              Informe quem aparece, o ambiente, o clima da foto e o estilo desejado em linguagem simples.
            </p>
          </Card>

          <Card className="bg-background/60 border-border/60 p-4 space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em]">Passo 2</p>
            <h3 className="text-base font-semibold">Refine o tipo de imagem</h3>
            <p className="text-sm text-muted-foreground">
              A IA te ajuda a decidir enquadramento, estilo visual, cenário e nível de realismo ideais.
            </p>
          </Card>

          <Card className="bg-background/60 border-border/60 p-4 space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em]">Passo 3</p>
            <h3 className="text-base font-semibold">Gere, baixe e use</h3>
            <p className="text-sm text-muted-foreground">
              Gere imagens em diferentes proporções, baixe os arquivos e use em posts, capas, apresentações e mais.
            </p>
          </Card>
        </div>
      </section>

      <section className="relative z-20 max-w-3xl mx-auto px-4 pb-20 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
            Perguntas rápidas
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Antes de criar sua conta
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Tire as principais dúvidas sobre uso, limite de gerações e plano gratuito antes de testar o estúdio.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3 md:px-6 md:py-4">
          <AccordionItem value="q1" className="border-b border-border/40 last:border-0">
            <AccordionTrigger className="text-sm md:text-base font-medium text-left">
              Preciso cadastrar cartão para usar o plano Starter?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Não. O plano Starter é pensado para teste: você cria conta, gera criativos com limite mensal e só migra para um plano pago se fizer sentido para o seu fluxo.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q2" className="border-b border-border/40 last:border-0">
            <AccordionTrigger className="text-sm md:text-base font-medium text-left">
              As imagens servem para vídeos ou só para criativos estáticos?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Hoje o foco é em criativos estáticos (imagens) para feeds, stories e reels. Você pode combinar essas imagens com roteiros de vídeo que já usa nas campanhas.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q3" className="border-b border-border/40 last:border-0">
            <AccordionTrigger className="text-sm md:text-base font-medium text-left">
              Consigo usar com minha equipe ou gestor de tráfego?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Hoje o acesso é individual, mas os criativos gerados podem ser compartilhados com seu time por exportação. Em breve, haverá recursos específicos para equipes.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <footer className="relative z-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="tracking-wide">
            © {new Date().getFullYear()} Estúdio de Criativos IA. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <button className="hover:text-foreground transition-colors">Termos</button>
            <button className="hover:text-foreground transition-colors">Privacidade</button>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
