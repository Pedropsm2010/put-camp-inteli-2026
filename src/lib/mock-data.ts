export const KPIS = [
  { label: "Vagas abertas", value: "9", trend: "+2 esta semana", icon: "briefcase", tint: "primary" },
  { label: "Candidatos ativos", value: "85", trend: "+18% vs. mês anterior", icon: "users", tint: "sky" },
  { label: "Fit Azul médio", value: "67", suffix: "/100", trend: "+4pts com IA", icon: "sparkles", tint: "yellow" },
  { label: "Tempo médio de triagem", value: "2.4h", trend: "−87% após IA", icon: "trend", tint: "success" },
] as const;

export const FLOW_DATA = [
  { d: "1", candidatos: 22 },
  { d: "2", candidatos: 36 },
  { d: "3", candidatos: 41 },
  { d: "4", candidatos: 55 },
  { d: "5", candidatos: 48 },
  { d: "6", candidatos: 46 },
  { d: "7", candidatos: 44 },
  { d: "8", candidatos: 45 },
  { d: "9", candidatos: 47 },
  { d: "10", candidatos: 50 },
  { d: "11", candidatos: 54 },
  { d: "12", candidatos: 60 },
];

export const AREA_DIST = [
  { area: "Operações de Voo", n: 14 },
  { area: "Serviços de Bordo", n: 13 },
  { area: "Manutenção", n: 7 },
  { area: "Operações", n: 8 },
  { area: "Aeroportos", n: 12 },
  { area: "Tecnologia", n: 6 },
  { area: "Gente & Gestão", n: 7 },
  { area: "Experiência do Cliente", n: 11 },
];

export const EXP_BARS = [
  { faixa: "0-2 anos", n: 3 },
  { faixa: "3-5 anos", n: 22 },
  { faixa: "6-10 anos", n: 31 },
  { faixa: "11+ anos", n: 32 },
];

export const SCHOOLING = [
  { name: "Superior", value: 37 },
  { name: "Ensino Médio", value: 42 },
  { name: "Técnico", value: 6 },
];

export const TOP_CANDIDATES = [
  { rank: 1, name: "Gabriela Almeida Silva", role: "Analista Pleno de Operações", score: 98 },
  { rank: 2, name: "Bruno Ribeiro Oliveira", role: "Agente de Aeroporto", score: 98 },
  { rank: 3, name: "Felipe Ferreira Almeida", role: "Copiloto", score: 96 },
  { rank: 4, name: "Carla Oliveira Carvalho", role: "Comissário de Bordo", score: 96 },
  { rank: 5, name: "Larissa Martins Souza", role: "Analista de Dados", score: 96 },
];

export const JOBS = [
  { id: "v1", title: "Piloto Comercial — Airbus A320", area: "Operações de Voo", level: "Sênior", tags: ["Type Rating A320", "CRM (Crew Resource Management)", "Inglês ICAO Nível 5+"], location: "Campinas — VCP", candidates: 47, deadline: "11 de jun.", icon: "plane" },
  { id: "v2", title: "Copiloto — ATR 72", area: "Operações de Voo", level: "Pleno", tags: ["Type Rating ATR", "Comunicação clara", "Trabalho em equipe"], location: "Recife — REC", candidates: 32, deadline: "19 de jun.", icon: "plane" },
  { id: "v3", title: "Comissário de Bordo", area: "Serviços de Bordo", level: "Júnior", tags: ["Atendimento premium", "Inglês avançado", "Primeiros socorros"], location: "São Paulo — GRU", candidates: 128, deadline: "5 de jul.", icon: "users" },
  { id: "v4", title: "Mecânico Aeronáutico — GMP", area: "Manutenção", level: "Pleno", tags: ["CHT célula & motores", "Boeing 737", "Inspeção A/B"], location: "Guarulhos — GRU", candidates: 23, deadline: "22 de jun.", icon: "wrench" },
  { id: "v5", title: "Analista de Operações de Voo", area: "Operações", level: "Pleno", tags: ["SQL", "Power BI", "Análise de dados"], location: "Barueri — SP", candidates: 64, deadline: "27 de jun.", icon: "activity" },
  { id: "v6", title: "Agente de Aeroporto", area: "Aeroportos", level: "Júnior", tags: ["Atendimento", "Sistemas Sabre/Amadeus", "Resolução de conflitos"], location: "Guarulhos — GRU", candidates: 87, deadline: "29 de jun.", icon: "briefcase" },
  { id: "v7", title: "Analista de TI — Cloud & DevOps", area: "Tecnologia", level: "Sênior", tags: ["AWS", "Kubernetes", "Terraform"], location: "Barueri — SP (Híbrido)", candidates: 39, deadline: "17 de jun.", icon: "cpu" },
  { id: "v8", title: "Analista de Dados — People Analytics", area: "Gente & Gestão", level: "Pleno", tags: ["SQL", "Python", "Estatística"], location: "Barueri — SP", candidates: 52, deadline: "21 de jun.", icon: "chart" },
  { id: "v9", title: "Especialista em Experiência do Cliente", area: "Experiência do Cliente", level: "Sênior", tags: ["NPS", "Journey mapping", "Voz do cliente"], location: "Barueri — SP", candidates: 41, deadline: "3 de jul.", icon: "heart" },
];

export const CANDIDATES = [
  { rank: "#001", name: "Gabriela Almeida Silva", role: "Analista Pleno de Operações...", job: "Analista de Operações", loc: "Barueri — SP", exp: "14 anos", score: 98, status: "Aprovado" },
  { rank: "#002", name: "Bruno Ribeiro Oliveira", role: "Agente de Aeroporto · Local...", job: "Agente de Aeroporto", loc: "Guarulhos — GRU", exp: "15 anos", score: 98, status: "Aprovado" },
  { rank: "#003", name: "Felipe Ferreira Almeida", role: "Copiloto · Itaú", job: "Copiloto — ATR 72", loc: "Recife — REC", exp: "10 anos", score: 96, status: "Em análise" },
  { rank: "#004", name: "Carla Oliveira Carvalho", role: "Comissária de Bordo · GOL", job: "Comissário de Bordo", loc: "Belo Horizonte — CNF", exp: "12 anos", score: 96, status: "Aprovado" },
  { rank: "#005", name: "Larissa Martins Souza", role: "Analista de Dados Sênior", job: "Analista de Dados", loc: "Barueri — SP", exp: "9 anos", score: 96, status: "Aprovado" },
  { rank: "#006", name: "Marcelo Barbosa Barbosa", role: "Comandante A320 · LATAM", job: "Piloto Comercial A320", loc: "Campinas — VCP", exp: "18 anos", score: 80, status: "Em análise" },
  { rank: "#007", name: "Carla Souza Martins", role: "Piloto ATR · Azul Conecta", job: "Piloto Comercial A320", loc: "Campinas — VCP", exp: "7 anos", score: 79, status: "Em análise" },
  { rank: "#008", name: "Isabela Silva Martins", role: "Instrutora de voo", job: "Piloto Comercial A320", loc: "São Paulo — CGH", exp: "5 anos", score: 58, status: "Complementar" },
  { rank: "#009", name: "Felipe Santos Ferreira", role: "Piloto agrícola", job: "Piloto Comercial A320", loc: "Ribeirão Preto — RAO", exp: "4 anos", score: 49, status: "Complementar" },
  { rank: "#010", name: "Gabriela Gomes Araújo", role: "Copiloto — Cessna", job: "Piloto Comercial A320", loc: "Manaus — MAO", exp: "3 anos", score: 47, status: "Complementar" },
];
