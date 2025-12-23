import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  frames: {
    scene1: string;
    scene2: string;
    scene3: string;
  };
  script: {
    scene1: string;
    scene2: string;
    scene3: string;
  };
}

const VideoPlayer = ({ frames, script }: VideoPlayerProps) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const frameData = [
    { image: frames.scene1, description: script.scene1 },
    { image: frames.scene2, description: script.scene2 },
    { image: frames.scene3, description: script.scene3 },
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev === frameData.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
      setImageLoaded(false);
    }, 3000); // 3 seconds per frame

    return () => clearInterval(interval);
  }, [isPlaying, frameData.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const downloadFrame = (frameIndex: number) => {
    const link = document.createElement("a");
    link.href = frameData[frameIndex].image;
    link.download = `frame-${frameIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Prévia do Vídeo</h3>
            <p className="text-sm text-muted-foreground">
              3 cenas geradas com IA • Formato 9:16
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Reproduzir
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Frame Display */}
        <div className="relative aspect-[9/16] max-w-md mx-auto bg-black rounded-lg overflow-hidden shadow-2xl">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <img
            src={frameData[currentFrame].image}
            alt={`Frame ${currentFrame + 1}`}
            className="w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Frame indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {frameData.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentFrame(index);
                  setIsPlaying(false);
                  setImageLoaded(false);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentFrame
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>

          {/* Scene description overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <p className="text-white text-sm font-medium">
              Cena {currentFrame + 1}: {frameData[currentFrame].description}
            </p>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        <div className="grid grid-cols-3 gap-3">
          {frameData.map((frame, index) => (
            <div key={index} className="space-y-2">
              <button
                onClick={() => {
                  setCurrentFrame(index);
                  setIsPlaying(false);
                  setImageLoaded(false);
                }}
                className={`relative aspect-[9/16] w-full rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentFrame
                    ? "border-primary shadow-lg scale-105"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <img
                  src={frame.image}
                  alt={`Cena ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors">
                  <span className="text-white font-bold text-lg">{index + 1}</span>
                </div>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFrame(index)}
                className="w-full"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          ))}
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Você pode baixar cada frame individualmente e usá-los em ferramentas
            de edição de vídeo para criar o anúncio final com música, transições e texto sobreposto.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default VideoPlayer;
