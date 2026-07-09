import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, ArrowLeft, CheckCircle2, Loader2, MapPin, Briefcase, Sparkles } from "lucide-react";
import { getCandidateResult } from "@/lib/submission.functions";
import { classifyBand } from "@/lib/evaluation";

export const Route = createFileRoute("/candidatura/$slug/resultado/$appId")({
  head: ({ params }) => ({
    meta: [
      { title: `Seu resultado — ${params.slug} — Azul Talent` },
      { name: "description", content: "Resultado da sua avaliação na Azul." },
    ],
  }),
  component: CandidateResultPage,
});

function scoreClass(s: number) {
  if (s >= 80) return "bg-success text-white";
  if (s >= 70) return "bg-azul-yellow text-navy-deep";
  if (s >= 60) return "bg-sky text-white";
  return "bg-muted text-muted-foreground";
}

function CandidateResultPage() {
  const { slug, appId } = useParams({ from: "/candidatura/$slug/resultado/$appId" });
  const getFn = useServerFn(getCandidateResult);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["candidate-result", appId],
    queryFn: () => getFn({ data: { id: appId } }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fit = (data.fit_final ?? 0) as number;
  const cultura = (data.cultura_score ?? 0) as number;
  const tecnica = (data.tecnica_score ?? 0) as number;
  const band = classifyBand(fit);
  const jobTitle = (data.jobs as { title?: string } | null)?.title as string | undefined;
  const message = (data.summary_ai as string) ?? "";
  const unread = !seen;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 h-16">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Azul Talent
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setOpen(true);
                setSeen(true);
              }}
              className="relative size-9 grid place-items-center rounded-full border border-border bg-card hover:bg-accent transition"
              title="Notificações"
            >
              <Bell className="size-4 text-navy-deep" />
              {unread && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-azul-yellow text-navy-deep text-[10px] font-extrabold border-2 border-background">
                  !
                </span>
              )}
            </button>
            <Link
              to="/"
              className="size-9 grid place-items-center rounded-full border border-border bg-card hover:bg-accent transition"
            >
              <ArrowLeft className="size-4 text-navy-deep" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card-soft text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-cta text-white">
            <Sparkles className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-navy-deep">Avaliação concluída!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Olá, {data.full_name}. Veja abaixo o resultado da sua candidatura
            {jobTitle ? ` para ${jobTitle}` : ""}.
          </p>

          <div className="mt-6 inline-flex flex-col items-center rounded-2xl bg-gradient-hero bg-sky-lines px-10 py-6 text-white">
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-azul-yellow flex items-center justify-center gap-1.5">
              <Sparkles className="size-3" /> Nota Final Azul
            </div>
            <div className="mt-1 text-6xl font-extrabold text-azul-yellow tabular-nums">{fit}%</div>
            <div
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${band.tint}`}
            >
              {band.label}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="text-xs text-muted-foreground">Cultura Azul (40%)</div>
              <div
                className={`mt-1 text-3xl font-extrabold ${scoreClass(cultura)} rounded-lg py-1`}
              >
                {cultura}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="text-xs text-muted-foreground">Técnica (60%)</div>
              <div
                className={`mt-1 text-3xl font-extrabold ${scoreClass(tecnica)} rounded-lg py-1`}
              >
                {tecnica}
              </div>
            </div>
          </div>

          <div
            className={`mt-5 rounded-2xl border p-5 text-left ${band.approved ? "border-success/40 bg-success/5" : band.key === "human_review" ? "border-sky/40 bg-sky/5" : "border-border bg-muted/30"}`}
          >
            <div className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Status: {band.status}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-deep/85">
              {message}
            </p>
          </div>

          <button
            onClick={() => {
              setOpen(true);
              setSeen(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-navy-deep hover:bg-accent transition"
          >
            <Bell className="size-4" /> Abrir notificação
          </button>
        </div>
      </main>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-border bg-gradient-navy text-white">
            <SheetTitle className="text-white flex items-center gap-2">
              <Bell className="size-4" /> Notificação
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-card-soft">
              <div className="inline-flex items-center gap-2 rounded-full bg-azul-yellow px-3 py-1 text-xs font-extrabold text-navy-deep">
                <Sparkles className="size-3.5" /> Resultado da avaliação
              </div>
              <div className="mt-4 text-5xl font-extrabold text-navy-deep tabular-nums">{fit}%</div>
              <div
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${band.tint}`}
              >
                {band.label}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Cultura (40%)</div>
                  <div className="text-lg font-bold text-navy-deep">{cultura}</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Técnica (60%)</div>
                  <div className="text-lg font-bold text-navy-deep">{tecnica}</div>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-navy-deep/85">
                {message}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="size-3.5" /> {jobTitle ?? "Vaga"} ·{" "}
                <MapPin className="size-3.5" /> Avaliação automática
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
