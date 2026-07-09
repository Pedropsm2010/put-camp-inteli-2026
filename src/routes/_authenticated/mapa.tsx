import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Plane, Sparkles, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listApplications } from "@/lib/applications.functions";
import { listJobs } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({ meta: [{ title: "Mapa de Talentos — Azul Talent Hub" }] }),
  component: TalentMapPage,
});

function pointColor(score: number) {
  if (score >= 90) return "oklch(0.72 0.16 155)";
  if (score >= 70) return "oklch(0.87 0.18 96)";
  if (score >= 50) return "oklch(0.72 0.14 235)";
  return "oklch(0.7 0.02 258)";
}

// pseudo-random deterministic position from id
function pos(id: string, score: number): { x: number; y: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const y = 20 + (h % 60);
  // higher score = closer to right destination
  const base = 20 + Math.min(60, score * 0.6);
  const jitter = ((h >> 8) % 15) - 7;
  return { x: Math.max(10, Math.min(85, base + jitter)), y };
}

function TalentMapPage() {
  const navigate = useNavigate();
  const listAppsFn = useServerFn(listApplications);
  const listJobsFn = useServerFn(listJobs);
  const { data: apps = [] } = useQuery({ queryKey: ["applications"], queryFn: () => listAppsFn() });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => listJobsFn() });

  const jobOptions = useMemo(() => {
    const titles = Array.from(new Set((jobs as any[]).map((j) => j.title))) as string[];
    return titles.length > 0 ? titles : ["Todas as vagas"];
  }, [jobs]);
  const [selected, setSelected] = useState<string>("");
  const activeJob = selected || jobOptions[0] || "";

  const CANDIDATES = useMemo(() => {
    return (apps as any[])
      .filter((a) => (activeJob ? a.jobs?.title === activeJob : true))
      .map((a) => {
        const score = a.fit_final ?? a.fit_score ?? 0;
        const p = pos(a.id, score);
        return { id: a.id, name: a.full_name, score, x: p.x, y: p.y };
      });
  }, [apps, activeJob]);

  const ready90 = CANDIDATES.filter((c) => c.score >= 90);
  const approach = CANDIDATES.filter((c) => c.score >= 70 && c.score < 90);
  const enRoute = CANDIDATES.filter((c) => c.score < 70);

  return (
    <AppShell title="Mapa de Talentos Azul" subtitle="Cada candidato é uma rota. O destino é a contratação.">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
        <span className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-azul-yellow text-navy-deep text-sm font-bold shadow-glow-yellow">
          <Sparkles className="size-4" /> Visualização exclusiva Azul
        </span>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm text-muted-foreground">Selecione uma vaga para plotar seus candidatos:</label>
          <select value={activeJob} onChange={(e) => setSelected(e.target.value)} className="flex-1 max-w-lg h-11 px-4 rounded-2xl border border-border bg-card font-semibold text-navy-deep outline-none">
            {jobOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 relative overflow-hidden rounded-3xl bg-gradient-hero bg-sky-lines aspect-[16/8] p-6 lg:p-8 text-white">
        <div className="absolute z-10 top-6 left-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-4 text-xs space-y-1.5">
          <div className="font-bold tracking-[0.14em] uppercase text-white/80 mb-2">Fit Azul</div>
          {[
            { c: "oklch(0.72 0.16 155)", t: "90+ · Excelente" },
            { c: "oklch(0.87 0.18 96)", t: "70-89 · Alto" },
            { c: "oklch(0.72 0.14 235)", t: "50-69 · Moderado" },
            { c: "oklch(0.7 0.02 258)", t: "<50 · Complementar" },
          ].map((l) => (
            <div key={l.t} className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: l.c }} />
              <span>{l.t}</span>
            </div>
          ))}
        </div>

        <div className="absolute top-6 right-8 text-right z-10 max-w-[60%]">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-azul-yellow">Vaga plotada</div>
          <div className="text-2xl lg:text-3xl font-extrabold truncate">{activeJob || "—"}</div>
          <div className="text-sm text-white/70 mt-1">{CANDIDATES.length} candidatos em rota</div>
        </div>

        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {CANDIDATES.map((c) => (
            <path key={c.id} d={`M ${c.x} ${c.y} Q ${(c.x + 92) / 2} ${(c.y + 25) / 2 - 5}, 92 25`} stroke={pointColor(c.score)} strokeWidth="0.2" strokeDasharray="0.6 0.8" opacity="0.55" fill="none">
              <animate attributeName="stroke-dashoffset" from="0" to="10" dur="6s" repeatCount="indefinite" />
            </path>
          ))}
        </svg>

        {CANDIDATES.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate({ to: "/candidatos/$id", params: { id: c.id } })}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
          >
            <div className="size-5 rounded-full ring-4 ring-white/10 shadow-lg grid place-items-center text-[9px] font-bold text-navy-deep" style={{ background: pointColor(c.score) }}>
              {c.score || ""}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-navy-deep text-white text-xs px-3 py-1.5 shadow-elevated pointer-events-none z-20">
              <div className="font-semibold">{c.name}</div>
              <div className="text-white/60">Fit Azul {c.score || "—"}</div>
              <div className="text-azul-yellow text-[10px]">Clique para abrir perfil</div>
            </div>
          </button>
        ))}

        <div className="absolute left-8 bottom-8 text-xs font-bold tracking-[0.18em] uppercase text-white/60 flex items-center gap-2">
          <MapPin className="size-3.5" /> Pool de talentos
        </div>

        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative size-24 rounded-full bg-azul-yellow grid place-items-center shadow-glow-yellow">
            <div className="absolute inset-0 rounded-full bg-azul-yellow animate-ping opacity-30" />
            <Plane className="size-10 text-navy-deep -rotate-45" strokeWidth={2.5} />
          </div>
          <div className="mt-3 text-[10px] font-bold tracking-[0.2em] uppercase text-azul-yellow">Contratação</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[
          { title: "Prontos para pouso · 90+", list: ready90 },
          { title: "Em aproximação · 70-89", list: approach },
          { title: "Em rota · Abaixo de 70", list: enRoute },
        ].map((col) => (
          <div key={col.title} className="rounded-3xl bg-card border border-border shadow-card-soft p-6">
            <h3 className="text-lg font-bold text-navy-deep">{col.title}</h3>
            <ul className="mt-4 space-y-2">
              {col.list.length === 0 && <li className="text-sm text-muted-foreground py-2">Nenhum candidato.</li>}
              {col.list.map((c) => (
                <li key={c.id}>
                  <button onClick={() => navigate({ to: "/candidatos/$id", params: { id: c.id } })} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-accent transition text-left">
                    <div className="size-11 rounded-full grid place-items-center font-extrabold text-sm" style={{ background: pointColor(c.score), color: c.score >= 70 && c.score < 90 ? "oklch(0.18 0.14 268)" : "white" }}>
                      {c.score || "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-navy-deep truncate">{c.name}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
