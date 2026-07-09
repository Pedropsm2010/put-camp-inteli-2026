## Objetivo
Transformar o Azul Talent Gupy em um sistema funcional de recrutamento com persistência real (Lovable Cloud), IA (Lovable AI) e fluxo completo recrutador ↔ candidato.

## Faseamento (recomendo entregar em 3 rodadas)

### Rodada 1 — Fundação + Vagas (esta entrega)
1. **Ativar Lovable Cloud** (Postgres + Storage + Auth).
2. **Auth de recrutador** (email/senha + Google) na tela `/` (login já existente). Tabela `profiles` + `user_roles` (`recruiter`, `admin`). Rotas do dashboard/vagas/candidatos/mapa passam para dentro de `_authenticated/`.
3. **Schema inicial**:
   - `jobs` (todos os campos do brief: título, área, descrição, requisitos, habilidades, idiomas, certificações, escolaridade, experiência, local, tipo, faixa salarial, status `open|closed`, `created_by`, `slug` público).
   - `applications` (candidatura + dados pessoais + acadêmico + experiências + idiomas + certificações JSONB + respostas comportamentais + urls dos uploads + `fit_score` + `ai_analysis` JSONB).
   - `notifications` (user_id, tipo, título, payload, read_at).
   - `recruiter_settings` (preferências, tema, notificações).
   - Storage buckets: `resumes` (privado), `certificates` (privado).
   - RLS: recrutadores leem tudo; candidaturas podem ser inseridas por `anon` para vagas abertas; notificações escopadas por user.
4. **Vagas — CRUD completo**:
   - Modal "Nova vaga" com todos os campos + validação Zod.
   - Editar / encerrar / excluir na página `/vagas`.
   - Cards passam a ler do banco. Dashboard KPIs viram queries reais.

### Rodada 2 — Candidatura pública + IA + Fit Azul
5. Rota pública `/candidatar/$slug` com o formulário completo (dados pessoais, formação, experiência, idiomas, certificações, upload de PDF/certificados, 10 perguntas comportamentais).
6. Server function `analyzeApplication` (Lovable AI, structured output): extrai resumo, habilidades, experiências, idiomas, certificações, pontos fortes/atenção, justificativa e calcula **Fit Azul** (30/25/15/10/10/10) — dispara ao submeter.
7. Página `/candidatos/$id` mostra a análise real (resumo IA, breakdown Fit Azul, forças, atenção).
8. Notificação automática: "Novo candidato com Fit ≥ 85", "Nova candidatura em vaga X".

### Rodada 3 — Notificações, Configurações, Mapa
9. **Sino de notificações** no header: badge de não lidas, dropdown com lista, marcar como lida, limpar, histórico em `/notificacoes`.
10. **Configurações** `/configuracoes`: perfil, trocar senha, dados da empresa, preferências de notificação, pesos do Fit Azul (persistidos), tema, segurança.
11. **Mapa de Talentos** interativo (`/mapa`): SVG com o "aeroporto destino" ao centro, candidatos como aviões posicionados por Fit Azul (raio = 100 - fit), agrupados por vaga como rotas, clique abre `/candidatos/$id`. Zoom, filtro por vaga, tooltip com nome+score.

## Detalhes técnicos
- **Stack**: TanStack Start + Cloud (Supabase gerenciado). Todas as leituras/escritas via `createServerFn` + `requireSupabaseAuth`, exceto a rota pública de candidatura que usa cliente publishable + policy `TO anon` INSERT em `applications` para vagas `open`.
- **IA**: `google/gemini-2.5-flash` como default (rápido, barato, bom em extração). Prompt em português, `Output.object` com schema Zod.
- **Uploads**: buckets privados, URL assinada só para recrutador logado.
- **Dashboard**: KPIs, gráficos e Top 10 passam a agregar da tabela `applications` via SQL.

## Confirmação necessária
Confirma que posso **começar pela Rodada 1 agora** (ativar Cloud, auth de recrutador, schema, CRUD de vagas)? Assim que aprovar, ativo o Cloud e sigo direto — as rodadas 2 e 3 vêm nas próximas mensagens.