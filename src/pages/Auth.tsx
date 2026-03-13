import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
    } else {
      if (!displayName.trim()) {
        toast.error("Digite seu nome");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName.trim() },
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    }
    setLoading(false);
  };

  const handleGuestAccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <img src="/favicon.png" alt="Ceifadora" className="w-16 h-16" />
        </div>

        <h1 className="heading-display text-3xl text-foreground text-center mb-1">
          Ceifadora
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Confirmação de presença
        </p>

        <Button
          variant="ghost"
          size="lg"
          className="w-full mb-6 text-muted-foreground"
          onClick={handleGuestAccess}
        >
          Continuar como Convidado
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">
            {mode === "reset" ? "recuperar senha" : "ou entre com email"}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {mode === "reset" ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-label text-muted-foreground block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default"
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "..." : "Enviar link de recuperação"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-label text-muted-foreground block mb-2">Nome</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default"
                  required
                  maxLength={50}
                />
              </div>
            )}
            <div>
              <label className="text-label text-muted-foreground block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default"
                required
              />
            </div>
            <div>
              <label className="text-label text-muted-foreground block mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default"
                required
                minLength={6}
              />
            </div>

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="text-sm text-muted-foreground hover:text-foreground transition-default"
              >
                Esqueceu a senha?
              </button>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "..." : mode === "login" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>
        )}

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-foreground transition-default"
        >
          {mode === "login" ? "Não tem conta? Criar agora" : mode === "signup" ? "Já tem conta? Entrar" : "Voltar para login"}
        </button>
      </div>
    </div>
  );
}
