import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb } from "./db.server";
import { parseJson } from "./utils";
import { simulateEvaluation, buildNotification } from "./evaluation";
import { insertNotification } from "./db.server";

// Avaliação simulada (POC local, sem IA real) — 3 agentes: cultura, técnica e média final.
export const evaluateApplication = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = getDb();
    const app = db.prepare("SELECT * FROM applications WHERE id = ?").get(data.id) as Record<string, any> | undefined;
    if (!app) throw new Error("Candidato não encontrado");
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(app.job_id) as Record<string, any> | undefined;

    const beh = parseJson<{ summary?: string; questions?: Record<string, string> }>(app.behavioral_answers, {});
    const result = simulateEvaluation({
      full_name: String(app.full_name ?? ""),
      city: app.city,
      state: app.state,
      linkedin: app.linkedin,
      summary: beh.summary ?? null,
      behavioral: beh.questions ?? null,
      education: parseJson(app.education, []),
      experience: parseJson(app.experience, []),
      languages: parseJson(app.languages, []),
      certifications: parseJson(app.certifications, []),
      jobTitle: job?.title ? String(job.title) : undefined,
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
      result.finalMessage, new Date().toISOString(), "reviewing", data.id,
    );

    const note = buildNotification({ full_name: String(app.full_name ?? "") }, result);
    insertNotification({
      title: `Avaliação concluída: ${app.full_name}`,
      body: `${note.body} (${result.band.status})`,
      link: `/candidatos/${data.id}`,
      kind: "candidate_result",
    });

    return { cultura: result.cultura, tecnica: result.tecnica, fitFinal: result.fitFinal, summary: result.finalMessage };
  });

// Copiloto IA simulado (POC local).
export const copilotoAsk = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      question: z.string().min(2).max(600),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).default([]),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const totalApps = (db.prepare("SELECT COUNT(*) c FROM applications").get() as { c: number }).c;
    const openJobs = (db.prepare("SELECT COUNT(*) c FROM jobs WHERE status = 'open'").get() as { c: number }).c;
    const evaluated = (db.prepare("SELECT COUNT(*) c FROM applications WHERE evaluated_at IS NOT NULL").get() as { c: number }).c;
    const answer =
      `Esta é uma resposta simulada do Copiloto IA (POC local, sem IA externa) para: "${data.question}".\n\n` +
      `Resumo atual da plataforma: ${openJobs} vaga(s) aberta(s), ${totalApps} candidatura(s) e ${evaluated} avaliada(s) pela IA. ` +
      `Posso ajudar com filtros de candidatos, resumos de vagas e sugestões de triagem.`;
    return { answer };
  });

// Relatório executivo simulado (POC local).
export const generateExecutiveReport = createServerFn({ method: "POST" }).handler(async () => {
  const db = getDb();
  const totalJobs = (db.prepare("SELECT COUNT(*) c FROM jobs").get() as { c: number }).c;
  const openJobs = (db.prepare("SELECT COUNT(*) c FROM jobs WHERE status = 'open'").get() as { c: number }).c;
  const totalApps = (db.prepare("SELECT COUNT(*) c FROM applications").get() as { c: number }).c;
  const evaluated = (db.prepare("SELECT COUNT(*) c FROM applications WHERE evaluated_at IS NOT NULL").get() as { c: number }).c;
  const avg = evaluated > 0
    ? Math.round((db.prepare("SELECT AVG(fit_final) a FROM applications WHERE evaluated_at IS NOT NULL").get() as { a: number }).a)
    : 0;

  const markdown = `# Relatório Executivo — Azul Talent (POC local)

## Visão geral
- Total de vagas: ${totalJobs} (${openJobs} abertas)
- Total de candidaturas: ${totalApps}
- Candidatos avaliados pela IA: ${evaluated}
- Média Fit Azul: ${avg}/100

## Principais competências encontradas
Os perfis avaliados apresentam distribuição variada de fit cultural e técnico. Recomenda-se priorizar candidatos com nota final acima de 70%.

## Recomendações práticas
- Revisar candidatos na faixa "Precisa de revisão humana" (60-69%).
- Encaminhar os "Altamente recomendados" (80%+) ao RH.
- Usar o Copiloto IA para triar grandes volumes.`;

  return { markdown, stats: { totalJobs, openJobs, totalApps, evaluated, avgFit: avg } };
});
