import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, LayoutDashboard, Briefcase, Users, Map, Settings, Search, LogOut, Bot, FileText } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { NotificationsPanel } from "./NotificationsPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { listNotifications } from "@/lib/notifications.functions";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vagas", label: "Vagas", icon: Briefcase },
  { to: "/candidatos", label: "Candidatos", icon: Users },
  { to: "/mapa", label: "Mapa de Talentos", icon: Map },
  { to: "/copiloto", label: "Copiloto IA", icon: Bot },
  { to: "/relatorio", label: "Relatório", icon: FileText },
] as const;

export function AppShell({
  title,
  subtitle,
  action,
  children,
  showSearch = true,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  showSearch?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data ?? { full_name: u.user.email, email: u.user.email, job_title: "Recrutador(a)" };
    },
  });

  const listNotifFn = useServerFn(listNotifications);
  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifFn(),
    refetchInterval: 60_000,
  });
  const unread = (notifs as any[]).filter((n) => !n.read_at).length;

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/", replace: true });
  }

  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-gradient-navy bg-sky-lines text-sidebar-foreground">
        <div className="px-5 pt-5 pb-6">
          <Link to="/dashboard"><BrandMark variant="light" size="sm" /></Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={[
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all",
                  active
                    ? "bg-gradient-yellow text-navy-deep shadow-glow-yellow"
                    : "text-white/85 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon className="size-4" strokeWidth={2.2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-xl bg-white/5 p-2.5 backdrop-blur border border-white/10 flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-azul-yellow grid place-items-center text-navy-deep font-bold text-xs">
            {initials || "AZ"}
          </div>
          <div className="flex-1 leading-tight min-w-0">
            <div className="text-xs font-semibold text-white truncate">{profile?.full_name ?? "..."}</div>
            <div className="text-[10px] text-white/60 truncate">{profile?.job_title ?? "Recrutador(a)"}</div>
          </div>
          <button onClick={handleLogout} className="text-white/60 hover:text-white transition" title="Sair">
            <LogOut className="size-3.5" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 px-5 lg:px-8 h-16">
            <div className="min-w-0">
              <h1 className="text-lg lg:text-xl font-extrabold text-navy-deep truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {showSearch && (
                <div className="hidden md:flex items-center gap-2 h-9 w-64 rounded-full border border-border bg-card px-3.5 shadow-card-soft">
                  <Search className="size-3.5 text-muted-foreground" />
                  <input
                    placeholder="Buscar candidatos, vagas..."
                    className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}
              <button
                onClick={() => setNotifOpen(true)}
                className="relative size-9 grid place-items-center rounded-full border border-border bg-card hover:bg-accent transition"
              >
                <Bell className="size-4 text-navy-deep" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-azul-yellow text-navy-deep text-[10px] font-extrabold border-2 border-background">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              <Link
                to="/configuracoes"
                className="size-9 grid place-items-center rounded-full border border-border bg-card hover:bg-accent transition"
              >
                <Settings className="size-4 text-navy-deep" />
              </Link>
              {action}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>

      <NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} />
    </div>
  );
}
