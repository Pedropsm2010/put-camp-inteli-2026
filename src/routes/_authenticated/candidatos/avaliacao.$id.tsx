import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Sparkles, Bot } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/candidatos/avaliacao/$id")({
  head: () => ({ meta: [{ title: "Avaliação por IA — Azul Talent Gupy" }] }),
  component: EvaluationPage,
});

function EvaluationPage() {
  const { id } = useParams({ from: "/_authenticated/candidatos/avaliacao/$id" });

  return (
    <AppShell
      title="Avaliação por IA"
      subtitle={`Candidato #${id} · chat de avaliação em desenvolvimento`}
      action={
        <Link
          to="/candidatos/$id"
          params={{ id }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-card border border-border text-navy-deep font-semibold text-sm hover:bg-accent transition"
        >
          <ArrowLeft className="size-4" /> Voltar ao perfil
        </Link>
      }
    >
      <div className="max-w-3xl mx-auto mt-6">
        <div className="rounded-3xl bg-card border border-border shadow-card-soft p-10 text-center">
          <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-gradient-cta text-primary-foreground shadow-glow-blue">
            <Bot className="size-8" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-navy-deep">Chat de avaliação com IA</h2>
          <p className="mt-3 text-muted-foreground">
            Em breve você poderá conversar com a IA da Azul aqui para avaliar este candidato em profundidade —
            fit cultural, aderência técnica, red flags e recomendações de próximos passos.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {[
              { icon: Sparkles, t: "Fit Azul detalhado", d: "Explicação por competência." },
              { icon: MessageSquare, t: "Perguntas dirigidas", d: "Roteiro sugerido de entrevista." },
              { icon: Bot, t: "Resumo executivo", d: "Pronto para compartilhar com o time." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-border p-4 bg-muted/40">
                <f.icon className="size-5 text-primary" />
                <div className="mt-2 font-semibold text-navy-deep text-sm">{f.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{f.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-azul-yellow-soft text-navy-deep text-xs font-bold tracking-widest uppercase">
            <Sparkles className="size-3.5" /> Em breve
          </div>
        </div>
      </div>
    </AppShell>
  );
}
