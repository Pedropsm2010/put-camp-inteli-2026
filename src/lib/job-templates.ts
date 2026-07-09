// Perguntas de triagem padrão por área.
// Podem ser complementadas por perguntas customizadas salvas em jobs.custom_questions.

export const AREA_QUESTIONS: Record<string, string[]> = {
  "Operações de Voo": [
    "Você possui Licença ANAC válida? Qual categoria?",
    "Quantas horas de voo você acumula? Detalhe por aeronave.",
    "Qual seu nível de Inglês ICAO?",
    "Possui experiência internacional? Quais rotas/países?",
    "Quais aeronaves você já operou?",
  ],
  "Comissário de Bordo": [
    "Você possui curso de comissário homologado pela ANAC?",
    "Quais idiomas você fala e em que nível?",
    "Descreva uma situação difícil de atendimento ao cliente que resolveu.",
    "Disponibilidade para viagens longas e escalas fora da base?",
  ],
  "Manutenção Aeronáutica": [
    "Possui CANAC? Qual habilitação (GMP, CEA, AVI)?",
    "Quais aeronaves você já fez manutenção?",
    "Experiência com MEL/CDL? Descreva.",
    "Possui certificações OEM (Airbus, Embraer, ATR)?",
  ],
  "Tecnologia": [
    "Quais linguagens de programação você domina?",
    "Experiência com Cloud (AWS, GCP, Azure)? Detalhe.",
    "Já construiu ou consumiu APIs REST/GraphQL? Exemplos.",
    "Quais bancos de dados você domina (SQL e NoSQL)?",
    "Possui certificações relevantes? (AWS, Google, Microsoft, etc.)",
  ],
  "Dados & Analytics": [
    "Nível de SQL (básico, intermediário, avançado)? Dê exemplos de queries complexas.",
    "Já construiu dashboards em Power BI ou Tableau? Descreva.",
    "Experiência com Python para análise de dados (pandas, numpy)?",
    "Descreva um projeto de dados de ponta a ponta que você entregou.",
  ],
  "Comercial & Vendas": [
    "Qual sua experiência com vendas B2B ou B2C?",
    "Como você trabalha com metas agressivas?",
    "Descreva uma negociação difícil que fechou.",
  ],
  "Atendimento & Solo": [
    "Experiência com atendimento em aeroporto? Descreva.",
    "Já lidou com voos irregulares (delay/cancelamento)? Como?",
    "Idiomas que fala e nível.",
  ],
  "Corporativo": [
    "Descreva sua experiência mais relevante para esta área.",
    "Como você mede sucesso no seu trabalho?",
    "Descreva uma situação em que resolveu um problema complexo.",
  ],
};

export function questionsFor(area: string, custom?: unknown): string[] {
  const base = AREA_QUESTIONS[area] ?? AREA_QUESTIONS["Corporativo"];
  const extra = Array.isArray(custom)
    ? (custom as unknown[]).map((q) => String(q)).filter(Boolean)
    : [];
  return [...base, ...extra];
}

