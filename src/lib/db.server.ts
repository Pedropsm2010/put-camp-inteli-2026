// Banco de dados local (POC) usando node:sqlite — sem dependências externas.
// Arquivo server-only: importado apenas dentro de server functions.
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import { j, parseJson } from "./utils";

const DB_PATH = process.env.LOCAL_DB_PATH || join(process.cwd(), "local.db");

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  _db = new DatabaseSync(DB_PATH);
  _db.exec("PRAGMA journal_mode = WAL;");
  ensureSchema(_db);
  seedIfEmpty(_db);
  return _db;
}

export function insertNotification(n: {
  title: string;
  body: string;
  kind: string;
  link: string | null;
  userId?: string | null;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO notifications (id, user_id, title, body, kind, link, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(newId(), n.userId ?? null, n.title, n.body, n.kind, n.link, new Date().toISOString());
}

export function newId(): string {
  return randomUUID();
}

// ---------- Auth helpers ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(derived, "hex");
  const b = Buffer.from(key, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- Schema ----------
function ensureSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      full_name TEXT,
      job_title TEXT,
      role TEXT DEFAULT 'recruiter',
      company TEXT,
      avatar_url TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS recruiter_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT,
      fit_weights TEXT,
      notify_new_application INTEGER DEFAULT 1,
      notify_high_fit INTEGER DEFAULT 1,
      notify_deadline INTEGER DEFAULT 1,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      title TEXT,
      area TEXT,
      level TEXT,
      description TEXT,
      requirements TEXT,
      location TEXT,
      status TEXT DEFAULT 'open',
      tags TEXT,
      custom_questions TEXT,
      desired_skills TEXT,
      required_languages TEXT,
      required_certifications TEXT,
      min_education TEXT,
      min_experience_years INTEGER DEFAULT 0,
      employment_type TEXT,
      salary_min REAL,
      salary_max REAL,
      deadline TEXT,
      icon TEXT,
      created_at TEXT,
      created_by TEXT
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      full_name TEXT,
      email TEXT,
      phone TEXT,
      city TEXT,
      state TEXT,
      linkedin TEXT,
      behavioral_answers TEXT,
      education TEXT,
      experience TEXT,
      languages TEXT,
      certifications TEXT,
      cultura_score INTEGER,
      tecnica_score INTEGER,
      fit_final INTEGER,
      fit_score INTEGER,
      cultura_analysis TEXT,
      tecnica_analysis TEXT,
      summary_ai TEXT,
      status TEXT DEFAULT 'new',
      notes TEXT,
      evaluated_at TEXT,
      created_at TEXT,
      ai_analysis TEXT,
      photo_url TEXT,
      resume_url TEXT,
      birth_date TEXT,
      cpf TEXT,
      certificate_urls TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      body TEXT,
      kind TEXT,
      link TEXT,
      read_at TEXT,
      created_at TEXT
    );
  `);
}

// ---------- Seed inicial ----------
const JOB_AREAS = [
  { title: "Piloto Comercial", area: "Operação de Voo", description: "Atuar na operação de voos da Azul garantindo segurança e experiência.", requirements: "Licença ATPL, habilitação multiemotor, Inglês técnico.", location: "Campinas, SP" },
  { title: "Analista de Dados", area: "Tecnologia", description: "Construir dashboards e modelos para áreas de negócio.", requirements: "SQL, Python, experiência com BI.", location: "São Paulo, SP" },
  { title: "Auxiliar de Cabine", area: "Atendimento", description: "Garantir segurança e acolhimento aos clientes a bordo.", requirements: "Ensino médio, inglês básico, disponibilidade de viagens.", location: "Viracopos, SP" },
];

function seedIfEmpty(db: DatabaseSync) {
  const jobCount = (db.prepare("SELECT COUNT(*) c FROM jobs").get() as { c: number }).c;
  if (jobCount > 0) return;

  // Usuário RH padrão
  const userId = newId();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, job_title, role, company, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(userId, "rh@azul.com", hashPassword("azul1234"), "Recrutador Azul", "Recrutador(a)", "recruiter", "Azul Linhas Aéreas", new Date().toISOString());
  db.prepare(
    `INSERT INTO recruiter_settings (user_id, theme, fit_weights, updated_at)
     VALUES (?, ?, ?, ?)`,
  ).run(userId, "azul", j({ cultura: 40, tecnica: 60 }), new Date().toISOString());

  // Usuário candidato demo (login rápido na tela inicial)
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, job_title, role, company, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(newId(), "candidato@azul.com", hashPassword("azul1234"), "Ana Candidata", null, "candidate", null, new Date().toISOString());

  // Vagas
  const seedJobs: { id: string; title: string; area: string }[] = [];
  for (const job of JOB_AREAS) {
    const id = newId();
    seedJobs.push({ id, title: job.title, area: job.area });
    const slug = `${job.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${Math.random().toString(36).slice(2, 7)}`;
    db.prepare(
      `INSERT INTO jobs (id, slug, title, area, level, description, requirements, location, status, tags, custom_questions, desired_skills, required_languages, required_certifications, min_education, min_experience_years, employment_type, icon, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, slug, job.title, job.area, "Pleno", job.description, job.requirements, job.location, "open",
      j(["cultura", "tecnologia"]), j([]), j([job.area]), j(["Inglês"]), j([]), "superior", 2, "clt", "briefcase",
      new Date().toISOString(), userId,
    );
  }

  // Candidatos de exemplo
  const first = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João", "Karina", "Lucas"];
  const last = ["Silva", "Santos", "Oliveira", "Souza", "Ferreira", "Almeida", "Costa", "Lima"];
  for (let i = 0; i < 12; i++) {
    const fn = first[i % first.length];
    const ln = last[i % last.length];
    const full = `${fn} ${ln}`;
    const job = seedJobs[i % seedJobs.length];
    const jobId = job.id;
    const fit = 45 + ((i * 7) % 55);
    const cultura = Math.min(100, fit + (i % 5));
    const tecnica = Math.min(100, fit - (i % 4));
    const fitFinal = Math.round(cultura * 0.4 + tecnica * 0.6);
    db.prepare(
      `INSERT INTO applications (id, job_id, full_name, email, phone, city, state, linkedin, behavioral_answers, education, experience, languages, certifications, cultura_score, tecnica_score, fit_final, fit_score, summary_ai, status, evaluated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      newId(), jobId, full, `${fn}.${ln}${i}@example.com`.toLowerCase(), `+55 11 9${1000 + i * 37}-${1000 + i * 11}`, "São Paulo", "SP", `https://linkedin.com/in/${fn}${ln}${i}`,
      j({ summary: `Profissional com ${2 + (i % 10)} anos de experiência em ${job.area}.` }),
      j([{ level: "Superior", institution: "USP", field: job.area }]),
      j([{ role: `Profissional em ${job.area}`, company: "Azul", years: 2 + (i % 10) }]),
      j([{ name: "Inglês", level: "Avançado" }]),
      j([{ name: "IATA", issuer: "IATA" }]),
      cultura, tecnica, fitFinal, fitFinal,
      `${full} demonstra fit ${fitFinal >= 85 ? "excelente" : fitFinal >= 70 ? "bom" : "moderado"} para a vaga.`,
      "reviewing", new Date().toISOString(), new Date().toISOString(),
    );
  }

  // Candidatura demo da Ana Candidata (para o login rápido "Entrar como Candidato")
  const demoJob = seedJobs[1] ?? seedJobs[0];
  db.prepare(
    `INSERT INTO applications (id, job_id, full_name, email, phone, city, state, linkedin, behavioral_answers, education, experience, languages, certifications, cultura_score, tecnica_score, fit_final, fit_score, summary_ai, status, evaluated_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    newId(), demoJob.id, "Ana Candidata", "candidato@azul.com", "+55 11 99876-5432", "São Paulo", "SP", "https://linkedin.com/in/anacandidata",
    j({ summary: `Profissional com 4 anos de experiência em ${demoJob.area.toLowerCase()} e paixão por aviação.` }),
    j([{ level: "Superior", institution: "USP", field: demoJob.area }]),
    j([{ role: `Profissional em ${demoJob.area}`, company: "Azul", years: 4 }]),
    j([{ name: "Inglês", level: "Avançado" }]),
    j([{ name: "IATA", issuer: "IATA" }]),
    82, 77, 79, 79,
    "Ana Candidata demonstra bom fit para a vaga, com destaque para comunicação e domínio técnico.",
    "reviewing", new Date().toISOString(), new Date().toISOString(),
  );

  // Notificações de exemplo
  const notifs = [
    { kind: "new_application", title: "Nova candidatura enviada", body: "Novos candidatos aplicaram na plataforma.", link: "/candidatos" },
    { kind: "high_fit", title: "Candidato com Fit Azul alto", body: "Confira os talentos de alto potencial detectados.", link: "/candidatos" },
    { kind: "ai_approved", title: "Candidato avaliado pela IA", body: "Perfis sinalizados automaticamente.", link: "/candidatos" },
    { kind: "cv_received", title: "Novo currículo recebido", body: "Currículo adicionado ao banco de talentos.", link: "/candidatos" },
    { kind: "job_created", title: "Vaga criada", body: "Uma nova vaga foi publicada na plataforma.", link: "/vagas" },
  ];
  for (const n of notifs) {
    db.prepare(
      `INSERT INTO notifications (id, user_id, title, body, kind, link, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(newId(), userId, n.title, n.body, n.kind, n.link, new Date().toISOString());
  }
}
