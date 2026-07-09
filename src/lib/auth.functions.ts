import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, hashPassword, verifyPassword, newId } from "./db.server";
import { parseJson } from "./utils";
import { currentUserId } from "./session.server";

function publicUser(row: any) {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    job_title: row.job_title,
    company: row.company,
    avatar_url: row.avatar_url,
  };
}

export const login = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ email: z.string().email(), password: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(data.email.toLowerCase()) as any;
    if (!row || !verifyPassword(data.password, row.password_hash)) {
      throw new Error("E-mail ou senha inválidos");
    }
    return { user: publicUser(row) };
  });

export const signup = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      full_name: z.string().min(2).max(120),
      role: z.enum(["recruiter", "analyst", "candidate"]).default("recruiter"),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(data.email.toLowerCase());
    if (existing) throw new Error("Este e-mail já está cadastrado");
    const id = newId();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, role, job_title, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, data.email.toLowerCase(), hashPassword(data.password), data.full_name, data.role, "Recrutador(a)", new Date().toISOString());
    db.prepare(
      `INSERT INTO recruiter_settings (user_id, theme, fit_weights, updated_at)
       VALUES (?, ?, ?, ?)`,
    ).run(id, "azul", JSON.stringify({ cultura: 40, tecnica: 60 }), new Date().toISOString());
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    return { user: publicUser(row) };
  });

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const id = currentUserId();
  if (!id) return null;
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  return row ? publicUser(row) : null;
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  return { ok: true };
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
    const values = Object.values(patch) as (string | number | null)[];
    getDb().prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...values, id);
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

export const loadSettings = createServerFn({ method: "GET" }).handler(async () => {
  const id = currentUserId();
  if (!id) throw new Error("Não autenticado");
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  const settings = db.prepare("SELECT * FROM recruiter_settings WHERE user_id = ?").get(id) as any;
  return {
    user: publicUser(user),
    settings: settings
      ? {
          theme: settings.theme,
          fit_weights: parseJson(settings.fit_weights, { cultura: 40, tecnica: 60 }),
          notify_new_application: !!settings.notify_new_application,
          notify_high_fit: !!settings.notify_high_fit,
          notify_deadline: !!settings.notify_deadline,
        }
      : null,
  };
});
