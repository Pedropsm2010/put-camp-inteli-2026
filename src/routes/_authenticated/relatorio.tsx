import type { ReactElement } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { FileText, Loader2, Sparkles, Download, Briefcase, Users, TrendingUp, Bot } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { generateExecutiveReport } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/relatorio")({
  head: () => ({ meta: [{ title: "Relatório Executivo — Azul Talent Hub" }] }),
  component: RelatorioPage,
});

// Very small markdown renderer (headings, bold, lists).
function renderMd(md: string) {
  const lines = md.split("\n");
  const out: ReactElement[] = [];
  let listBuf: string[] = [];
  const flushList = () => {
    if (listBuf.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} className="list-disc pl-6 space-y-1 my-3 text-navy-deep/85">
        {listBuf.map((l, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inline(l) }} />)}
      </ul>,
    );
    listBuf = [];
  };
  const inline = (s: string) =>
    s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-navy-deep">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-xs">$1</code>');

  for (const raw of lines) {
    const l = raw.trimEnd();
    if (!l.trim()) { flushList(); continue; }
    if (l.startsWith("### ")) { flushList(); out.push(<h4 key={out.length} className="text-base font-bold text-navy-deep mt-6">{l.slice(4)}</h4>); }
    else if (l.startsWith("## ")) { flushList(); out.push(<h3 key={out.length} className="text-xl font-extrabold text-navy-deep mt-8 mb-2">{l.slice(3)}</h3>); }
    else if (l.startsWith("# ")) { flushList(); out.push(<h2 key={out.length} className="text-2xl font-extrabold text-navy-deep mt-8 mb-3">{l.slice(2)}</h2>); }
    else if (l.startsWith("- ") || l.startsWith("* ")) { listBuf.push(l.slice(2)); }
    else { flushList(); out.push(<p key={out.length} className="text-sm text-navy-deep/85 my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(l) }} />); }
  }
  flushList();
  return out;
}

function RelatorioPage() {
  const genFn = useServerFn(generateExecutiveReport);
  const mut = useMutation({
    mutationFn: () => genFn(),
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = mut.data?.stats;

  return (
    <AppShell
      title="Relatório Executivo"
      subtitle="Panorama completo gerado pela IA da Azul"
      action={
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-gradient-cta text-primary-foreground font-semibold text-sm hover:opacity-95 transition disabled:opacity-60"
        >
          {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Gerar relatório executivo
        </button>
      }
    >
      {!mut.data && !mut.isPending && (
        <div className="rounded-3xl bg-card border border-border shadow-card-soft p-16 text-center">
          <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-gradient-cta text-white shadow-glow-blue"><FileText className="size-8" /></div>
          <h2 className="mt-6 text-2xl font-extrabold text-navy-deep">Gere seu relatório executivo</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">A IA analisará seu banco de vagas e candidatos e produzirá um panorama completo com recomendações práticas para entrevistas.</p>
        </div>
      )}

      {mut.isPending && (
        <div className="rounded-3xl bg-card border border-border shadow-card-soft p-16 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Analisando dados e gerando insights...</p>
        </div>
      )}

      {mut.data && (
        <div className="space-y-5">
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { icon: Briefcase, l: "Vagas totais", v: stats.totalJobs },
                { icon: Briefcase, l: "Abertas", v: stats.openJobs },
                { icon: Users, l: "Candidatos", v: stats.totalApps },
                { icon: Bot, l: "Avaliados IA", v: stats.evaluated },
                { icon: TrendingUp, l: "Média Fit", v: stats.avgFit },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-card border border-border p-4 shadow-card-soft">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold"><s.icon className="size-3.5" /> {s.l}</div>
                  <div className="text-3xl font-extrabold text-navy-deep tabular-nums mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-3xl bg-card border border-border shadow-card-soft p-8 print:shadow-none">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-primary">Azul Talent Hub</div>
                <h2 className="text-2xl font-extrabold text-navy-deep">Relatório Executivo de Recrutamento</h2>
                <p className="text-xs text-muted-foreground mt-1">Gerado em {new Date().toLocaleString("pt-BR")}</p>
              </div>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border text-navy-deep font-semibold text-xs hover:bg-accent transition">
                <Download className="size-4" /> Imprimir / PDF
              </button>
            </div>
            <div>{renderMd(mut.data.markdown)}</div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
