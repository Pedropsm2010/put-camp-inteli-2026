import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, hashPassword } from "./db.server";
import { j, parseJson } from "./utils";
import { loadSettings } from "./auth.functions";
import { currentUserId } from "./session.server";

export const getMySettings = createServerFn({ method: "GET" }).handler(async () => {
  const result = await loadSettings();
  return { profile: result.user, settings: result.settings };
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      full_name: z.string().min(1).max(120).optional(),
      job_title: z.string().max(120).nullable().optional(),
      company: z.string().max(120).nullable().optional(),
      avatar_url: z.string().max(400).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const id = currentUserId();
    if (!id) throw new Error("Não autenticado");
    const patch: Record<string, unknown> = { ...data };
    if (patch.avatar_url === "") patch.avatar_url = null;
    const sets = Object.keys(patch).map((k) => `${k} = ?`).join(", ");
    getDb().prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...(Object.values(patch) as (string | number | null)[]), id);
    return { ok: true };
  });

export const updateRecruiterSettings = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      notify_new_application: z.boolean().optional(),
      notify_high_fit: z.boolean().optional(),
      notify_deadline: z.boolean().optional(),
      fit_weights: z.object({ cultura: z.number().min(0).max(100), tecnica: z.number().min(0).max(100) }).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const id = currentUserId();
    if (!id) throw new Error("Não autenticado");
    const patch: Record<string, unknown> = {};
    if (data.notify_new_application !== undefined) patch.notify_new_application = data.notify_new_application ? 1 : 0;
    if (data.notify_high_fit !== undefined) patch.notify_high_fit = data.notify_high_fit ? 1 : 0;
    if (data.notify_deadline !== undefined) patch.notify_deadline = data.notify_deadline ? 1 : 0;
    if (data.fit_weights !== undefined) patch.fit_weights = j(data.fit_weights);
    patch.updated_at = new Date().toISOString();
    const sets = Object.keys(patch).map((k) => `${k} = ?`).join(", ");
    getDb().prepare(`UPDATE recruiter_settings SET ${sets} WHERE user_id = ?`).run(...(Object.values(patch) as (string | number | null)[]), id);
    return { ok: true };
  });

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ newPassword: z.string().min(6).max(72) }))
  .handler(async ({ data }) => {
    const id = currentUserId();
    if (!id) throw new Error("Não autenticado");
    getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(data.newPassword), id);
    return { ok: true };
  });
