import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ArrowLeft, ArrowRight, Plane } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — Azul Talent Gupy" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <section className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-hero bg-sky-lines text-white overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 800 900" fill="none" preserveAspectRatio="none">
          <path d="M-50 700 Q 300 300, 850 100" stroke="oklch(0.88 0.17 92)" strokeWidth="1.5" strokeDasharray="4 8" />
        </svg>
        <BrandMark variant="light" size="lg" />
        <div className="relative">
          <h2 className="text-5xl font-extrabold leading-tight">Sua senha,<br/> de volta em <span className="text-azul-yellow">segundos.</span></h2>
          <p className="mt-4 text-white/70 max-w-md">Enviamos um link seguro para seu e-mail corporativo Azul. Válido por 30 minutos.</p>
        </div>
        <div className="relative text-xs text-white/50">© 2026 Azul Linhas Aéreas Brasileiras · Uso interno restrito</div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="size-4" /> Voltar ao login
          </Link>
          <h1 className="mt-6 text-4xl font-extrabold text-navy-deep">Recuperar acesso</h1>
          <p className="mt-2 text-muted-foreground">Informe seu e-mail corporativo e enviaremos um link para redefinir sua senha.</p>

          <form onSubmit={(e) => { e.preventDefault(); alert("Enviamos um link para seu e-mail corporativo."); }} className="mt-8 space-y-5">
            <div>
              <label className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">E-mail corporativo</label>
              <div className="mt-2 flex items-center gap-3 h-14 rounded-2xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
                <Mail className="size-5 text-muted-foreground" />
                <input type="email" placeholder="nome@voeazul.com.br" className="flex-1 bg-transparent outline-none text-navy-deep" />
              </div>
            </div>
            <button className="w-full h-14 rounded-2xl bg-gradient-cta text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition shadow-glow-blue">
              Enviar link seguro <ArrowRight className="size-5" />
            </button>
            <div className="rounded-2xl border border-border bg-sky-soft/40 p-4 flex gap-3">
              <Plane className="size-5 text-primary -rotate-45 shrink-0 mt-0.5" />
              <p className="text-sm text-navy-deep/80">Se não receber em até 5 minutos, verifique a caixa de spam ou fale com o time de TI da Azul.</p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
