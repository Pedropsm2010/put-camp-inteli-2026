import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Filter, Search, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listApplications } from "@/lib/applications.functions";

export const Route = createFileRoute("/_authenticated/candidatos")({
  head: () => ({ meta: [{ title: "Candidatos — Azul Talent Hub" }] }),
  component: CandidatesPage,
});

const FILTERS = ["Todos", "90+", "70-89", "50-69", "<50", "Sem nota"] as const;
const ALL_JOBS = "Todas as vagas";

function scoreTint(score: number | null) {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 90) return "bg-success text-white";
  if (score >= 70) return "bg-azul-yellow text-navy-deep";
  if (score >= 50) return "bg-sky text-white";
  return "bg-muted text-muted-foreground";
}
const STATUS_LABEL: Record<string, string> = {
  new: "Novo", reviewing: "Em análise", interview: "Entrevista",
  offer: "Proposta", hired: "Contratado", rejected: "Descartado",
};
function statusTint(status: string) {
  if (status === "hired") return "border-success/40 text-success bg-success/5";
  if (status === "interview" || status === "offer") return "border-azul-yellow text-navy-deep bg-azul-yellow-soft";
  if (status === "rejected") return "border-destructive/30 text-destructive bg-destructive/5";
  return "border-border text-muted-foreground bg-muted";
}

function CandidatesPage() {
  const listFn = useServerFn(listApplications);
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["applications"], queryFn: () => listFn() });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todos");
  const [jobFilter, setJobFilter] = useState<string>(ALL_JOBS);

  const jobOptions = useMemo(() => {
    const titles = Array.from(new Set(rows.map((r: any) => r.jobs?.title).filter(Boolean))) as string[];
    return [ALL_JOBS, ...titles];
  }, [rows]);

  const filtered = useMemo(() => {
    return (rows as any[])
      .filter((c) => (c.full_name + " " + (c.jobs?.title ?? "") + " " + (c.jobs?.area ?? "")).toLowerCase().includes(q.toLowerCase()))
      .filter((c) => (jobFilter === ALL_JOBS ? true : c.jobs?.title === jobFilter))
      .filter((c) => {
        const s = c.fit_final ?? c.fit_score;
        if (filter === "Todos") return true;
        if (filter === "Sem nota") return s == null;
        if (s == null) return false;
        if (filter === "90+") return s >= 90;
        if (filter === "70-89") return s >= 70 && s <= 89;
        if (filter === "50-69") return s >= 50 && s <= 69;
        return s < 50;
      });
  }, [rows, q, filter, jobFilter]);

  return (
    <AppShell title="Candidatos" subtitle={`${filtered.length} de ${rows.length} perfis`}>
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="flex-1 min-w-0 flex items-center gap-3 h-14 rounded-2xl bg-card border border-border px-5 shadow-card-soft">
          <Search className="size-5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, cargo ou vaga..." className="flex-1 bg-transparent outline-none text-navy-deep" />
        </div>
        <div className="relative">
          <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="appearance-none h-14 pl-5 pr-12 rounded-2xl bg-card border border-border font-semibold text-navy-deep shadow-card-soft outline-none min-w-[240px]">
            {jobOptions.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        </div>
        <div className="inline-flex rounded-full bg-card border border-border p-1 shadow-card-soft">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 h-11 rounded-full text-xs font-semibold transition ${filter === f ? "bg-primary text-primary-foreground shadow-elevated" : "text-muted-foreground hover:text-navy-deep"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-card border border-border shadow-card-soft overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_1.2fr_140px_40px] gap-4 px-6 py-4 bg-muted/50 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <div>Fit Azul</div><div>Candidato</div><div>Vaga aplicada</div><div>Status</div><div></div>
        </div>
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">Nenhum candidato encontrado.</div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((c: any) => {
              const score = c.fit_final ?? c.fit_score;
              return (
                <li key={c.id}>
                  <Link to="/candidatos/$id" params={{ id: c.id }} className="grid grid-cols-[100px_1fr_1.2fr_140px_40px] gap-4 px-6 py-5 items-center hover:bg-primary/5 transition group">
                    <div className={`size-12 rounded-full grid place-items-center font-extrabold text-sm ${scoreTint(score)}`}>{score ?? "—"}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-navy-deep truncate">{c.full_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-navy-deep truncate">{c.jobs?.title ?? "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.jobs?.area ?? ""}</div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center h-8 px-3 rounded-full border text-xs font-semibold ${statusTint(c.status)}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
