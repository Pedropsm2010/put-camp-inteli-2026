# Azul Talent Gupy

Plataforma de recrutamento (POC) com identidade da Azul Linhas Aéreas — feita para o **PUT Camp Inteli 2026**. ATS completo: vagas, candidaturas, avaliação por "IA" simulada (Fit Azul), dashboard executivo, mapa de talentos e copiloto de RH.

> **100% local.** Banco SQLite embutido (`node:sqlite`, sem serviço externo), sem chaves de API, sem Docker. `npm install && npm run dev` e está no ar.

## Como rodar

```bash
npm install
npm run dev
```

Acesse **<http://localhost:8080>**. O arquivo `local.db` já vem versionado no repositório com dados de demonstração (3 vagas, ~40 candidaturas, 2 usuários) — não é preciso rodar seed nem migration nenhuma.

### Acesso rápido (demo)

Na tela de login há dois botões em **"Acesso rápido (demonstração)"** que entram direto, sem digitar nada. Se preferir entrar manualmente:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Recrutador | `rh@azul.com` | `azul1234` |
| Candidato | `candidato@azul.com` | `azul1234` |

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19 + SSR), roteamento por arquivo em [src/routes/](src/routes/)
- SQLite local via `node:sqlite` — toda a lógica de servidor vive em *server functions* (`src/lib/*.functions.ts`), schema e seed em [src/lib/db.server.ts](src/lib/db.server.ts)
- TailwindCSS 4 + Radix UI ([src/components/ui/](src/components/ui/))
- "IA" (avaliação Fit Azul, copiloto) é **simulada localmente** em [src/lib/evaluation.ts](src/lib/evaluation.ts) — determinística, sem chamada a nenhuma API externa

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento (porta 8080) |
| `npm run build` | build de produção |
| `npm run preview` | roda o build de produção localmente |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Resetar os dados

Para voltar a um estado "de fábrica": pare o servidor, apague `local.db`, `local.db-wal` e `local.db-shm`, e rode `npm run dev` de novo — o banco é recriado e populado automaticamente na primeira requisição (ver `seedIfEmpty` em `src/lib/db.server.ts`).
