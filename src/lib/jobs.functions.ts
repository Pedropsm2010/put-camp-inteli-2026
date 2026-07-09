import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, newId } from "./db.server";
import { parseJson, j, mapJob } from "./utils";

const JobInputSchema = z.object({
  title: z.string().min(2).max(120),
  area: z.string().min(2).max(80),
  level: z.string().max(60).optional().nullable(),
  description: z.string().min(10),
  requirements: z.string().min(5),
  desired_skills: z.array(z.string()).default([]),
  required_languages: z.array(z.string()).default([]),
  required_certifications: z.array(z.string()).default([]),
  min_education: z.string().optional().nullable(),
  min_experience_years: z.number().int().min(0).max(50).default(0),
  location: z.string().min(2).max(120),
  employment_type: z.enum(["clt", "pj", "estagio", "temporario", "freelancer"]).default("clt"),
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  deadline: z.string().nullable().optional(),
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

export const listJobs = createServerFn({ method: "GET" }).handler(async () => {
  const rows = getDb().prepare("SELECT * FROM jobs ORDER BY created_at DESC").all() as Record<string, any>[];
  return rows.map(mapJob);
});

export const getJobBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const row = getDb().prepare("SELECT * FROM jobs WHERE slug = ?").get(data.slug) as Record<string, any> | undefined;
    return row ? mapJob(row) : null;
  });

export const createJob = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => JobInputSchema.parse(raw))
  .handler(async ({ data }) => {
    const id = newId();
    const insert = { ...data, id, slug: slugify(data.title), status: "open", custom_questions: data.custom_questions ?? [], created_at: new Date().toISOString() };
    getDb()
      .prepare(
        `INSERT INTO jobs (id, slug, title, area, level, description, requirements, location, status, tags, custom_questions, desired_skills, required_languages, required_certifications, min_education, min_experience_years, employment_type, salary_min, salary_max, deadline, icon, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        insert.id, insert.slug, insert.title, insert.area, insert.level ?? null, insert.description, insert.requirements, insert.location, insert.status,
        j(insert.tags), j(insert.custom_questions), j(insert.desired_skills), j(insert.required_languages), j(insert.required_certifications),
        insert.min_education ?? null, insert.min_experience_years, insert.employment_type, insert.salary_min ?? null, insert.salary_max ?? null,
        insert.deadline ?? null, insert.icon, insert.created_at, "",
      );
    return insert;
  });

export const updateJob = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), patch: JobInputSchema.partial() }).transform((v) => ({ ...v, patch: { ...v.patch, custom_questions: v.patch.custom_questions ?? undefined } })))
  .handler(async ({ data }) => {
    const patch: Record<string, unknown> = { ...data.patch };
    const sets = Object.keys(patch).filter((k) => patch[k] !== undefined).map((k) => `${k} = ?`);
    const values = Object.keys(patch).filter((k) => patch[k] !== undefined).map((k) => {
      if (["tags", "custom_questions", "desired_skills", "required_languages", "required_certifications"].includes(k)) return j(patch[k]);
      return patch[k];
    });
    if (sets.length === 0) return { ok: true };
    getDb().prepare(`UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`).run(...(values as (string | number | null)[]), data.id);
    return { ok: true };
  });

export const setJobStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), status: z.enum(["open", "closed"]) }))
  .handler(async ({ data }) => {
    getDb().prepare("UPDATE jobs SET status = ? WHERE id = ?").run(data.status, data.id);
    return { ok: true };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    getDb().prepare("DELETE FROM jobs WHERE id = ?").run(data.id);
    return { ok: true };
  });

export const updateJobQuestions = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), questions: z.array(z.string()) }))
  .handler(async ({ data }) => {
    getDb().prepare("UPDATE jobs SET custom_questions = ? WHERE id = ?").run(j(data.questions), data.id);
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  const openJobs = (db.prepare("SELECT COUNT(*) c FROM jobs WHERE status = 'open'").get() as { c: number }).c;
  const totalApps = (db.prepare("SELECT COUNT(*) c FROM applications").get() as { c: number }).c;
  const highFit = (db.prepare("SELECT COUNT(*) c FROM applications WHERE fit_score >= 85").get() as { c: number }).c;
  const topApps = db
    .prepare(
      `SELECT a.id, a.full_name, a.fit_score, a.fit_final, a.job_id, j.title as job_title
       FROM applications a LEFT JOIN jobs j ON j.id = a.job_id
       ORDER BY a.fit_score DESC LIMIT 10`,
    )
    .all() as Record<string, any>[];
  const allApps = db
    .prepare("SELECT a.experience, a.education, j.area as jobs_area FROM applications a LEFT JOIN jobs j ON j.id = a.job_id")
    .all() as any[];

  const areaMap = new Map<string, number>();
  const expBuckets: Record<string, number> = { "0-2 anos": 0, "3-5 anos": 0, "6-10 anos": 0, "11+ anos": 0 };
  const schoolMap = new Map<string, number>();
  for (const a of allApps) {
    const area = (a.jobs_area as string) || "Outros";
    areaMap.set(area, (areaMap.get(area) ?? 0) + 1);
    const exp = Array.isArray(a.experience) ? a.experience[0] : parseJson(a.experience, [])[0] ?? null;
    const years = Number(exp?.years ?? 0);
    const bucket = years <= 2 ? "0-2 anos" : years <= 5 ? "3-5 anos" : years <= 10 ? "6-10 anos" : "11+ anos";
    expBuckets[bucket]++;
    const edu = Array.isArray(a.education) ? a.education[0] : parseJson(a.education, [])[0] ?? null;
    const level = edu?.level ?? "Não informado";
    schoolMap.set(level, (schoolMap.get(level) ?? 0) + 1);
  }

  return {
    openJobs,
    totalApps,
    highFit,
    topApps: topApps.map((a) => ({ ...a, jobs: { title: a.job_title } })),
    areaDist: Array.from(areaMap.entries()).map(([area, n]) => ({ area, n })),
    expBars: Object.entries(expBuckets).map(([faixa, n]) => ({ faixa, n })),
    schooling: Array.from(schoolMap.entries()).map(([name, value]) => ({ name, value })),
  };
});
