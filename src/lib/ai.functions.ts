import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { createLovableAi, getLovableApiKey } from "./ai-gateway.server";

const MODEL = "google/gemini-2.5-flash";

function fmtApplication(app: Record<string, unknown>): string {
  const job = (app.jobs ?? {}) as Record<string, unknown>;
  const parts = [
    `Vaga: ${job.title ?? "?"} (${job.area ?? "?"} · ${job.level ?? "-"})`,
    `Requisitos: ${job.requirements ?? "-"}`,
    `Skills desejadas: ${(job.desired_skills as string[] | undefined)?.join(", ") ?? "-"}`,
    `Idiomas exigidos: ${(job.required_languages as string[] | undefined)?.join(", ") ?? "-"}`,
    `Certificações exigidas: ${(job.required_certifications as string[] | undefined)?.join(", ") ?? "-"}`,
    `Escolaridade mínima: ${job.min_education ?? "-"}`,
    `Anos exp. mínimos: ${job.min_experience_years ?? 0}`,
    "",
    `Candidato: ${app.full_name}`,
    `Localização: ${app.city ?? "-"}/${app.state ?? "-"}`,
    `LinkedIn: ${app.linkedin ?? "-"}`,
    `Formação: ${JSON.stringify(app.education ?? [])}`,
    `Experiência: ${JSON.stringify(app.experience ?? [])}`,
    `Idiomas: ${JSON.stringify(app.languages ?? [])}`,
    `Certificações: ${JSON.stringify(app.certifications ?? [])}`,
    `Respostas comportamentais: ${JSON.stringify(app.behavioral_answers ?? {})}`,
  ];
  return parts.join("\n");
}

export const evaluateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: app, error } = await context.supabase
      .from("applications")
      .select("*, jobs(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!app) throw new Error("Candidato não encontrado");

    const provider = createLovableAi(getLovableApiKey());
    const model = provider(MODEL);
    const contexto = fmtApplication(app as Record<string, unknown>);

    // Agente CULTURA AZUL
    const culturaPrompt = `Você é o agente CULTURA AZUL, especializado em avaliar fit cultural de candidatos para a Azul Linhas Aéreas.
Analise o candidato abaixo em 7 dimensões: Trabalho em equipe, Comunicação, Atendimento ao cliente, Adaptabilidade, Resolução de problemas, Segurança, Valores organizacionais.
Considere que a Azul valoriza: paixão pelo cliente, gente que gosta de gente, segurança em primeiro lugar, simplicidade e inovação.
Retorne uma nota de 0 a 100 e uma justificativa detalhada (máx. 180 palavras).

===== DADOS DO CANDIDATO =====
${contexto}`;

    // Agente TÉCNICO
    const tecnicoPrompt = `Você é o agente AVALIADOR TÉCNICO, especializado em avaliar competências técnicas para vagas da Azul Linhas Aéreas.
Analise formação, certificações, experiência, conhecimentos técnicos, idiomas e requisitos específicos da vaga.
Retorne uma nota de 0 a 100 e uma justificativa detalhada (máx. 180 palavras).

===== DADOS DA VAGA + CANDIDATO =====
${contexto}`;

    const schema = z.object({
      score: z.number().min(0).max(100),
      justification: z.string(),
    });

    const [culturaRes, tecnicaRes] = await Promise.all([
      generateText({
        model,
        output: Output.object({ schema }),
        prompt: culturaPrompt,
      }),
      generateText({
        model,
        output: Output.object({ schema }),
        prompt: tecnicoPrompt,
      }),
    ]);

    const cultura = culturaRes.output;
    const tecnica = tecnicaRes.output;
    const fitFinal = Math.round(cultura.score * 0.4 + tecnica.score * 0.6);

    // Resumo executivo curto
    const resumoRes = await generateText({
      model,
      prompt: `Em no máximo 90 palavras, gere um resumo executivo do fit deste candidato para a vaga.
Cultura: ${cultura.score}/100 — ${cultura.justification}
Técnica: ${tecnica.score}/100 — ${tecnica.justification}
Fit Final: ${fitFinal}/100.`,
    });

    const { error: upErr } = await context.supabase
      .from("applications")
      .update({
        cultura_score: cultura.score,
        tecnica_score: tecnica.score,
        fit_final: fitFinal,
        fit_score: fitFinal,
        cultura_analysis: cultura,
        tecnica_analysis: tecnica,
        summary_ai: resumoRes.text,
        evaluated_at: new Date().toISOString(),
        status: "reviewing",
      })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    return { cultura, tecnica, fitFinal, summary: resumoRes.text };
  });