export type JobTemplate = {
  title: string;
  area: string;
  level: string;
  description: string;
  requirements: string;
  desired_skills: string[];
  required_languages: string[];
  required_certifications: string[];
  min_education: "medio" | "tecnico" | "superior" | "pos";
  min_experience_years: number;
  location: string;
  employment_type: "clt";
  icon: string;
  tags: string[];
};

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    title: "Piloto Comercial — Airbus A320",
    area: "Operações de Voo",
    level: "Sênior",
    description: "Operar voos domésticos e internacionais da frota A320 da Azul, garantindo segurança, pontualidade e experiência do cliente.",
    requirements: "Licença PLA ANAC ativa. Type Rating A320. Inglês ICAO 4+. 1500h+ de voo.",
    desired_skills: ["CRM", "MCC", "Type A320", "Procedimentos IFR"],
    required_languages: ["Português", "Inglês (ICAO 4+)"],
    required_certifications: ["PLA ANAC", "Type Rating A320", "CMA vigente"],
    min_education: "superior",
    min_experience_years: 3,
    location: "Campinas — SP (base)",
    employment_type: "clt",
    icon: "plane",
    tags: ["voo", "airbus", "a320"],
  },
  {
    title: "Copiloto — ATR 72",
    area: "Operações de Voo",
    level: "Pleno",
    description: "Atuar como Primeiro Oficial nos voos regionais da frota ATR 72.",
    requirements: "PCM ou PLA ANAC. Type ATR desejável. Inglês ICAO 4.",
    desired_skills: ["Type ATR", "IFR", "CRM"],
    required_languages: ["Português", "Inglês (ICAO 4)"],
    required_certifications: ["PCM ou PLA ANAC", "CMA"],
    min_education: "superior",
    min_experience_years: 1,
    location: "Belo Horizonte — MG",
    employment_type: "clt",
    icon: "plane",
    tags: ["voo", "atr", "regional"],
  },
  {
    title: "Comissário de Bordo",
    area: "Comissário de Bordo",
    level: "Júnior",
    description: "Garantir a segurança e a experiência dos clientes a bordo dos voos Azul.",
    requirements: "Curso de comissário homologado pela ANAC. Inglês intermediário. Altura mínima 1,58m.",
    desired_skills: ["Atendimento ao cliente", "Primeiros socorros", "Segurança de voo"],
    required_languages: ["Português", "Inglês (intermediário)"],
    required_certifications: ["Curso de Comissário ANAC"],
    min_education: "medio",
    min_experience_years: 0,
    location: "Campinas — SP",
    employment_type: "clt",
    icon: "user",
    tags: ["cabine", "atendimento"],
  },
  {
    title: "Mecânico Aeronáutico — GMP",
    area: "Manutenção Aeronáutica",
    level: "Pleno",
    description: "Executar manutenção de linha e base na frota Azul, com foco em Grupo Motopropulsor.",
    requirements: "CANAC ativo com habilitação GMP. Experiência em A320/ATR/E195.",
    desired_skills: ["MEL", "CDL", "AMM", "IPC"],
    required_languages: ["Português", "Inglês técnico"],
    required_certifications: ["CANAC GMP", "Cursos OEM"],
    min_education: "tecnico",
    min_experience_years: 3,
    location: "Viracopos — Campinas — SP",
    employment_type: "clt",
    icon: "wrench",
    tags: ["mro", "gmp"],
  },
  {
    title: "Analista de Dados Pleno",
    area: "Dados & Analytics",
    level: "Pleno",
    description: "Construir análises, dashboards e modelos preditivos para as áreas de Receita, Operações e Cargo.",
    requirements: "SQL avançado, Python (pandas), Power BI. Estatística aplicada.",
    desired_skills: ["SQL", "Python", "Power BI", "dbt", "Snowflake"],
    required_languages: ["Português", "Inglês intermediário"],
    required_certifications: [],
    min_education: "superior",
    min_experience_years: 3,
    location: "São Paulo — SP (híbrido)",
    employment_type: "clt",
    icon: "database",
    tags: ["dados", "bi"],
  },
  {
    title: "Engenheiro de Software Sênior",
    area: "Tecnologia",
    level: "Sênior",
    description: "Desenvolver e manter plataformas digitais da Azul (site, app e sistemas internos).",
    requirements: "TypeScript, React, Node.js, AWS. Boas práticas de engenharia.",
    desired_skills: ["TypeScript", "React", "Node.js", "AWS", "PostgreSQL", "APIs REST"],
    required_languages: ["Português", "Inglês avançado"],
    required_certifications: [],
    min_education: "superior",
    min_experience_years: 5,
    location: "Remoto (Brasil)",
    employment_type: "clt",
    icon: "code",
    tags: ["ti", "fullstack"],
  },
  {
    title: "Analista de TI — Infra & Cloud",
    area: "Tecnologia",
    level: "Pleno",
    description: "Sustentar e evoluir a infraestrutura cloud e on-prem, garantindo disponibilidade e segurança.",
    requirements: "Experiência com AWS, Linux, Kubernetes, Terraform.",
    desired_skills: ["AWS", "Linux", "Kubernetes", "Terraform", "CI/CD"],
    required_languages: ["Português", "Inglês técnico"],
    required_certifications: ["AWS Solutions Architect (desejável)"],
    min_education: "superior",
    min_experience_years: 3,
    location: "Barueri — SP (híbrido)",
    employment_type: "clt",
    icon: "server",
    tags: ["ti", "infra"],
  },
  {
    title: "Agente de Aeroporto",
    area: "Atendimento & Solo",
    level: "Júnior",
    description: "Atendimento ao cliente no check-in, embarque e desembarque.",
    requirements: "Ensino médio completo. Boa comunicação. Disponibilidade para escalas.",
    desired_skills: ["Atendimento", "Empatia", "Resiliência"],
    required_languages: ["Português", "Inglês básico"],
    required_certifications: [],
    min_education: "medio",
    min_experience_years: 0,
    location: "Guarulhos — SP",
    employment_type: "clt",
    icon: "user",
    tags: ["solo", "atendimento"],
  },
  {
    title: "Analista Comercial de Cargas",
    area: "Comercial & Vendas",
    level: "Pleno",
    description: "Desenvolver e manter carteira de clientes B2B da Azul Cargo.",
    requirements: "Experiência em vendas B2B, preferencialmente em logística.",
    desired_skills: ["Prospecção", "Negociação", "CRM (Salesforce)"],
    required_languages: ["Português", "Inglês intermediário"],
    required_certifications: [],
    min_education: "superior",
    min_experience_years: 2,
    location: "São Paulo — SP",
    employment_type: "clt",
    icon: "briefcase",
    tags: ["cargas", "vendas"],
  },
  {
    title: "Analista de RH — Recrutamento",
    area: "Corporativo",
    level: "Pleno",
    description: "Conduzir processos seletivos ponta a ponta para posições operacionais e corporativas.",
    requirements: "Experiência em R&S. Bom uso de ATS.",
    desired_skills: ["Sourcing", "Entrevistas por competência", "ATS"],
    required_languages: ["Português"],
    required_certifications: [],
    min_education: "superior",
    min_experience_years: 2,
    location: "Barueri — SP",
    employment_type: "clt",
    icon: "users",
    tags: ["rh"],
  },
];
