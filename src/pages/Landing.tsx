import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

      <section className="max-w-3xl mx-auto px-4 pb-16 pt-10 space-y-10 text-center">
        <div className="space-y-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
            Landing Page
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            Crie criativos de anúncios em minutos usando IA, texto e imagens.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Gere roteiros, imagens e variações de criativos para campanhas em Meta, TikTok e outras
            plataformas. Tudo em um único estúdio, conectado ao seu fluxo de trabalho.
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

        <Card className="bg-card/80 border-border/40 p-6 md:p-7">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
            Prévia do estúdio
          </p>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium text-foreground text-sm">Prompt de exemplo</p>
              <p className="bg-muted/60 rounded-lg p-3 border border-border/40 text-xs leading-relaxed text-left">
                "Crie um anúncio em vídeo de 30s para um curso online de tráfego pago, focado em
                resultados rápidos para pequenos negócios."
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 pt-2">
              <div className="rounded-lg border border-border/50 bg-background/60 p-3 space-y-2 text-left">
                <p className="text-xs font-medium text-foreground">Geração de roteiro</p>
                <p className="text-[11px] leading-relaxed">
                  A IA cria o gancho, 3 cenas e CTA pronto para colar no gerenciador de anúncios.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/60 p-3 space-y-2 text-left">
                <p className="text-xs font-medium text-foreground">Imagens e variações</p>
                <p className="text-[11px] leading-relaxed">
                  Gere imagens verticais e quadradas prontas para testes A/B em campanhas.
                </p>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-muted-foreground/90 text-left">
              Nenhum cartão de crédito é necessário para começar. Faça login, teste o estúdio e conecte
              suas campanhas quando estiver pronto.
            </div>
          </div>
        </Card>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
              Planos pensados para criativos
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Comece grátis e evolua conforme suas campanhas escalam.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Do primeiro criativo de teste ao fluxo semanal de lançamentos, escolha um plano que acompanha o seu ritmo.
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
              Para quem está começando a testar criativos com IA em campanhas pequenas.
            </p>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-xl">R$ 0</p>
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
              Para gestores de tráfego que precisam testar criativos semanalmente em várias contas.
            </p>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-xl">R$ 97/mês</p>
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
              Para times que gerenciam múltiplos clientes e precisam padronizar a criação de criativos.
            </p>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-xl">R$ 297/mês</p>
              <p className="text-xs text-muted-foreground">Pensado para equipes</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16 pt-6 space-y-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
            Como o estúdio funciona
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Do briefing ao criativo aprovado em três passos.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Use prompts já validados, gere variações em lote e organize tudo em um único fluxo de aprovação.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-background/60 border-border/60 p-4 space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em]">Passo 1</p>
            <h3 className="text-base font-semibold">Defina o contexto da campanha</h3>
            <p className="text-sm text-muted-foreground">
              Informe produto, público, promessa principal e canal (Meta, TikTok, YouTube) em linguagem simples.
            </p>
          </Card>

          <Card className="bg-background/60 border-border/60 p-4 space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em]">Passo 2</p>
            <h3 className="text-base font-semibold">Gere roteiros, ganchos e imagens</h3>
            <p className="text-sm text-muted-foreground">
              A IA cria ganchos, cenas, CTAs e imagens sugeridas já pensando em CTR e tempo de retenção.
            </p>
          </Card>

          <Card className="bg-background/60 border-border/60 p-4 space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em]">Passo 3</p>
            <h3 className="text-base font-semibold">Aprove, exporte e teste A/B</h3>
            <p className="text-sm text-muted-foreground">
              Ajuste detalhes, exporte as variações e leve direto para o gerenciador de anúncios.
            </p>
          </Card>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-20 space-y-6">
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
              O estúdio funciona para qualquer nicho?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Sim. Você pode usar em lançamentos, perpétuo, e-commerce e serviços locais. O que muda é o contexto que você passa no briefing inicial.
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

      <footer className="border-t border-border/40">
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
