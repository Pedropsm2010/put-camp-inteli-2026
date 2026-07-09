import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, MapPin, Calendar, Users, GraduationCap, Languages, Award, Sparkles, CheckCircle2, ExternalLink, Plus, X, Save, Loader2 } from "lucide-react";
import { AREA_QUESTIONS } from "@/lib/job-templates";
import { updateJobQuestions } from "@/lib/jobs.functions";
import { toast } from "sonner";

type JobRow = {
  id: string;
  slug?: string | null;
  title: string;
  area: string;
  level?: string | null;
  description?: string | null;
  requirements?: string | null;
  desired_skills?: string[] | null;
  required_languages?: string[] | null;
  required_certifications?: string[] | null;
  min_education?: string | null;
  min_experience_years?: number | null;
  location: string;
  deadline?: string | null;
  status: "open" | "closed";
  custom_questions?: string[] | null;
};

export function JobDetailModal({
  job,
  open,
  onOpenChange,
}: {
  job: JobRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const baseQuestions = useMemo(() => {
    if (!job) return [] as string[];
    return AREA_QUESTIONS[job.area] ?? [
      "Descreva sua experiência mais relevante para esta vaga.",
      "Por que você quer trabalhar na Azul?",
    ];
  }, [job]);

  const [customQs, setCustomQs] = useState<string[]>([]);
  const [newQ, setNewQ] = useState("");
  useEffect(() => {
    setCustomQs(Array.isArray(job?.custom_questions) ? (job!.custom_questions as string[]) : []);
    setNewQ("");
  }, [job?.id]);

  const qc = useQueryClient();
  const saveFn = useServerFn(updateJobQuestions);
  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { id: job!.id, questions: customQs } }),
    onSuccess: () => { toast.success("Perguntas salvas"); qc.invalidateQueries({ queryKey: ["jobs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!job) return null;
  const isOpen = job.status === "open";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Hero */}
        <div className="relative bg-gradient-hero text-white p-8 rounded-t-2xl overflow-hidden">
          <div className="absolute inset-0 bg-sky-lines opacity-40 pointer-events-none" />
          <DialogHeader className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="size-14 rounded-2xl bg-white/15 grid place-items-center text-azul-yellow backdrop-blur">
                <Briefcase className="size-6" />
              </div>
              <span
                className={`inline-flex items-center gap-2 h-7 px-3 rounded-full text-xs font-bold ${
                  isOpen ? "bg-success text-white" : "bg-white/20 text-white"
                }`}
              >
                <span className="size-2 rounded-full bg-white" />
                {isOpen ? "Vaga aberta" : "Encerrada"}
              </span>
            </div>
            <DialogTitle className="relative mt-4 text-3xl font-extrabold text-white leading-tight text-left">
              {job.title}
            </DialogTitle>
            <p className="relative text-sm text-white/80 mt-1 text-left">
              {job.area}
              {job.level ? ` · ${job.level}` : ""}
            </p>

            <div className="relative mt-5 flex flex-wrap gap-4 text-xs text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {job.location}
              </span>
              {job.deadline && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Prazo:{" "}
                  {new Date(job.deadline).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                  })}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" /> 0 candidatos
              </span>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
          {/* Descrição */}
          {job.description && (
            <section>
              <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-muted-foreground">
                Sobre a vaga
              </h3>
              <p className="mt-2 text-sm text-navy-deep leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </section>
          )}

          {/* Requisitos */}
          {job.requirements && (
            <section>
              <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-muted-foreground">
                Requisitos
              </h3>
              <p className="mt-2 text-sm text-navy-deep leading-relaxed whitespace-pre-line">
                {job.requirements}
              </p>
            </section>
          )}

          {/* Skills / idiomas / certificações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(job.desired_skills?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-navy-deep">
                  <Sparkles className="size-3.5 text-primary" /> Skills
                </div>
                <ul className="mt-2 space-y-1 text-xs text-navy-deep">
                  {(job.desired_skills ?? []).map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {(job.required_languages?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-navy-deep">
                  <Languages className="size-3.5 text-primary" /> Idiomas
                </div>
                <ul className="mt-2 space-y-1 text-xs text-navy-deep">
                  {(job.required_languages ?? []).map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {(job.required_certifications?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-navy-deep">
                  <Award className="size-3.5 text-primary" /> Certificações
                </div>
                <ul className="mt-2 space-y-1 text-xs text-navy-deep">
                  {(job.required_certifications ?? []).map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {(job.min_education || (job.min_experience_years ?? 0) > 0) && (
            <div className="flex flex-wrap gap-3 text-xs">
              {job.min_education && (
                <span className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-accent text-navy-deep font-semibold">
                  <GraduationCap className="size-3.5" /> Escolaridade mínima: {job.min_education}
                </span>
              )}
              {(job.min_experience_years ?? 0) > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-accent text-navy-deep font-semibold">
                  <Briefcase className="size-3.5" /> {job.min_experience_years}+ anos de experiência
                </span>
              )}
            </div>
          )}

          {/* Perguntas específicas da área */}
          <section className="rounded-2xl border-2 border-azul-yellow/40 bg-azul-yellow-soft p-6">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-azul-yellow grid place-items-center">
                <Sparkles className="size-4 text-navy-deep" />
              </div>
              <h3 className="text-base font-extrabold text-navy-deep">
                Perguntas de triagem — {job.area}
              </h3>
            </div>
            <p className="mt-2 text-xs text-navy-deep/70">
              Padrões da área + perguntas personalizadas desta vaga. Aparecem para o candidato ao aplicar.
            </p>

            <ol className="mt-4 space-y-2">
              {baseQuestions.map((q, i) => (
                <li key={`base-${i}`} className="flex items-start gap-3 rounded-xl bg-card border border-border p-3">
                  <div className="size-6 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">{i + 1}</div>
                  <p className="text-sm text-navy-deep leading-snug flex-1">{q}</p>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Padrão</span>
                </li>
              ))}
              {customQs.map((q, i) => (
                <li key={`cus-${i}`} className="flex items-start gap-3 rounded-xl bg-card border border-primary/30 p-3">
                  <div className="size-6 shrink-0 rounded-full bg-azul-yellow text-navy-deep grid place-items-center text-xs font-bold">{baseQuestions.length + i + 1}</div>
                  <p className="text-sm text-navy-deep leading-snug flex-1">{q}</p>
                  <button onClick={() => setCustomQs(customQs.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-4 flex gap-2">
              <input
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newQ.trim()) {
                    e.preventDefault();
                    setCustomQs([...customQs, newQ.trim()]);
                    setNewQ("");
                  }
                }}
                placeholder="Nova pergunta personalizada..."
                className="flex-1 h-10 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => { if (newQ.trim()) { setCustomQs([...customQs, newQ.trim()]); setNewQ(""); } }}
                className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-95"
              >
                <Plus className="size-4" /> Adicionar
              </button>
              <button
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
                className="h-10 px-4 rounded-full bg-navy-deep text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-95 disabled:opacity-60"
              >
                {saveMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
              </button>
            </div>
          </section>

          {/* Link público */}
          {job.slug && (
            <a
              href={`/candidatar/${job.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition shadow-elevated"
            >
              <ExternalLink className="size-4" /> Abrir link público de candidatura
            </a>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <CheckCircle2 className="size-3.5 text-success" />
            Todas as candidaturas recebidas para esta vaga são pontuadas automaticamente pelo Fit Azul.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
