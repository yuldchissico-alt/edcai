import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Erro ao acessar microfone",
        description: "Verifique as permissões do navegador.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-transcribe`,
            {
              method: "POST",
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error("Erro ao transcrever áudio");
          }

          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }

          setIsTranscribing(false);
          resolve(data.text || null);
        } catch (error) {
          console.error("Transcription error:", error);
          toast({
            title: "Erro na transcrição",
            description: "Não foi possível transcrever o áudio.",
            variant: "destructive",
          });
          setIsTranscribing(false);
          resolve(null);
        } finally {
          // Clean up stream
          if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
          }
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [toast]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  };
};
