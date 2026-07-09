import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { User, Building2, Bell, Cpu, Lock, Save, Database, Trash2 } from "lucide-react";
import { getMySettings, updateProfile, updateRecruiterSettings, changePassword } from "@/lib/settings.functions";
import { seedDemoData, clearDemoData } from "@/lib/seed.functions";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Azul Talent Gupy" }] }),
  component: SettingsPage,
});

const TABS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "sistema", label: "Sistema", icon: Cpu },
  { id: "seguranca", label: "Segurança", icon: Lock },
] as const;

function SettingsPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMySettings);
  const updProfileFn = useServerFn(updateProfile);
  const updSettingsFn = useServerFn(updateRecruiterSettings);
  const passFn = useServerFn(changePassword);
  const seedFn = useServerFn(seedDemoData);
  const clearFn = useServerFn(clearDemoData);

  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("perfil");
  const { data } = useQuery({ queryKey: ["my-settings"], queryFn: () => getFn() });

  const [profile, setProfile] = useState({ full_name: "", job_title: "", company: "", avatar_url: "" });
  const [notif, setNotif] = useState({ notify_new_application: true, notify_high_fit: true, notify_deadline: true });
  const [weights, setWeights] = useState({ cultura: 40, tecnica: 60 });
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    if (!data) return;
    setProfile({
      full_name: data.profile?.full_name ?? "",
      job_title: data.profile?.job_title ?? "",
      company: data.profile?.company ?? "",
      avatar_url: data.profile?.avatar_url ?? "",
    });
    if (data.settings) {
      setNotif({
        notify_new_application: data.settings.notify_new_application ?? true,
        notify_high_fit: data.settings.notify_high_fit ?? true,
        notify_deadline: data.settings.notify_deadline ?? true,
      });
      const w = (data.settings.fit_weights as any) ?? { cultura: 40, tecnica: 60 };
      setWeights({ cultura: w.cultura ?? 40, tecnica: w.tecnica ?? 60 });
    }
  }, [data]);

  const mProfile = useMutation({
    mutationFn: () => updProfileFn({ data: profile }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile-me"] }); qc.invalidateQueries({ queryKey: ["my-settings"] }); toast.success("Perfil atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });
  const mSettings = useMutation({
    mutationFn: () => updSettingsFn({ data: { ...notif, fit_weights: weights } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-settings"] }); toast.success("Preferências salvas"); },
    onError: (e: any) => toast.error(e.message),
  });
  const mPass = useMutation({
    mutationFn: () => passFn({ data: { newPassword: newPass } }),
    onSuccess: () => { toast.success("Senha alterada"); setNewPass(""); },
    onError: (e: any) => toast.error(e.message),
  });
  const mSeed = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (r: any) => { toast.success(r.skipped ? "Já havia dados de demonstração" : `${r.inserted} candidatos criados`); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e.message),
  });
  const mClearSeed = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: () => { toast.success("Dados removidos"); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e.message),
  });

  const initials = (profile.full_name || "AZ").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  return (
    <AppShell title="Configurações" subtitle="Personalize sua conta e preferências" showSearch={false}>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <nav className="rounded-2xl bg-card border border-border shadow-card-soft p-2 h-fit">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground" : "text-navy-deep hover:bg-primary/5"}`}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {tab === "perfil" && (
            <Card title="Perfil do usuário">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-16 rounded-full bg-gradient-yellow grid place-items-center text-navy-deep font-extrabold text-xl shadow-glow-yellow">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="size-16 rounded-full object-cover" /> : initials}
                </div>
                <div className="flex-1">
                  <Field label="URL da foto" value={profile.avatar_url} onChange={(v) => setProfile({ ...profile, avatar_url: v })} placeholder="https://..." />
                </div>
              </div>
              <Field label="Nome completo" value={profile.full_name} onChange={(v) => setProfile({ ...profile, full_name: v })} />
              <Field label="Cargo" value={profile.job_title} onChange={(v) => setProfile({ ...profile, job_title: v })} placeholder="Recrutador(a) sênior" />
              <Field label="E-mail" value={data?.profile?.email ?? ""} onChange={() => {}} disabled />
              <SaveButton onClick={() => mProfile.mutate()} loading={mProfile.isPending} />
            </Card>
          )}

          {tab === "empresa" && (
            <Card title="Dados da empresa">
              <Field label="Nome da empresa" value={profile.company} onChange={(v) => setProfile({ ...profile, company: v })} placeholder="Azul Linhas Aéreas" />
              <Field label="Logotipo (URL)" value={profile.avatar_url} onChange={(v) => setProfile({ ...profile, avatar_url: v })} placeholder="https://..." />
              <Field label="Área de atuação" value="Aviação civil comercial" onChange={() => {}} disabled />
              <SaveButton onClick={() => mProfile.mutate()} loading={mProfile.isPending} />
            </Card>
          )}

          {tab === "notificacoes" && (
            <Card title="Alertas e notificações">
              <Toggle label="Ativar alertas de novos candidatos" value={notif.notify_new_application} onChange={(v) => setNotif({ ...notif, notify_new_application: v })} />
              <Toggle label="Alertas de Fit Azul alto (≥ 90)" value={notif.notify_high_fit} onChange={(v) => setNotif({ ...notif, notify_high_fit: v })} />
              <Toggle label="Alertas de prazo de vagas" value={notif.notify_deadline} onChange={(v) => setNotif({ ...notif, notify_deadline: v })} />
              <SaveButton onClick={() => mSettings.mutate()} loading={mSettings.isPending} />
            </Card>
          )}

          {tab === "sistema" && (
            <>
              <Card title="Configurações do Fit Azul">
                <p className="text-xs text-muted-foreground mb-4">Pesos utilizados pelo agente de IA ao calcular o Fit Azul final.</p>
                <SliderRow label="Cultura Azul" value={weights.cultura} onChange={(v) => setWeights({ cultura: v, tecnica: 100 - v })} />
                <SliderRow label="Avaliação técnica" value={weights.tecnica} onChange={(v) => setWeights({ tecnica: v, cultura: 100 - v })} />
                <SaveButton onClick={() => mSettings.mutate()} loading={mSettings.isPending} />
              </Card>
              <Card title="Dados de demonstração">
                <p className="text-xs text-muted-foreground mb-4">Popular a plataforma com candidatos fictícios realistas para apresentação executiva.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => mSeed.mutate()} disabled={mSeed.isPending} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-50">
                    <Database className="size-4" /> {mSeed.isPending ? "Populando..." : "Popular 100 candidatos"}
                  </button>
                  <button onClick={() => mClearSeed.mutate()} disabled={mClearSeed.isPending} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-destructive/30 text-destructive font-semibold text-sm hover:bg-destructive/5 transition">
                    <Trash2 className="size-4" /> Limpar candidatos
                  </button>
                </div>
              </Card>
            </>
          )}

          {tab === "seguranca" && (
            <>
              <Card title="Alterar senha">
                <Field label="Nova senha" value={newPass} onChange={setNewPass} type="password" placeholder="Mínimo 8 caracteres" />
                <button onClick={() => mPass.mutate()} disabled={mPass.isPending || newPass.length < 8} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-50">
                  <Lock className="size-4" /> Alterar senha
                </button>
              </Card>
              <Card title="Sessão ativa">
                <div className="text-sm text-navy-deep">Você está conectado como <span className="font-semibold">{data?.profile?.email}</span>.</div>
                <p className="text-xs text-muted-foreground mt-2">Encerre a sessão pelo menu lateral para desconectar deste dispositivo.</p>
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-card-soft p-5">
      <h3 className="text-base font-bold text-navy-deep mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", disabled }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</div>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm text-navy-deep outline-none focus:border-primary transition disabled:opacity-60 disabled:cursor-not-allowed" />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-navy-deep">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="py-2">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-navy-deep font-semibold">{label}</span>
        <span className="text-primary font-bold">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="mt-2 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-50">
      <Save className="size-4" /> {loading ? "Salvando..." : "Salvar"}
    </button>
  );
}
