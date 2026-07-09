import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const JobInputSchema = z.object({
  title: z.string().min(2).max(120),
  area: z.string().min(2).max(80),
  level: z.string().max(60).optional().nullable(),
  description: z.string().min(10),
  requirements: z.string().min(5),
  desired_skills: z.array(z.string()).default([]),
  required_languages: z.array(z.string()).default([]),
  required_certifications: z.array(z.string()).default([]),
  min_education: z
    .enum(["fundamental", "medio", "tecnico", "superior", "pos", "mestrado", "doutorado"])
    .optional()
    .nullable(),
  min_experience_years: z.number().int().min(0).max(50).default(0),
  location: z.string().min(2).max(120),
  employment_type: z.enum(["clt", "pj", "estagio", "temporario", "freelancer"]).default("clt"),
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  deadline: z.string().nullable().optional(), // ISO date
  icon: z.string().default("briefcase"),
  tags: z.array(z.string()).default([]),
  custom_questions: z.array(z.string()).default([]).optional(),
});

function slugify(t: string) {
  return (
    t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => JobInputSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const insert = { ...data, slug: slugify(data.title), created_by: context.userId };
    const { data: row, error } = await context.supabase.from("jobs").insert(insert).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), patch: JobInputSchema.partial() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("jobs")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const setJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "closed"]) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("jobs").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("jobs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ count: openJobs }, { count: totalApps }, topApps, { count: highFit }, allApps] = await Promise.all([
      context.supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
      context.supabase.from("applications").select("*", { count: "exact", head: true }),
      context.supabase
        .from("applications")
        .select("id, full_name, fit_score, fit_final, job_id, jobs(title)")
        .order("fit_score", { ascending: false })
        .limit(10),
      context.supabase.from("applications").select("*", { count: "exact", head: true }).gte("fit_score", 85),
      context.supabase
        .from("applications")
        .select("experience, education, jobs(area)")
        .limit(1000),
    ]);

    // Compute distributions from real apps
    const areaMap = new Map<string, number>();
    const expBuckets = { "0-2 anos": 0, "3-5 anos": 0, "6-10 anos": 0, "11+ anos": 0 };
    const schoolMap = new Map<string, number>();

    for (const a of (allApps.data ?? []) as any[]) {
      const area = a.jobs?.area ?? "Outros";
      areaMap.set(area, (areaMap.get(area) ?? 0) + 1);

      const exp = Array.isArray(a.experience) ? a.experience[0] : null;
      const years = Number(exp?.years ?? 0);
      const bucket = years <= 2 ? "0-2 anos" : years <= 5 ? "3-5 anos" : years <= 10 ? "6-10 anos" : "11+ anos";
      expBuckets[bucket as keyof typeof expBuckets]++;

      const edu = Array.isArray(a.education) ? a.education[0] : null;
      const level = edu?.level ?? "Não informado";
      schoolMap.set(level, (schoolMap.get(level) ?? 0) + 1);
    }

    return {
      openJobs: openJobs ?? 0,
      totalApps: totalApps ?? 0,
      highFit: highFit ?? 0,
      topApps: topApps.data ?? [],
      areaDist: Array.from(areaMap.entries()).map(([area, n]) => ({ area, n })),
      expBars: Object.entries(expBuckets).map(([faixa, n]) => ({ faixa, n })),
      schooling: Array.from(schoolMap.entries()).map(([name, value]) => ({ name, value })),
    };
  });

export const updateJobQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), questions: z.array(z.string()) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("jobs")
      .update({ custom_questions: data.questions })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
