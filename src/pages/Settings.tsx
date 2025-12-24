import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("profile");

  useEffect(() => {
    document.title = "Configurações e Planos - Estúdio de Criativos";
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-4xl space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Estúdio de Criativos com IA
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold mt-1">Configurações</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            Voltar para dashboard
          </Button>
        </header>

        <Card className="bg-card/80 border-border/60 p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
            <TabsList className="w-full max-w-sm">
              <TabsTrigger value="profile" className="flex-1 text-sm">
                Perfil
              </TabsTrigger>
              <TabsTrigger value="plans" className="flex-1 text-sm">
                Planos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Perfil</h2>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Gerencie as informações básicas da sua conta que serão usadas nos criativos e comunicações.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" placeholder="Seu nome" className="bg-background/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business">Marca / Negócio</Label>
                  <Input id="business" placeholder="Nome da sua marca" className="bg-background/40" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="niche">Nicho principal</Label>
                  <Input id="niche" placeholder="Ex.: infoprodutos, e-commerce de moda, consultoria" className="bg-background/40" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="plans" className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Planos pagos</h2>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Compare os planos pensados para criadores, gestores de tráfego e agências. Esta seção é apenas visual, sem cobrança.
                </p>
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
            </TabsContent>
          </Tabs>
        </Card>
      </section>
    </main>
  );
};

export default Settings;
