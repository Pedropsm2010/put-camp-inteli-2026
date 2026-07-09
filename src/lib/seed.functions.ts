import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FIRST_NAMES = [
  "Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique",
  "Isabela", "João", "Karina", "Leonardo", "Larissa", "Marcelo", "Natália", "Otávio",
  "Patrícia", "Rafael", "Sabrina", "Thiago", "Vanessa", "Wagner", "Yasmin", "Rodrigo",
  "Camila", "Diego", "Fernanda", "Gustavo", "Helena", "Ícaro", "Juliana", "Lucas",
  "Marina", "Nicolas", "Priscila", "Renan", "Sofia", "Tatiana", "Vitor", "Amanda",
];
const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida", "Costa",
  "Gomes", "Martins", "Araújo", "Ribeiro", "Carvalho", "Lima", "Barbosa", "Rocha",
  "Pereira", "Nascimento", "Pinto", "Moreira",
];
const CITIES: [string, string][] = [
  ["São Paulo", "SP"], ["Guarulhos", "SP"], ["Campinas", "SP"], ["Rio de Janeiro", "RJ"],
  ["Belo Horizonte", "MG"], ["Recife", "PE"], ["Salvador", "BA"], ["Curitiba", "PR"],
  ["Porto Alegre", "RS"], ["Fortaleza", "CE"], ["Brasília", "DF"], ["Manaus", "AM"],
];
const LANGS = ["Inglês", "Espanhol", "Francês", "Alemão", "Mandarim", "Italiano"];
const EDU_LEVELS = ["Ensino Médio", "Técnico", "Superior", "Pós-graduação"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch jobs
    const { data: jobs, error: jobsErr } = await supabaseAdmin
      .from("jobs")
      .select("id, title, area")
      .eq("status", "open");
    if (jobsErr) throw new Error(jobsErr.message);
    if (!jobs || jobs.length === 0) {
      throw new Error("Crie ao menos uma vaga antes de popular candidatos.");
    }

    // Skip if already seeded
    const { count } = await supabaseAdmin
      .from("applications")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) >= 100) {
      return { ok: true, inserted: 0, skipped: true };
    }

    const target = 100;
    const toInsert: Array<Record<string, unknown>> = [];
    for (let i = 0; i < target; i++) {
      const first = pick(FIRST_NAMES);
      const last1 = pick(LAST_NAMES);
      const last2 = pick(LAST_NAMES);
      const full = `${first} ${last1} ${last2}`;
      const job = pick(jobs);
      const [city, state] = pick(CITIES);
      const fitScore = rand(40, 100);
      const cultura = Math.min(100, Math.max(0, fitScore + rand(-10, 10)));
      const tecnica = Math.min(100, Math.max(0, fitScore + rand(-10, 10)));
      const fitFinal = Math.round(cultura * 0.4 + tecnica * 0.6);
      const yearsExp = rand(0, 18);
      const status: string =
        fitFinal >= 90 ? (Math.random() < 0.5 ? "interview" : "offer")
          : fitFinal >= 75 ? "reviewing"
            : fitFinal >= 55 ? "new"
              : Math.random() < 0.25 ? "rejected" : "new";

      const emailBase = `${first}.${last1}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "");
      toInsert.push({
        job_id: job.id,
        full_name: full,
        email: `${emailBase}${i}@example.com`,
        phone: `+55 ${rand(11, 85)} 9${rand(1000, 9999)}-${rand(1000, 9999)}`,
        city,
        state,
        linkedin: `https://linkedin.com/in/${emailBase}${i}`,
        education: [
          { level: pick(EDU_LEVELS), institution: pick(["USP", "Unicamp", "PUC", "UFRJ", "Mackenzie", "FGV"]), field: job.area },
        ],
        experience: [
          { role: `Profissional em ${job.area}`, company: pick(["LATAM", "GOL", "Azul", "Embraer", "Boeing", "Independente"]), years: yearsExp },
        ],
        languages: Array.from({ length: rand(1, 3) }).map(() => ({ name: pick(LANGS), level: pick(["Básico", "Intermediário", "Avançado", "Fluente"]) })),
        certifications: rand(0, 3) > 0 ? [{ name: pick(["ICAO 5", "CMS", "IATA", "Six Sigma", "AWS", "Scrum"]), issuer: pick(["ANAC", "IATA", "Cloud Guru"]) }] : [],
        behavioral_answers: { summary: `Profissional com ${yearsExp} anos de experiência em ${job.area.toLowerCase()}.` },
        fit_score: fitScore,
        cultura_score: cultura,
        tecnica_score: tecnica,
        fit_final: fitFinal,
        summary_ai: `${full} demonstra fit ${fitFinal >= 85 ? "excelente" : fitFinal >= 70 ? "bom" : "moderado"} para a vaga de ${job.title}.`,
        evaluated_at: new Date().toISOString(),
        status,
      });
    }

    // Insert in batches of 25
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += 25) {
      const batch = toInsert.slice(i, i + 25);
      const { error } = await (supabaseAdmin as any).from("applications").insert(batch);
      if (error) throw new Error(error.message);
      inserted += batch.length;
    }

    // Seed a few notifications for the current user
    const notifs = [
      { kind: "new_application", title: "Nova candidatura enviada", body: "5 novos candidatos aplicaram nas últimas horas.", link: "/candidatos" },
      { kind: "high_fit", title: "Candidato com Fit Azul acima de 90", body: "Confira os talentos de alto potencial detectados pela IA.", link: "/candidatos" },
      { kind: "ai_approved", title: "Novo candidato aprovado pela IA", body: "Um perfil foi automaticamente sinalizado como aprovado.", link: "/candidatos" },
      { kind: "cv_received", title: "Novo currículo recebido", body: "Currículo adicionado ao banco de talentos.", link: "/candidatos" },
      { kind: "job_created", title: "Vaga criada", body: "Uma nova vaga foi publicada na plataforma.", link: "/vagas" },
    ];
    await supabaseAdmin.from("notifications").insert(
      notifs.map((n) => ({ ...n, user_id: context.userId })),
    );

    return { ok: true, inserted, skipped: false };
  });

export const clearDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("applications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
