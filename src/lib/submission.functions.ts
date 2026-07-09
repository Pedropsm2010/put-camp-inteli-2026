import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, newId, insertNotification } from "./db.server";
import { j, parseJson } from "./utils";
import { simulateEvaluation, buildNotification } from "./evaluation";

type AppRow = {
  id: string;
  full_name: string;
  evaluated_at: string | null;
  status: string;
  cultura_score: number | null;
  tecnica_score: number | null;
  fit_final: number | null;
  summary_ai: string | null;
  job_id: string;
};

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      jobId: z.string(),
      full_name: z.string().min(2).max(160),
      email: z.string().email(),
      phone: z.string().max(40).optional(),
      city: z.string().max(120).optional(),
      state: z.string().max(2).optional(),
      linkedin: z.string().max(400).optional(),
      summary: z.string().max(4000).optional(),
      answers: z.record(z.string(), z.string()).default({}),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const id = newId();
    db.prepare(
      `INSERT INTO applications (id, job_id, full_name, email, phone, city, state, linkedin, behavioral_answers, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, data.jobId, data.full_name, data.email, data.phone || null, data.city || null,
      data.state || null, data.linkedin || null, j({ summary: data.summary ?? null, questions: data.answers }), "new",
      new Date().toISOString(),
    );

    const result = simulateEvaluation({
      full_name: data.full_name,
      city: data.city,
      state: data.state,
      linkedin: data.linkedin,
      summary: data.summary ?? null,
      behavioral: data.answers,
    });

    db.prepare(
      `UPDATE applications
       SET cultura_score = ?, tecnica_score = ?, fit_final = ?, fit_score = ?,
           cultura_analysis = ?, tecnica_analysis = ?, summary_ai = ?, evaluated_at = ?, status = ?
       WHERE id = ?`,
    ).run(
      result.cultura, result.tecnica, result.fitFinal, result.fitFinal,
      JSON.stringify({ score: result.cultura, justification: result.culturaJustification }),
      JSON.stringify({ score: result.tecnica, justification: result.tecnicaJustification }),
      result.finalMessage, new Date().toISOString(), "reviewing", id,
    );

    const note = buildNotification({ full_name: data.full_name }, result);
    insertNotification({
      title: note.title,
      body: `${note.body} (${result.band.status})`,
      link: `/candidatos/${id}`,
      kind: "candidate_result",
    });

    return {
      id,
      cultura: result.cultura,
      tecnica: result.tecnica,
      fitFinal: result.fitFinal,
      finalMessage: result.finalMessage,
      band: result.band,
    };
  });

export const listMyApplications = createServerFn({ method: "GET" }).handler(async () => {
  const { currentUserId } = await import("./session.server");
  const id = currentUserId();
  if (!id) throw new Error("Não autenticado");
  const db = getDb();
  const user = db.prepare("SELECT email FROM users WHERE id = ?").get(id) as { email: string } | undefined;
  if (!user) throw new Error("Usuário não encontrado");
  const rows = db
    .prepare(
      `SELECT a.id, a.job_id, a.full_name, a.status, a.fit_final, a.created_at, j.title as job_title, j.slug as job_slug
       FROM applications a LEFT JOIN jobs j ON j.id = a.job_id
       WHERE a.email = ?
       ORDER BY a.created_at DESC`,
    )
    .all(user.email) as any[];
  return rows;
});

export const getCandidateResult = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = getDb();
    const app = db.prepare("SELECT * FROM applications WHERE id = ?").get(data.id) as AppRow | undefined;
    if (!app) throw new Error("Candidatura não encontrada");
    const job = db.prepare("SELECT title FROM jobs WHERE id = ?").get(app.job_id) as { title: string } | undefined;
    return {
      id: app.id,
      full_name: app.full_name,
      evaluated_at: app.evaluated_at,
      status: app.status,
      cultura_score: app.cultura_score,
      tecnica_score: app.tecnica_score,
      fit_final: app.fit_final,
      summary_ai: app.summary_ai,
      jobs: { title: job?.title ?? null },
    };
  });
