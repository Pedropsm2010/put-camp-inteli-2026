import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Briefcase,
  Calendar,
  MapPin,
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  Power,
  Plane,
  Wrench,
  Activity,
  Cpu,
  BarChart3,
  Heart,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { NovaVagaModal } from "@/components/NovaVagaModal";
import { JobDetailModal } from "@/components/JobDetailModal";
import { createJob, listJobs, setJobStatus, deleteJob } from "@/lib/jobs.functions";
import { JOB_TEMPLATES } from "@/lib/job-templates";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vagas")({
  head: () => ({ meta: [{ title: "Vagas — Azul Talent Gupy" }] }),
  component: JobsPage,
});

function iconForArea(area: string, icon?: string | null) {
  const a = (area ?? "").toLowerCase();
  if (icon === "plane" || a.includes("voo")) return Plane;
  if (icon === "wrench" || a.includes("manuten")) return Wrench;
  if (icon === "activity" || a.includes("opera")) return Activity;
  if (icon === "cpu" || a.includes("tecnolog") || a.includes("ti")) return Cpu;
  if (icon === "chart" || a.includes("dados") || a.includes("gente")) return BarChart3;
  if (icon === "heart" || a.includes("cliente") || a.includes("experi")) return Heart;
  if (icon === "users" || a.includes("bordo") || a.includes("aeroport")) return Users;
  return Briefcase;
}

function JobsPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"todas" | "abertas" | "encerradas">("todas");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);

  const listFn = useServerFn(listJobs);
  const createFn = useServerFn(createJob);
  const statusFn = useServerFn(setJobStatus);
  const delFn = useServerFn(deleteJob);
  const qc = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => listFn() });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "open" | "closed" }) => statusFn({ data: v }),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Vaga excluída");
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const openCount = jobs.filter((j) => j.status === "open").length;
  const closedCount = jobs.filter((j) => j.status === "closed").length;

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchesQ = (j.title + " " + j.area + " " + j.location).toLowerCase().includes(q.toLowerCase());
      const matchesTab = tab === "todas" || (tab === "abertas" ? j.status === "open" : j.status === "closed");
      return matchesQ && matchesTab;
    });
  }, [jobs, q, tab]);

  async function seedDefaults() {
    if (seeding) return;
    const existingTitles = new Set(jobs.map((j) => j.title.toLowerCase()));
    const missing = JOB_TEMPLATES.filter((t) => !existingTitles.has(t.title.toLowerCase()));
    if (missing.length === 0) {
      toast.info("Todas as vagas padrão já estão publicadas.");
      return;
    }
    setSeeding(true);
    try {
      for (const t of missing) {
        await createFn({
          data: {
            ...t,
            salary_min: null,
            salary_max: null,
            deadline: null,
          },
        });
      }
      toast.success(`${missing.length} vaga(s) padrão publicada(s).`);
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao criar vagas padrão";
      toast.error(msg);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <AppShell
      title="Vagas"
      subtitle={`${openCount} oportunidades ativas`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="inline-flex items-center gap-2 h-12 px-4 rounded-2xl bg-azul-yellow text-navy-deep font-bold text-sm hover:opacity-95 transition shadow-glow-yellow disabled:opacity-60"
            title="Publica de uma vez todas as vagas típicas da Azul"
          >
            <Sparkles className="size-5" /> {seeding ? "Publicando..." : "Popular vagas padrão"}
          </button>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 h-12 pl-4 pr-6 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-95 transition shadow-glow-blue"
          >
            <Plus className="size-5" /> Criar vaga
          </button>
        </div>
      }
    >
      {/* Search + tabs bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="flex-1 flex items-center gap-3 h-14 rounded-2xl bg-card border border-border px-5 shadow-card-soft">
          <Search className="size-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cargo, área ou local..."
            className="flex-1 bg-transparent text-sm outline-none text-navy-deep placeholder:text-muted-foreground"
          />
        </div>
        <div className="inline-flex rounded-2xl bg-card border border-border p-1 shadow-card-soft">
          {[
            { k: "todas", l: `Todas (${jobs.length})` },
            { k: "abertas", l: `Abertas${openCount ? ` (${openCount})` : ""}` },
            { k: "encerradas", l: `Encerradas${closedCount ? ` (${closedCount})` : ""}` },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`px-5 h-12 rounded-xl text-sm font-bold transition ${
                tab === t.k
                  ? "bg-primary text-primary-foreground shadow-elevated"
                  : "text-muted-foreground hover:text-navy-deep"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="mt-10 text-center text-muted-foreground text-sm">Carregando vagas...</div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 text-center py-16 rounded-3xl bg-card border border-dashed border-border">
          <Briefcase className="size-10 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-bold text-navy-deep">Nenhuma vaga por aqui ainda</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Publique todas as vagas típicas da Azul com um clique ou crie uma nova do zero.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={seedDefaults}
              disabled={seeding}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-azul-yellow text-navy-deep font-bold text-sm hover:opacity-95 transition disabled:opacity-60"
            >
              <Sparkles className="size-4" /> {seeding ? "Publicando..." : `Popular ${JOB_TEMPLATES.length} vagas padrão`}
            </button>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-95 transition"
            >
              <Plus className="size-4" /> Criar vaga
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
          {filtered.map((j) => {
            const Icon = iconForArea(j.area, j.icon);
            const isOpen = j.status === "open";
            return (
              <article
                key={j.id}
                onClick={() => setDetail(j)}
                className="group relative rounded-3xl bg-card border border-border shadow-card-soft p-7 hover:shadow-elevated hover:border-primary/40 transition-all cursor-pointer text-left"
              >
                {/* header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="size-14 rounded-2xl bg-primary/10 grid place-items-center text-primary">
                    <Icon className="size-6" strokeWidth={2.2} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 h-7 px-3 rounded-full text-xs font-bold ${
                      isOpen ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${isOpen ? "bg-success" : "bg-muted-foreground"}`}
                    />
                    {isOpen ? "Aberta" : "Encerrada"}
                  </span>
                </div>

                {/* title */}
                <h3 className="mt-5 text-2xl font-extrabold text-navy-deep tracking-tight group-hover:text-primary transition">
                  {j.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {j.area}
                  {j.level ? ` · ${j.level}` : ""}
                </p>

                {/* tags */}
                {(j.desired_skills?.length ?? 0) > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(j.desired_skills ?? []).slice(0, 4).map((t: string) => (
                      <span
                        key={t}
                        className="text-xs font-semibold text-navy-deep bg-accent/70 px-3 py-1.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* footer */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <MapPin className="size-4" /> {j.location}
                  </span>
                  <div className="flex items-center gap-5">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4" /> <span className="font-bold text-navy-deep">0</span>
                    </span>
                    {j.deadline && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        {new Date(j.deadline).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* "Ver perguntas" hint */}
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition">
                  <Sparkles className="size-3.5" /> Ver perguntas de triagem →
                </div>

                {/* hover actions */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-card/95 backdrop-blur rounded-full border border-border shadow-elevated p-1 translate-y-10"
                >
                  <a
                    href={`/candidatar/${j.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-primary transition"
                    title="Link público"
                  >
                    <LinkIcon className="size-4" />
                  </a>
                  <button
                    onClick={() => { setEditing(j); setModalOpen(true); }}
                    className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-navy-deep transition"
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => statusMut.mutate({ id: j.id, status: isOpen ? "closed" : "open" })}
                    className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-navy-deep transition"
                    title={isOpen ? "Encerrar" : "Reabrir"}
                  >
                    <Power className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Excluir esta vaga? Esta ação não pode ser desfeita.")) delMut.mutate(j.id);
                    }}
                    className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                    title="Excluir"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <NovaVagaModal open={modalOpen} onOpenChange={setModalOpen} editing={editing} />
      <JobDetailModal job={detail} open={!!detail} onOpenChange={(v) => !v && setDetail(null)} />
    </AppShell>
  );
}