export const copilotoAsk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      question: z.string().min(2).max(600),
      history: z
        .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
        .default([]),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    // Contexto leve: últimas vagas e top candidatos avaliados
    const [{ data: jobs }, { data: apps }] = await Promise.all([
      context.supabase
        .from("jobs")
        .select("id, title, area, level, location, status, required_languages, required_certifications, desired_skills")
        .order("created_at", { ascending: false })
        .limit(30),
      context.supabase
        .from("applications")
        .select("id, full_name, city, state, fit_final, cultura_score, tecnica_score, status, jobs(title, area), languages, certifications, experience")
        .order("fit_final", { ascending: false, nullsFirst: false })
        .limit(60),
    ]);

    const system = `Você é o COPILOTO IA da Azul Talent Hub — assistente conversacional para o time de RH da Azul Linhas Aéreas.
Responda SEMPRE em português, de forma objetiva, executiva e amigável.
Use APENAS os dados abaixo (banco atual da plataforma) para responder. Se não houver dado suficiente, diga que ainda não há candidatos suficientes com essa informação.

===== VAGAS (${jobs?.length ?? 0}) =====
${JSON.stringify(jobs ?? [], null, 0)}

===== CANDIDATOS (${apps?.length ?? 0}) =====
${JSON.stringify(apps ?? [], null, 0)}`;

    const provider = createLovableAi(getLovableApiKey());
    const model = provider(MODEL);
    const result = await generateText({
      model,
      system,
      messages: [
        ...data.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: data.question },
      ],
    });

    return { answer: result.text };
  });

export const generateExecutiveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: jobs, count: totalJobs }, { data: apps, count: totalApps }] = await Promise.all([
      context.supabase.from("jobs").select("id, title, area, status, min_education", { count: "exact" }),
      context.supabase
        .from("applications")
        .select("id, fit_final, cultura_score, tecnica_score, experience, education, languages, certifications, status, jobs(area)", { count: "exact" }),
    ]);

    const evaluated = (apps ?? []).filter((a) => a.fit_final != null);
    const media =
      evaluated.length > 0
        ? Math.round(evaluated.reduce((s, a) => s + (a.fit_final ?? 0), 0) / evaluated.length)
        : 0;

    const provider = createLovableAi(getLovableApiKey());
    const model = provider(MODEL);
    const prompt = `Você é um analista sênior de RH da Azul. Gere um relatório executivo em Markdown (headings, listas, sem tabelas complexas) com base nos dados abaixo. Seções obrigatórias:
1. Visão geral
2. Principais competências encontradas
3. Distribuição de experiência
4. Distribuição de escolaridade
5. Recomendações práticas para entrevistas (bullet points)

Contexto:
- Total vagas: ${totalJobs ?? 0}
- Vagas abertas: ${(jobs ?? []).filter((j) => j.status === "open").length}
- Total candidaturas: ${totalApps ?? 0}
- Candidatos avaliados por IA: ${evaluated.length}
- Média Fit Azul: ${media}/100

Amostra (JSON): ${JSON.stringify((apps ?? []).slice(0, 40))}`;

    const res = await generateText({ model, prompt });
    return {
      markdown: res.text,
      stats: {
        totalJobs: totalJobs ?? 0,
        openJobs: (jobs ?? []).filter((j) => j.status === "open").length,
        totalApps: totalApps ?? 0,
        evaluated: evaluated.length,
        avgFit: media,
      },
    };
  });
