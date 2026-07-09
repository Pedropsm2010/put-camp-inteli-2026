import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb } from "./db.server";
import { parseJson, mapJob } from "./utils";

type Row = Record<string, any>;

function mapApplication(row: Row): any {
  return {
    ...row,
    behavioral_answers: parseJson(row.behavioral_answers, null),
    education: parseJson(row.education, []),
    experience: parseJson(row.experience, []),
    languages: parseJson(row.languages, []),
    certifications: parseJson(row.certifications, []),
    cultura_analysis: parseJson(row.cultura_analysis, null),
    tecnica_analysis: parseJson(row.tecnica_analysis, null),
    ai_analysis: parseJson(row.ai_analysis, null),
    certificate_urls: parseJson(row.certificate_urls, null),
    cultura_score: row.cultura_score ?? null,
    tecnica_score: row.tecnica_score ?? null,
    fit_final: row.fit_final ?? null,
    fit_score: row.fit_score ?? null,
  };
}

export const listApplications = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.*, j.title as job_title, j.area as job_area, j.location as job_location
       FROM applications a LEFT JOIN jobs j ON j.id = a.job_id
       ORDER BY a.created_at DESC`,
    )
    .all() as Row[];
  return rows.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    state: r.state,
    job_id: r.job_id,
    status: r.status,
    fit_final: r.fit_final,
    fit_score: r.fit_score,
    cultura_score: r.cultura_score,
    tecnica_score: r.tecnica_score,
    evaluated_at: r.evaluated_at,
    created_at: r.created_at,
    jobs: { title: r.job_title, area: r.job_area, location: r.job_location },
  }));
});

export const getApplication = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = getDb();
    const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(data.id) as Row | undefined;
    if (!row) throw new Error("Candidato não encontrado");
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(row.job_id) as Row | undefined;
    return { ...mapApplication(row), jobs: job ? mapJob(job) : {} };
  });

export const updateApplicationNotes = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), notes: z.string() }))
  .handler(async ({ data }) => {
    getDb().prepare("UPDATE applications SET notes = ? WHERE id = ?").run(data.notes, data.id);
    return { ok: true };
  });

export const setApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      status: z.enum(["new", "reviewing", "interview", "offer", "hired", "rejected"]),
    }),
  )
  .handler(async ({ data }) => {
    getDb().prepare("UPDATE applications SET status = ? WHERE id = ?").run(data.status, data.id);
    return { ok: true };
  });


