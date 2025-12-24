import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  created_at: string;
}

const AdminEmails = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        navigate("/auth");
        return;
      }

      const userId = session.user.id;

      // Verifica se é admin
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) {
        console.error("Erro ao carregar roles:", rolesError);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const isUserAdmin = (roles || []).some((r) => r.role === "admin");
      setIsAdmin(isUserAdmin);

      if (!isUserAdmin) {
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Erro ao carregar perfis:", profilesError);
        setLoading(false);
        return;
      }

      setProfiles(profilesData || []);
      setLoading(false);
    };

    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="text-muted-foreground text-sm">
            Esta página é exclusiva para administradores.
          </p>
          <Button variant="outline" onClick={() => navigate("/app")}>
            Voltar para o app
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">E-mails cadastrados</h1>
            <p className="text-muted-foreground text-sm">
              Lista de todos os usuários que já criaram conta no Estúdio de Criativos.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/app")}>
            Voltar
          </Button>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead className="w-48">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(profile.created_at).toLocaleString("pt-PT")}
                  </TableCell>
                </TableRow>
              ))}
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground text-sm py-6">
                    Nenhum e-mail encontrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default AdminEmails;
