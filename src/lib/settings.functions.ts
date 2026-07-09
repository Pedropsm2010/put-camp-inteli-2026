import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: settings }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("recruiter_settings").select("*").eq("user_id", context.userId).maybeSingle(),
    ]);
    return { profile, settings };
  });

const ProfileSchema = z.object({
  full_name: z.string().min(1).max(120).optional(),
  job_title: z.string().max(120).nullable().optional(),
  company: z.string().max(120).nullable().optional(),
  avatar_url: z.string().url().nullable().optional().or(z.literal("")),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ProfileSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { ...data };
    if (patch.avatar_url === "") patch.avatar_url = null;
    const { error } = await (context.supabase as any).from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SettingsSchema = z.object({
  notify_new_application: z.boolean().optional(),
  notify_high_fit: z.boolean().optional(),
  notify_deadline: z.boolean().optional(),
  fit_weights: z.object({ cultura: z.number().min(0).max(100), tecnica: z.number().min(0).max(100) }).optional(),
});

export const updateRecruiterSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SettingsSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("recruiter_settings")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const changePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ newPassword: z.string().min(8).max(72) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.auth.updateUser({ password: data.newPassword });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
