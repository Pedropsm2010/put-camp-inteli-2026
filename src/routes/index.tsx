import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, ArrowRight, Sparkles, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — Azul Talent Gupy" },
      { name: "description", content: "Acesse o painel de recrutamento inteligente da Azul." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"recruiter" | "analyst">("recruiter");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        toast.success("Conta criada com sucesso! Entrando...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(msg.includes("Invalid login") ? "E-mail ou senha inválidos" : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <section className="relative hidden lg:flex flex-col justify-between p-12 bg-sky-lines text-white overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 70% 60%, rgba(255,209,0,0.6), transparent), radial-gradient(1.5px 1.5px at 40% 80%, rgba(255,255,255,0.4), transparent)",
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 800 900" fill="none" preserveAspectRatio="none">
          <path d="M-50 700 Q 300 300, 850 100" stroke="oklch(0.87 0.18 96)" strokeWidth="1.5" strokeDasharray="4 8" />
          <path d="M-50 800 Q 400 500, 850 250" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="3 6" />
        </svg>

        <BrandMark variant="light" size="lg" />

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-semibold">
            <Sparkles className="size-3.5 text-azul-yellow" />
            IA integrada · Fit Azul
          </span>
          <h2 className="mt-6 text-5xl xl:text-6xl font-extrabold leading-[1.05]">
            Conectando talentos<br />
            ao <span className="text-azul-yellow">futuro da aviação.</span>
          </h2>
          <p className="mt-6 text-white/75 text-lg max-w-md">
            A plataforma de recrutamento da Azul que usa inteligência artificial para identificar, em segundos, os candidatos mais compatíveis com cada vaga.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4 max-w-lg">
          {[
            { k: "94%", v: "Precisão IA" },
            { k: "12x", v: "Mais rápido" },
            { k: "+8k", v: "Currículos" },
          ].map((s) => (
            <div key={s.k} className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5">
              <div className="text-3xl font-extrabold text-azul-yellow">{s.k}</div>
              <div className="text-xs text-white/70 mt-1">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="relative text-xs text-white/50">© 2026 Azul Linhas Aéreas Brasileiras · Uso interno restrito</div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><BrandMark variant="dark" /></div>
          <h1 className="text-4xl font-extrabold text-navy-deep">
            {mode === "signin" ? "Bem-vindo de volta" : "Crie sua conta"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "signin"
              ? "Acesse seu painel de recrutamento."
              : "Cadastre-se como recrutador Azul."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === "signup" && (
              <>
                <div>
                  <label className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">Nome completo</label>
                  <div className="mt-2 flex items-center gap-3 h-14 rounded-2xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
                    <User className="size-5 text-muted-foreground" />
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-navy-deep"
                      placeholder="Marina Costa"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">Perfil de acesso</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["recruiter", "analyst"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`h-14 rounded-2xl border-2 font-semibold text-sm transition ${role === r ? "border-primary bg-primary/5 text-navy-deep" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}
                      >
                        {r === "recruiter" ? "Recrutador" : "Analista"}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Administradores são liberados manualmente pela equipe interna.</p>
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">E-mail corporativo</label>
              <div className="mt-2 flex items-center gap-3 h-14 rounded-2xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
                <Mail className="size-5 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-navy-deep"
                  placeholder="voce@voeazul.com.br"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">Senha</label>
                {mode === "signin" && (
                  <Link to="/esqueci-senha" className="text-sm font-semibold text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3 h-14 rounded-2xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
                <Lock className="size-5 text-muted-foreground" />
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-navy-deep tracking-widest"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-cta text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition shadow-glow-blue disabled:opacity-60"
            >
              {loading ? "Aguarde..." : mode === "signin" ? "Entrar na plataforma" : "Criar conta"}
              <ArrowRight className="size-5" />
            </button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-semibold text-muted-foreground tracking-widest">OU</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              type="button"
              disabled
              className="w-full h-14 rounded-2xl border-2 border-border bg-card font-semibold text-muted-foreground flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <ShieldCheck className="size-5 text-primary" />
              SSO Azul (em breve)
            </button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              {mode === "signin" ? (
                <>
                  Não tem acesso?{" "}
                  <button type="button" onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">
                    Solicitar cadastro
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button type="button" onClick={() => setMode("signin")} className="font-semibold text-primary hover:underline">
                    Entrar
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
