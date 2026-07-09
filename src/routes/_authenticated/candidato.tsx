import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyApplications } from "@/lib/submission.functions";
import { getCurrentUser, logout } from "@/lib/auth.functions";
import { Loader2, Briefcase, FileText, LogOut, User, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/candidato")({
  head: () => ({
    meta: [{ title: "Minhas Candidaturas — Azul Talent" }],
  }),
  component: CandidateDashboard,
});

function CandidateDashboard() {
  const navigate = useNavigate();
  const meFn = useServerFn(getCurrentUser);
  const listFn = useServerFn(listMyApplications);
  const logoutFn = useServerFn(logout);

  const { data: profile } = useQuery({
    queryKey: ["profile-me"],
    queryFn: () => meFn(),
  });

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => listFn(),
  });

  async function handleLogout() {
    await logoutFn();
    document.cookie = "azul_session=; path=/; max-age=0";
    toast.success("Sessão encerrada");
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 h-16">
          <BrandMark variant="dark" size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.full_name ?? "..."}
            </span>
            <button
              onClick={handleLogout}
              className="size-9 grid place-items-center rounded-full border border-border bg-card hover:bg-accent transition"
              title="Sair"
            >
              <LogOut className="size-4 text-navy-deep" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-12 rounded-full bg-gradient-cta grid place-items-center text-white">
            <User className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy-deep">Minhas Candidaturas</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe o status das suas candidaturas na Azul
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (apps as any[]).length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <FileText className="mx-auto size-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-bold text-navy-deep">Nenhuma candidatura encontrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você ainda não se candidatou a nenhuma vaga.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(apps as any[]).map((app: any) => (
              <Link
                key={app.id}
                to="/candidatura/$slug/resultado/$appId"
                params={{ slug: app.job_slug, appId: app.id }}
                className="block rounded-3xl border border-border bg-card p-6 shadow-card-soft hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="size-4 text-primary shrink-0" />
                      <h3 className="text-base font-bold text-navy-deep truncate">
                        {app.job_title ?? "Vaga"}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Candidatura enviada em{" "}
                      {new Date(app.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {app.fit_final != null && (
                      <div className="flex items-center gap-1.5 text-lg font-extrabold tabular-nums">
                        <Sparkles className="size-4 text-azul-yellow" />
                        <span className={app.fit_final >= 70 ? "text-success" : "text-muted-foreground"}>
                          {app.fit_final}%
                        </span>
                      </div>
                    )}
                    <div className="mt-1 text-xs font-semibold uppercase tracking-wider">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 ${
                          app.status === "reviewing"
                            ? "bg-sky/10 text-sky"
                            : app.status === "interview"
                              ? "bg-success/10 text-success"
                              : app.status === "rejected"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {app.status === "new"
                          ? "Recebida"
                          : app.status === "reviewing"
                            ? "Em análise"
                            : app.status === "interview"
                              ? "Entrevista"
                              : app.status === "offer"
                                ? "Aprovada"
                                : app.status === "rejected"
                                  ? "Não selecionada"
                                  : app.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
