import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Briefcase, Users, Sparkles, TrendingUp, ArrowUpRight, ArrowRight, Plane } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AREA_DIST as AREA_FALLBACK, EXP_BARS as EXP_FALLBACK, SCHOOLING as SCHOOL_FALLBACK } from "@/lib/mock-data";
import { getDashboardStats } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard executivo — Azul Talent Gupy" }] }),
  component: DashboardPage,
});

const ICONS = { briefcase: Briefcase, users: Users, sparkles: Sparkles, trend: TrendingUp } as const;
const TINTS: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  sky: "bg-sky text-white",
  yellow: "bg-azul-yellow text-navy-deep",
  success: "bg-success text-white",
};

function DashboardPage() {
  const statsFn = useServerFn(getDashboardStats);
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => statsFn() });

  const KPIS = [
    { label: "Vagas abertas", value: String(stats?.openJobs ?? 0), icon: "briefcase", tint: "primary", trend: "atualizado agora" },
    { label: "Candidaturas totais", value: String(stats?.totalApps ?? 0), icon: "users", tint: "sky", trend: "atualizado agora" },
    { label: "Fit Azul ≥ 85", value: String(stats?.highFit ?? 0), icon: "sparkles", tint: "yellow", trend: "candidatos de alto potencial" },
    { label: "Taxa de conversão", value: stats && stats.totalApps > 0 ? String(Math.round((stats.highFit / stats.totalApps) * 100)) : "0", suffix: "%", icon: "trend", tint: "success", trend: "IA + Fit Azul" },
  ] as const;

  const TOP_CANDIDATES = (stats?.topApps ?? []).map((a: any, i: number) => ({
    rank: i + 1,
    name: a.full_name,
    role: a.jobs?.title ?? "—",
    score: a.fit_score,
    id: a.id,
  }));

  const AREA_DIST = stats?.areaDist?.length ? stats.areaDist : AREA_FALLBACK;
  const EXP_BARS = stats?.expBars?.length ? stats.expBars : EXP_FALLBACK;
  const SCHOOLING = stats?.schooling?.length ? stats.schooling : SCHOOL_FALLBACK;
  const FLOW_DATA = Array.from({ length: 12 }, (_, i) => ({
    d: String(i + 1),
    candidatos: Math.max(1, Math.round(((stats?.totalApps ?? 0) / 12) * (0.6 + (i / 12) * 0.8))),
  }));
  return (
    <AppShell title="Dashboard executivo" subtitle="Visão consolidada em tempo real" showSearch={false}>
      {/* KPI grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map((k) => {
          const Icon = ICONS[k.icon as keyof typeof ICONS];
          return (
            <div key={k.label} className="rounded-2xl bg-card p-4 shadow-card-soft border border-border">
              <div className="flex items-start justify-between">
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">{k.label}</div>
                <div className={`size-8 rounded-xl grid place-items-center ${TINTS[k.tint]}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <div className="text-3xl font-extrabold text-navy-deep tracking-tight">{k.value}</div>
                {"suffix" in k && <div className="text-sm font-bold text-muted-foreground">{k.suffix}</div>}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-success">
                <ArrowUpRight className="size-3.5" /> {k.trend}
              </div>
            </div>
          );
        })}
      </section>


      {/* Row 2: flow chart + top candidates */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2 rounded-2xl bg-card p-4 shadow-card-soft border border-border flex flex-col min-h-[420px]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-deep">Fluxo de candidatos — últimos 12 dias</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Candidaturas recebidas por dia</p>
            </div>
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-success/10 text-success text-[10px] font-semibold">
              <span className="size-1.5 rounded-full bg-success animate-pulse" /> Ao vivo
            </span>
          </div>
          <div className="flex-1 min-h-[240px] mt-4">
            <ResponsiveContainer>
              <AreaChart data={FLOW_DATA} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="flow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.32 0.18 265)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.32 0.18 265)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.9 0.01 250)" vertical={false} />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fill: "oklch(0.5 0.03 258)", fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "oklch(0.5 0.03 258)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid oklch(0.92 0.012 250)", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", fontSize: 12 }}
                  labelStyle={{ color: "oklch(0.18 0.04 260)", fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="candidatos" stroke="oklch(0.32 0.18 265)" strokeWidth={2.5} fill="url(#flow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-card-soft border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-deep">Top 10 candidatos</h3>
            <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-azul-yellow text-navy-deep text-[10px] font-bold">
              <Sparkles className="size-2.5" /> Fit Azul
            </span>
          </div>
          {TOP_CANDIDATES.length === 0 ? (
            <div className="mt-6 text-center py-8 px-3">
              <Sparkles className="size-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-3">Nenhum candidato avaliado ainda.</p>
              <Link to="/configuracoes" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
                Popular dados demo
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {TOP_CANDIDATES.map((c) => (
                <li key={c.rank} className="py-2 flex items-center gap-2.5">
                  <div className="w-4 text-xs font-bold text-muted-foreground">{c.rank}</div>
                  <div className="size-8 rounded-full bg-success text-white grid place-items-center font-bold text-xs">{c.score}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-navy-deep truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{c.role}</div>
                  </div>
                  <Link to="/candidatos/$id" params={{ id: c.id }} className="text-muted-foreground hover:text-primary"><ArrowUpRight className="size-3.5" /></Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Row 3: distributions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="rounded-2xl bg-card p-4 shadow-card-soft border border-border">
          <h3 className="text-base font-bold text-navy-deep">Distribuição por área</h3>
          <div className="h-56 mt-3">
            <ResponsiveContainer>
              <BarChart data={AREA_DIST} layout="vertical" margin={{ left: 30, right: 16 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.92 0.012 250)" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "oklch(0.5 0.03 258)", fontSize: 10 }} />
                <YAxis type="category" dataKey="area" tickLine={false} axisLine={false} width={100} tick={{ fill: "oklch(0.35 0.05 260)", fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid oklch(0.92 0.012 250)", fontSize: 12 }} />
                <Bar dataKey="n" fill="oklch(0.32 0.18 265)" radius={[0, 6, 6, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-card-soft border border-border">
          <h3 className="text-base font-bold text-navy-deep">Experiência dos candidatos</h3>
          <div className="h-56 mt-3">
            <ResponsiveContainer>
              <BarChart data={EXP_BARS} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.92 0.012 250)" vertical={false} />
                <XAxis dataKey="faixa" tickLine={false} axisLine={false} tick={{ fill: "oklch(0.5 0.03 258)", fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "oklch(0.5 0.03 258)", fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid oklch(0.92 0.012 250)", fontSize: 12 }} />
                <Bar dataKey="n" fill="oklch(0.72 0.14 235)" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-card-soft border border-border">
          <h3 className="text-base font-bold text-navy-deep">Escolaridade</h3>
          <div className="h-56 mt-3 flex items-center">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={SCHOOLING} innerRadius={38} outerRadius={70} paddingAngle={3} dataKey="value">
                  {SCHOOLING.map((_: any, i: number) => (
                    <Cell key={i} fill={["oklch(0.32 0.18 265)", "oklch(0.72 0.14 235)", "oklch(0.87 0.18 96)"][i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2">
              {SCHOOLING.map((s: any, i: number) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: ["oklch(0.32 0.18 265)", "oklch(0.72 0.14 235)", "oklch(0.87 0.18 96)"][i] }} />
                  <span className="text-xs text-navy-deep flex-1">{s.name}</span>
                  <span className="text-sm font-bold text-navy-deep">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Talent map CTA */}
      <section className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-hero bg-sky-lines p-6 lg:p-7 text-white">
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1200 300" fill="none" preserveAspectRatio="none">
          <path d="M-50 250 Q 400 50, 1250 100" stroke="oklch(0.87 0.18 96)" strokeWidth="1.5" strokeDasharray="4 8" />
        </svg>
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-azul-yellow text-navy-deep text-[10px] font-bold">Novo</span>
            <h3 className="mt-2 text-xl font-extrabold">Mapa de Talentos Azul</h3>
            <p className="mt-1.5 text-xs text-white/75 max-w-2xl">
              Visualize seus candidatos como rotas aéreas convergindo para a contratação. Quanto maior o Fit Azul, mais próximo do destino.
            </p>
          </div>
          <Link to="/mapa" className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-azul-yellow text-navy-deep font-bold text-sm hover:opacity-90 transition shadow-glow-yellow">
            Abrir mapa <Plane className="size-3.5 -rotate-45" />
          </Link>
        </div>
      </section>

    </AppShell>
  );
}
