import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, MapPin, GraduationCap, Briefcase, Languages, Award, Sparkles,
  CheckCircle2, Loader2, Bot, MessageSquare, Linkedin,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getApplication, updateApplicationNotes, setApplicationStatus } from "@/lib/applications.functions";
import { evaluateApplication } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/candidatos/$id")({
  head: () => ({ meta: [{ title: "Perfil do candidato — Azul Talent Hub" }] }),
  component: CandidateDetailPage,
});

type A = Record<string, any>;

function scoreClass(s: number) {
  if (s >= 85) return "bg-success text-white";
  if (s >= 70) return "bg-azul-yellow text-navy-deep";
  if (s >= 50) return "bg-sky text-white";
  return "bg-muted text-muted-foreground";
}
function scoreLabel(s: number) {
  if (s >= 85) return "Excelente";
  if (s >= 70) return "Alto";
  if (s >= 50) return "Moderado";
  return "Complementar";
}

const STATUSES = [
  { v: "new", l: "Novo" },
  { v: "reviewing", l: "Em análise" },
  { v: "interview", l: "Entrevista" },
  { v: "offer", l: "Proposta" },
  { v: "hired", l: "Contratado" },
  { v: "rejected", l: "Descartado" },
] as const;

function CandidateDetailPage() {
  const { id } = useParams({ from: "/_authenticated/candidatos/$id" });
  const navigate = useNavigate();
  const getFn = useServerFn(getApplication);
  const evalFn = useServerFn(evaluateApplication);
  const notesFn = useServerFn(updateApplicationNotes);
  const statusFn = useServerFn(setApplicationStatus);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [notes, setNotes] = useState("");
  useEffect(() => { if (data?.notes) setNotes(data.notes); }, [data?.notes]);

  const evalMut = useMutation({
    mutationFn: () => evalFn({ data: { id } }),
    onSuccess: () => { toast.success("Avaliação por IA concluída"); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return (
      <AppShell title="Carregando..." subtitle="">
        <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando perfil...</div>
      </AppShell>
    );
  }

  const c = data as A;
  const job = (c.jobs ?? {}) as A;
  const fit = c.fit_final ?? c.fit_score ?? 0;
  const cultura = c.cultura_score;
  const tecnica = c.tecnica_score;
  const cAnalysis = c.cultura_analysis as { score: number; justification: string } | null;
  const tAnalysis = c.tecnica_analysis as { score: number; justification: string } | null;

  const initials = String(c.full_name ?? "?")
    .split(" ").filter(Boolean).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("");

  const education = Array.isArray(c.education) ? c.education : [];
  const experience = Array.isArray(c.experience) ? c.experience : [];
  const languages = Array.isArray(c.languages) ? c.languages : [];
  const certs = Array.isArray(c.certifications) ? c.certifications : [];
  const behavioral = (c.behavioral_answers ?? {}) as { summary?: string; questions?: Record<string, string> };

  return (
    <AppShell title={c.full_name} subtitle={job.title ? `Aplicou para: ${job.title}` : ""}>
      <Link to="/candidatos" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" /> Todos os candidatos
      </Link>

      {/* Hero */}
      <section className="mt-4 relative overflow-hidden rounded-3xl bg-gradient-hero bg-sky-lines p-8 text-white">
        <div className="relative flex flex-col lg:flex-row gap-8 items-start">
          {c.photo_url ? (
            <img src={c.photo_url} alt={c.full_name} className="size-24 rounded-3xl object-cover shadow-glow-yellow" />
          ) : (
            <div className="size-24 rounded-3xl bg-azul-yellow grid place-items-center text-navy-deep text-3xl font-extrabold shadow-glow-yellow">{initials}</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={c.status}
                onChange={async (e) => {
                  await statusFn({ data: { id, status: e.target.value as any } });
                  toast.success("Status atualizado");
                  refetch();
                }}
                className="h-8 px-3 rounded-full bg-white/15 backdrop-blur border border-white/25 text-xs font-bold outline-none"
              >
                {STATUSES.map((s) => <option key={s.v} value={s.v} className="text-navy-deep">{s.l}</option>)}
              </select>
              {job.title && (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold">
                  {job.title}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-3xl font-extrabold">{c.full_name}</h2>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
              <span className="inline-flex items-center gap-2"><Mail className="size-4" /> {c.email}</span>
              {c.phone && <span className="inline-flex items-center gap-2"><Phone className="size-4" /> {c.phone}</span>}
              {(c.city || c.state) && <span className="inline-flex items-center gap-2"><MapPin className="size-4" /> {c.city} — {c.state}</span>}
              {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-azul-yellow"><Linkedin className="size-4" /> LinkedIn</a>}
            </div>
          </div>

          {/* Fit Azul score */}
          <div className="w-full lg:w-72 rounded-2xl bg-white/5 backdrop-blur border border-white/15 p-5 text-center">
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-azul-yellow flex items-center justify-center gap-1.5">
              <Sparkles className="size-3" /> Fit Azul Final
            </div>
            <div className="mt-2 text-6xl font-extrabold text-azul-yellow tabular-nums">{fit || "—"}</div>
            <div className="text-xs text-white/60">{fit ? scoreLabel(fit) : "Ainda não avaliado"}</div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white/10 p-2">
                <div className="text-white/60">Cultura (40%)</div>
                <div className="text-lg font-bold">{cultura ?? "—"}</div>
              </div>
              <div className="rounded-lg bg-white/10 p-2">
                <div className="text-white/60">Técnica (60%)</div>
                <div className="text-lg font-bold">{tecnica ?? "—"}</div>
              </div>
            </div>
            <button
              onClick={() => evalMut.mutate()}
              disabled={evalMut.isPending}
              className="mt-4 w-full h-11 rounded-full bg-azul-yellow text-navy-deep font-bold text-sm hover:opacity-90 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {evalMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
              {c.evaluated_at ? "Reavaliar com IA" : "Avaliar com IA"}
            </button>
          </div>
        </div>
      </section>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Resumo IA */}
          {c.summary_ai && (
            <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-2xl bg-gradient-cta grid place-items-center text-white"><Sparkles className="size-5" /></div>
                <h3 className="text-xl font-bold text-navy-deep">Resumo gerado pela IA</h3>
              </div>
              <p className="mt-4 text-navy-deep/85 leading-relaxed whitespace-pre-line">{c.summary_ai}</p>
            </div>
          )}

          {/* Análises IA */}
          {(cAnalysis || tAnalysis) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {cAnalysis && (
                <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Bot className="size-3.5" /> IA Cultura Azul
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-navy-deep">{cAnalysis.score}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <p className="mt-3 text-sm text-navy-deep/80 leading-relaxed">{cAnalysis.justification}</p>
                </div>
              )}
              {tAnalysis && (
                <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Bot className="size-3.5" /> IA Avaliador Técnico
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-navy-deep">{tAnalysis.score}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <p className="mt-3 text-sm text-navy-deep/80 leading-relaxed">{tAnalysis.justification}</p>
                </div>
              )}
            </div>
          )}

          {/* Resumo profissional do candidato */}
          {behavioral.summary && (
            <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
              <h3 className="text-lg font-bold text-navy-deep">Resumo profissional</h3>
              <p className="mt-3 text-sm text-navy-deep/85 whitespace-pre-line leading-relaxed">{behavioral.summary}</p>
            </div>
          )}

          {/* Experiência */}
          {experience.length > 0 && (
            <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
              <h3 className="text-xl font-bold text-navy-deep flex items-center gap-2"><Briefcase className="size-5 text-primary" /> Experiência</h3>
              <ol className="mt-5 relative border-l-2 border-primary/20 pl-6 space-y-6">
                {experience.map((e: any, i: number) => {
                  const period = e.period || (e.years ? `${e.years} ${e.years === 1 ? "ano" : "anos"}` : "");
                  return (
                    <li key={i} className="relative">
                      <span className="absolute -left-[29px] top-1 size-4 rounded-full bg-primary ring-4 ring-primary/10" />
                      <div className="font-bold text-navy-deep">{e.role || e.title || e.cargo || "—"}</div>
                      <div className="text-sm text-primary font-semibold">{e.company || e.empresa || "—"} {period ? `· ${period}` : ""}</div>
                      {e.detail && <p className="text-sm text-muted-foreground mt-1">{e.detail}</p>}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Respostas de triagem */}
          {behavioral.questions && Object.keys(behavioral.questions).length > 0 && (
            <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
              <h3 className="text-xl font-bold text-navy-deep flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" /> Respostas de triagem
              </h3>
              <ul className="mt-5 space-y-4">
                {Object.entries(behavioral.questions).map(([q, a]) => (
                  <li key={q} className="rounded-2xl bg-muted/40 p-4">
                    <div className="text-sm font-semibold text-navy-deep">{q}</div>
                    <div className="text-sm text-navy-deep/80 mt-1 whitespace-pre-line">{a || <em className="text-muted-foreground">Sem resposta</em>}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Histórico */}
          <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
            <h3 className="text-lg font-bold text-navy-deep">Histórico da candidatura</h3>
            <ul className="mt-3 text-sm text-muted-foreground space-y-1">
              <li>· Candidatura recebida em {new Date(c.created_at).toLocaleString("pt-BR")}</li>
              {c.evaluated_at && <li>· Avaliada pela IA em {new Date(c.evaluated_at).toLocaleString("pt-BR")}</li>}
              <li>· Status atual: <strong className="text-navy-deep">{STATUSES.find((s) => s.v === c.status)?.l ?? c.status}</strong></li>
            </ul>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
            <h3 className="text-lg font-bold text-navy-deep flex items-center gap-2"><GraduationCap className="size-5 text-primary" /> Formação</h3>
            {education.length === 0 && <p className="text-sm text-muted-foreground mt-3">Não informado.</p>}
            <ul className="mt-3 space-y-3 text-sm">
              {education.map((e: any, i: number) => (
                <li key={i}>
                  <div className="font-semibold text-navy-deep">{e.degree || e.course || e.level || e.d || "—"}{e.field ? ` · ${e.field}` : ""}</div>
                  <div className="text-muted-foreground">{e.institution || e.i || ""}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
            <h3 className="text-lg font-bold text-navy-deep flex items-center gap-2"><Languages className="size-5 text-primary" /> Idiomas</h3>
            {languages.length === 0 && <p className="text-sm text-muted-foreground mt-3">Não informado.</p>}
            <ul className="mt-3 space-y-2 text-sm">
              {languages.map((l: any, i: number) => (
                <li key={i} className="flex justify-between">
                  <span className="text-navy-deep font-semibold">{l.language || l.name || l.l || "—"}</span>
                  <span className="text-muted-foreground">{l.level || l.n || ""}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
            <h3 className="text-lg font-bold text-navy-deep flex items-center gap-2"><Award className="size-5 text-primary" /> Certificações</h3>
            {certs.length === 0 && <p className="text-sm text-muted-foreground mt-3">Não informado.</p>}
            <ul className="mt-3 space-y-2">
              {certs.map((cert: any, i: number) => (
                <li key={i} className="text-sm text-navy-deep flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-azul-yellow shrink-0" /> {typeof cert === "string" ? cert : cert.name || cert.title}
                </li>
              ))}
            </ul>
          </div>

          {c.resume_url && (
            <a href={c.resume_url} target="_blank" rel="noreferrer" className="block rounded-3xl bg-gradient-navy bg-sky-lines text-white p-6 hover:opacity-95">
              <h3 className="text-lg font-bold">Currículo</h3>
              <p className="text-sm text-white/70 mt-1">Abrir currículo enviado</p>
            </a>
          )}

          <div className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
            <h3 className="text-lg font-bold text-navy-deep">Observações do recrutador</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações internas..."
              className="mt-3 w-full h-28 rounded-2xl border border-border bg-muted/50 p-3 text-sm outline-none focus:border-primary resize-none"
            />
            <button
              onClick={async () => { await notesFn({ data: { id, notes } }); toast.success("Salvo"); }}
              className="mt-3 w-full h-11 rounded-full bg-gradient-cta text-primary-foreground font-semibold hover:opacity-95 transition"
            >
              Salvar observação
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
