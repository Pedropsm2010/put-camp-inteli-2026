import { createServerFn } from "@tanstack/react-start";
import { getDb, newId } from "./db.server";
import { j } from "./utils";
import { currentUserId } from "./session.server";

const FIRST_NAMES = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João", "Karina", "Leonardo", "Larissa", "Marcelo", "Natália", "Otávio", "Patrícia", "Rafael", "Sabrina", "Thiago", "Vanessa", "Wagner", "Yasmin", "Rodrigo", "Camila", "Diego", "Fernanda", "Gustavo", "Helena", "Ícaro", "Juliana", "Lucas", "Marina", "Nicolas", "Priscila", "Renan", "Sofia", "Tatiana", "Vitor", "Amanda"];
const LAST_NAMES = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida", "Costa", "Gomes", "Martins", "Araújo", "Ribeiro", "Carvalho", "Lima", "Barbosa", "Rocha", "Pereira", "Nascimento", "Pinto", "Moreira"];
const CITIES: [string, string][] = [["São Paulo", "SP"], ["Guarulhos", "SP"], ["Campinas", "SP"], ["Rio de Janeiro", "RJ"], ["Belo Horizonte", "MG"], ["Recife", "PE"], ["Salvador", "BA"], ["Curitiba", "PR"], ["Porto Alegre", "RS"], ["Fortaleza", "CE"], ["Brasília", "DF"], ["Manaus", "AM"]];
const LANGS = ["Inglês", "Espanhol", "Francês", "Alemão", "Mandarim", "Italiano"];
const EDU_LEVELS = ["Ensino Médio", "Técnico", "Superior", "Pós-graduação"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export const seedDemoData = createServerFn({ method: "POST" }).handler(async () => {
  const db = getDb();
  const jobs = db.prepare("SELECT id, title, area FROM jobs WHERE status = 'open'").all() as Record<string, any>[];
  if (!jobs.length) throw new Error("Crie ao menos uma vaga antes de popular candidatos.");

  const count = (db.prepare("SELECT COUNT(*) c FROM applications").get() as { c: number }).c;
  if (count >= 100) return { ok: true, inserted: 0, skipped: true };

  const target = 100;
  const insert = db.prepare(
    `INSERT INTO applications (id, job_id, full_name, email, phone, city, state, linkedin, behavioral_answers, education, experience, languages, certifications, cultura_score, tecnica_score, fit_final, fit_score, summary_ai, status, evaluated_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
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
    const status = fitFinal >= 90 ? (Math.random() < 0.5 ? "interview" : "offer") : fitFinal >= 75 ? "reviewing" : fitFinal >= 55 ? "new" : Math.random() < 0.25 ? "rejected" : "new";
    const emailBase = `${first}.${last1}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "");
    insert.run(
      newId(), job.id, full, `${emailBase}${i}@example.com`, `+55 ${rand(11, 85)} 9${rand(1000, 9999)}-${rand(1000, 9999)}`, city, state, `https://linkedin.com/in/${emailBase}${i}`,
      j({ summary: `Profissional com ${yearsExp} anos de experiência em ${job.area.toLowerCase()}.` }),
      j([{ level: pick(EDU_LEVELS), institution: pick(["USP", "Unicamp", "PUC", "UFRJ", "Mackenzie", "FGV"]), field: job.area }]),
      j([{ role: `Profissional em ${job.area}`, company: pick(["LATAM", "GOL", "Azul", "Embraer", "Boeing", "Independente"]), years: yearsExp }]),
      j(Array.from({ length: rand(1, 3) }).map(() => ({ name: pick(LANGS), level: pick(["Básico", "Intermediário", "Avançado", "Fluente"]) }))),
      j(rand(0, 3) > 0 ? [{ name: pick(["ICAO 5", "CMS", "IATA", "Six Sigma", "AWS", "Scrum"]), issuer: pick(["ANAC", "IATA", "Cloud Guru"]) }] : []),
      cultura, tecnica, fitFinal, fitFinal,
      `${full} demonstra fit ${fitFinal >= 85 ? "excelente" : fitFinal >= 70 ? "bom" : "moderado"} para a vaga de ${job.title}.`,
      status, new Date().toISOString(), new Date().toISOString(),
    );
  }

  const userId = currentUserId();
  const notifs = [
    { kind: "new_application", title: "Nova candidatura enviada", body: "100 novos candidatos aplicaram na plataforma.", link: "/candidatos" },
    { kind: "high_fit", title: "Candidato com Fit Azul alto", body: "Confira os talentos de alto potencial detectados.", link: "/candidatos" },
    { kind: "ai_approved", title: "Candidato avaliado pela IA", body: "Perfis sinalizados automaticamente.", link: "/candidatos" },
    { kind: "cv_received", title: "Novo currículo recebido", body: "Currículo adicionado ao banco de talentos.", link: "/candidatos" },
    { kind: "job_created", title: "Vaga criada", body: "Uma nova vaga foi publicada na plataforma.", link: "/vagas" },
  ];
  const insN = db.prepare("INSERT INTO notifications (id, user_id, title, body, kind, link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (const n of notifs) insN.run(newId(), userId, n.title, n.body, n.kind, n.link, new Date().toISOString());

  return { ok: true, inserted: target, skipped: false };
});

export const clearDemoData = createServerFn({ method: "POST" }).handler(async () => {
  getDb().prepare("DELETE FROM applications").run();
  return { ok: true };
});
