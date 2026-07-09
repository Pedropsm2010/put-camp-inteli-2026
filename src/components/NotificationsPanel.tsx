import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Bell,
  CheckCheck,
  Trash2,
  Sparkles,
  UserPlus,
  Briefcase,
  FileText,
  X,
  CircleCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
} from "@/lib/notifications.functions";

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  link: string | null;
};

const KIND_META: Record<string, { icon: LucideIcon; tint: string }> = {
  new_application: { icon: UserPlus, tint: "bg-sky text-white" },
  high_fit: { icon: Sparkles, tint: "bg-azul-yellow text-navy-deep" },
  ai_approved: { icon: CircleCheck, tint: "bg-success text-white" },
  candidate_result: { icon: Sparkles, tint: "bg-azul-yellow text-navy-deep" },
  cv_received: { icon: FileText, tint: "bg-primary text-primary-foreground" },
  job_created: { icon: Briefcase, tint: "bg-primary text-primary-foreground" },
  job_closed: { icon: X, tint: "bg-muted text-navy-deep" },
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const listFn = useServerFn(listNotifications);
  const markFn = useServerFn(markNotificationRead);
  const markAllFn = useServerFn(markAllNotificationsRead);
  const clearFn = useServerFn(clearNotifications);

  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listFn(),
    refetchInterval: open ? 30_000 : false,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const mMark = useMutation({
    mutationFn: (id: string) => markFn({ data: { id } }),
    onSuccess: invalidate,
  });
  const mMarkAll = useMutation({
    mutationFn: () => markAllFn(),
    onSuccess: () => {
      invalidate();
      toast.success("Todas marcadas como lidas");
    },
  });
  const mClear = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: () => {
      invalidate();
      toast.success("Notificações limpas");
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border bg-gradient-navy text-white">
          <SheetTitle className="text-white flex items-center gap-2">
            <Bell className="size-4" /> Notificações
          </SheetTitle>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => mMarkAll.mutate()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
            >
              <CheckCheck className="size-3.5" /> Marcar todas como lidas
            </button>
            <button
              onClick={() => mClear.mutate()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
            >
              <Trash2 className="size-3.5" /> Limpar
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <Bell className="size-8 mx-auto mb-2 opacity-40" />
              Nenhuma notificação por aqui.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n: NotificationRow) => {
                const meta = KIND_META[n.kind] ?? { icon: Bell, tint: "bg-muted text-navy-deep" };
                const Icon = meta.icon;
                const unread = !n.read_at;
                return (
                  <li
                    key={n.id}
                    className={`px-5 py-4 flex gap-3 cursor-pointer hover:bg-primary/5 transition ${unread ? "bg-primary/[0.02]" : ""}`}
                    onClick={() => unread && mMark.mutate(n.id)}
                  >
                    <div
                      className={`size-9 rounded-xl grid place-items-center shrink-0 ${meta.tint}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="text-sm font-semibold text-navy-deep flex-1">{n.title}</div>
                        {unread && (
                          <span className="mt-1.5 size-2 rounded-full bg-azul-yellow shrink-0" />
                        )}
                      </div>
                      {n.body && (
                        <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide">
                        {timeAgo(n.created_at)} atrás
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
