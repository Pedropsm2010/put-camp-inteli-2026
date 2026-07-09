// Lógica de simulação das 3 IAs (POC local — sem chamada a nenhuma IA real).

export type BandKey = "highly_recommended" | "recommended" | "human_review" | "not_prioritized";

export type Band = {
  key: BandKey;
  label: string;
  approved: boolean;
  status: string;
  tint: string;
};

// Faixas de nota definidas pelo produto:
//  80–100% altamente recomendado ao RH
//  70–79%  recomendado
//  60–69%  precisa de revisão humana
//  <60%    não priorizado para aquela vaga no momento
export function classifyBand(fit: number): Band {
  if (fit >= 80)
    return {
      key: "highly_recommended",
      label: "Altamente recomendado ao RH",
      approved: true,
      status: "Aprovado",
      tint: "bg-success text-white",
    };
  if (fit >= 70)
    return {
      key: "recommended",
      label: "Recomendado",
      approved: true,
      status: "Aprovado",
      tint: "bg-azul-yellow text-navy-deep",
    };
  if (fit >= 60)
    return {
      key: "human_review",
      label: "Precisa de revisão humana",
      approved: false,
      status: "Revisão humana",
      tint: "bg-sky text-white",
    };
  return {
    key: "not_prioritized",
    label: "Não priorizado para esta vaga no momento",
    approved: false,
    status: "Não priorizado",
    tint: "bg-muted text-muted-foreground",
  };
}

// Hash determinístico simples para dar variação estável por candidato.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff; // 0..1
}

export type EvaluationInput = {
  full_name: string;
  city?: string | null;
  state?: string | null;
  linkedin?: string | null;
  summary?: string | null;
  behavioral?: Record<string, unknown> | null;
  education?: unknown;
  experience?: unknown;
  languages?: unknown;
  certifications?: unknown;
  jobTitle?: string;
};

export type EvaluationResult = {
  cultura: number;
  tecnica: number;
  fitFinal: number;
  culturaJustification: string;
  tecnicaJustification: string;
  finalMessage: string;
  band: Band;
};

function completeness(input: EvaluationInput): number {
  let score = 0;
  const checks: boolean[] = [
    !!input.summary && String(input.summary).length > 30,
    !!input.linkedin,
    Array.isArray(input.education) && input.education.length > 0,
    Array.isArray(input.experience) && input.experience.length > 0,
    Array.isArray(input.languages) && input.languages.length > 0,
    Array.isArray(input.certifications) && input.certifications.length > 0,
    !!input.city,
    !!input.state,
    !!(
      input.behavioral &&
      Object.values(input.behavioral).some((v) => typeof v === "string" && v.length > 15)
    ),
  ];
  score = checks.filter(Boolean).length / checks.length;
  // bônus de tamanho do resumo
  const extra = Math.min(0.15, (String(input.summary ?? "").length || 0) / 1500);
  return Math.min(1, score * 0.85 + extra);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Simula os 3 agentes localmente e de forma instantânea:
//  1) Agente Cultura Azul
//  2) Agente Técnico
//  3) Média final (40% cultura + 60% técnica) + justificativa da IA
export function simulateEvaluation(input: EvaluationInput): EvaluationResult {
  const c = completeness(input);
  const j1 = hash(input.full_name + "cultura") * 18 - 9;
  const j2 = hash(input.full_name + "tecnica") * 18 - 9;

  const cultura = clamp(52 + c * 38 + j1);
  const tecnica = clamp(50 + c * 42 + j2);
  const fitFinal = clamp(cultura * 0.4 + tecnica * 0.6);
  const band = classifyBand(fitFinal);

  const culturaJustification = `O perfil demonstra ${
    cultura >= 75 ? "forte" : cultura >= 60 ? "bom" : "incidental"
  } alinhamento com os valores da Azul (gente que gosta de gente, segurança em primeiro lugar e simplicidade). ${
    input.linkedin
      ? "Presença e rede profissional ativa contribuem para a comunicação e o trabalho em equipe. "
      : ""
  }Comunicação e adaptabilidade ${
    cultura >= 70 ? "são pontos positivos" : "apresentam oportunidades de desenvolvimento"
  } para a cultura colaborativa da companhia.`;

  const tecnicaJustification = `A parte técnica é ${
    tecnica >= 75 ? "sólida" : tecnica >= 60 ? "adequada" : "abaixo do esperado"
  } para a vaga${input.jobTitle ? ` de ${input.jobTitle}` : ""}. ${
    Array.isArray(input.experience) && input.experience.length > 0
      ? "A experiência prévia cobre boa parte dos requisitos."
      : "Há pouca experiência registrada frente aos requisitos."
  } ${
    Array.isArray(input.certifications) && input.certifications.length > 0
      ? "Certificações relevantes elevam a competência técnica."
      : "Certificações adicionais reforçariam o perfil."
  }`;

  const finalMessage =
    `Sua nota final foi ${fitFinal}% — ${band.label}. ` +
    `Composta por Cultura Azul ${cultura}% (peso 40%) e Técnica ${tecnica}% (peso 60%). ` +
    (band.approved
      ? "Seu perfil foi encaminhado ao RH para as próximas etapas. " +
        `Resumo: ${culturaJustification} ${tecnicaJustification}`
      : band.key === "human_review"
        ? "Seu perfil seguirá para revisão humana do time de recrutamento. " +
          `Resumo: ${culturaJustification} ${tecnicaJustification}`
        : "Neste momento seu perfil não está priorizado para esta vaga. " +
          `Resumo: ${culturaJustification} ${tecnicaJustification}`);

  return {
    cultura,
    tecnica,
    fitFinal,
    culturaJustification,
    tecnicaJustification,
    finalMessage,
    band,
  };
}

// Texto curto de notificação (sininho) para RH e candidato.
export function buildNotification(input: EvaluationInput, result: EvaluationResult) {
  const title = `Resultado da avaliação — ${input.full_name}`;
  const body =
    `Nota final: ${result.fitFinal}% · ${result.band.label}. ` +
    `Cultura ${result.cultura}% · Técnica ${result.tecnica}%. ${result.band.status}.`;
  return { title, body, message: result.finalMessage };
}
