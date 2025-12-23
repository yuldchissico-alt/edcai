import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Photo {
  id: string;
  title: string | null;
  storage_path: string;
  created_at: string;
  url?: string;
}

export default function Gallery() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Gerar URLs assinadas para cada foto
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from("user-photos")
            .createSignedUrl(photo.storage_path, 3600);

          return {
            ...photo,
            url: urlData?.signedUrl,
          };
        })
      );

      setPhotos(photosWithUrls);
    } catch (error: any) {
      toast.error("Erro ao carregar fotos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user, fetchPhotos]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
      } else {
        toast.error("Por favor, selecione apenas imagens");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
      } else {
        toast.error("Por favor, selecione apenas imagens");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);

    try {
      // Upload para o storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("user-photos")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Salvar registro no banco
      const { error: dbError } = await supabase.from("photos").insert({
        user_id: user.id,
        storage_path: fileName,
        title: title.trim() || null,
      });

      if (dbError) throw dbError;

      toast.success("Foto enviada com sucesso!");
      setSelectedFile(null);
      setTitle("");
      fetchPhotos();
    } catch (error: any) {
      toast.error("Erro ao enviar foto");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;

    setDeletingId(photo.id);

    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from("user-photos")
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error: dbError } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);

      if (dbError) throw dbError;

      toast.success("Foto excluída com sucesso!");
      setPhotos(photos.filter((p) => p.id !== photo.id));
    } catch (error: any) {
      toast.error("Erro ao excluir foto");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold truncate">Minhas Fotos</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {photos.length} {photos.length === 1 ? "foto" : "fotos"}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Enviar Nova Foto</h2>
          
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="relative inline-block max-w-full">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="max-h-56 w-full object-contain rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground break-all">{selectedFile.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm text-foreground mb-1">
                      Arraste uma foto aqui ou
                    </p>
                    <label htmlFor="file-upload">
                      <Button variant="secondary" asChild>
                        <span className="cursor-pointer">Escolher arquivo</span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {selectedFile && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Título (opcional)
                  </label>
                  <Input
                    placeholder="Digite um título para a foto"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Foto
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Gallery Grid */}
        {photos.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              Você ainda não enviou nenhuma foto. Comece enviando sua primeira foto acima!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden group relative">
                <div className="aspect-square relative">
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.title || "Foto"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(photo)}
                      disabled={deletingId === photo.id}
                    >
                      {deletingId === photo.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {photo.title && (
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{photo.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(photo.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
