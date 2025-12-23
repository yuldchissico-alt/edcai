import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const Index = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Form data
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("");
  const [objective, setObjective] = useState("");
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mainBenefit, setMainBenefit] = useState("");
  
  // Generated content
  const [adContent, setAdContent] = useState<AdContent | null>(null);

  const handleGenerate = async () => {
    if (!productName || !targetAudience || !mainBenefit) {
      toast({
        title: "Preencha todos os campos",
        description: "Complete as informações do produto para continuar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ad", {
        body: {
          niche,
          platform,
          objective,
          productName,
          targetAudience,
          mainBenefit
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAdContent(data);
      setStep(3);
      
      toast({
        title: "Anúncio gerado!",
        description: "Seu anúncio está pronto para usar",
      });
    } catch (error) {
      console.error("Error generating ad:", error);
      toast({
        title: "Erro ao gerar anúncio",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  const renderOnboarding = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow mb-4">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Gerador de Anúncios com IA
        </h1>
        <p className="text-xl text-muted-foreground">
          Crie anúncios de alta conversão em segundos
        </p>
      </div>

      <Card className="p-8 space-y-6 border-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="niche" className="text-base font-semibold">Nicho do produto</Label>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger id="niche" className="mt-2">
                <SelectValue placeholder="Selecione o nicho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emagrecimento">Emagrecimento & Fitness</SelectItem>
                <SelectItem value="financas">Finanças & Investimentos</SelectItem>
                <SelectItem value="negocios">Negócios Locais</SelectItem>
                <SelectItem value="infoprodutos">Infoprodutos & Cursos</SelectItem>
                <SelectItem value="saude">Saúde & Bem-estar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="platform" className="text-base font-semibold">Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger id="platform" className="mt-2">
                <SelectValue placeholder="Onde vai anunciar?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meta">Meta Ads (Facebook/Instagram)</SelectItem>
                <SelectItem value="tiktok">TikTok Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="objective" className="text-base font-semibold">Objetivo</Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger id="objective" className="mt-2">
                <SelectValue placeholder="Qual o objetivo?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">Captura de Leads</SelectItem>
                <SelectItem value="vendas">Venda Direta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={() => setStep(2)} 
          disabled={!niche || !platform || !objective}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
        >
          Continuar
        </Button>
      </Card>
    </div>
  );

  const renderProductForm = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Button 
        variant="ghost" 
        onClick={() => setStep(1)}
        className="mb-4"
      >
        ← Voltar
      </Button>

      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold">Conte sobre seu produto</h2>
        <p className="text-muted-foreground">Quanto mais detalhes, melhor o anúncio</p>
      </div>

      <Card className="p-8 space-y-6 border-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="productName" className="text-base font-semibold">
              Nome do produto/oferta
            </Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Método Emagrecimento Definitivo"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="targetAudience" className="text-base font-semibold">
              Público-alvo
            </Label>
            <Input
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Ex: Mulheres 25-45 anos que lutam contra o peso"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="mainBenefit" className="text-base font-semibold">
              Principal benefício
            </Label>
            <Textarea
              id="mainBenefit"
              value={mainBenefit}
              onChange={(e) => setMainBenefit(e.target.value)}
              placeholder="Ex: Perca até 10kg em 30 dias sem dietas malucas"
              className="mt-2 min-h-24"
            />
          </div>
        </div>

        <Button 
          onClick={handleGenerate}
          disabled={loading || !productName || !targetAudience || !mainBenefit}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando seu anúncio...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Gerar Anúncio com IA
            </>
          )}
        </Button>
      </Card>
    </div>
  );

  const renderResults = () => (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            setStep(2);
            setAdContent(null);
          }}
        >
          ← Gerar outro anúncio
        </Button>
      </div>

      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold">Seu anúncio está pronto! 🎉</h2>
        <p className="text-muted-foreground">Copie e use em sua campanha</p>
      </div>

      <div className="grid gap-6">
        {/* Hook */}
        <Card className="p-6 border-2 border-primary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">Hook (Gancho)</h3>
              <p className="text-sm text-muted-foreground">Use como primeira linha do vídeo</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(adContent!.hook, 'hook')}
            >
              {copiedField === 'hook' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-lg font-medium">{adContent?.hook}</p>
        </Card>

        {/* Script */}
        <Card className="p-6 border-2 border-secondary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">Roteiro Visual (3 cenas)</h3>
              <p className="text-sm text-muted-foreground">Estrutura do vídeo em blocos</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(
                `Cena 1: ${adContent?.script.scene1}\nCena 2: ${adContent?.script.scene2}\nCena 3: ${adContent?.script.scene3}`,
                'script'
              )}
            >
              {copiedField === 'script' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <span className="font-semibold text-primary">Cena 1:</span> {adContent?.script.scene1}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <span className="font-semibold text-secondary">Cena 2:</span> {adContent?.script.scene2}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <span className="font-semibold text-accent">Cena 3:</span> {adContent?.script.scene3}
            </div>
          </div>
        </Card>

        {/* Caption */}
        <Card className="p-6 border-2 border-accent/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">Legenda do Post</h3>
              <p className="text-sm text-muted-foreground">Cole na descrição do anúncio</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(adContent!.caption, 'caption')}
            >
              {copiedField === 'caption' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="whitespace-pre-line">{adContent?.caption}</p>
        </Card>

        {/* CTA */}
        <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">Call to Action</h3>
              <p className="text-sm text-muted-foreground">Botão ou frase final</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(adContent!.cta, 'cta')}
            >
              {copiedField === 'cta' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-lg font-semibold">{adContent?.cta}</p>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-12 px-4">
      {step === 1 && renderOnboarding()}
      {step === 2 && renderProductForm()}
      {step === 3 && renderResults()}
    </div>
  );
};

export default Index;
