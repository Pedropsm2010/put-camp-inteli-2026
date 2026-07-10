<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Setup rápido (para agentes/IA)

- Stack: TanStack Start + Vite + SQLite local (`node:sqlite`). Sem serviço externo, sem `.env`, sem chaves de API, sem Docker.
- Subir o projeto (comandos abaixo), depois abrir `http://localhost:8080`:

  ```bash
  npm install
  npm run dev
  ```

- `local.db` já está **commitado** com dados de demonstração (3 vagas, ~40 candidaturas, 2 usuários). Não rode seed/migration — se o arquivo existir, ele é usado como está.
- Se `local.db` for apagado, ele é recriado e repopulado automaticamente na primeira requisição (`seedIfEmpty` em `src/lib/db.server.ts`), só que com um seed menor (12 candidaturas) e sem o usuário candidato demo digitado manualmente — prefira manter o `local.db` versionado.
- Login: use os botões "Acesso rápido (demonstração)" na tela inicial, ou:
  - Recrutador: `rh@azul.com` / `azul1234`
  - Candidato: `candidato@azul.com` / `azul1234`
- A "IA" (Fit Azul, copiloto) é **100% simulada** em `src/lib/evaluation.ts` (hash determinístico, sem chamada externa) — funciona offline, não precisa de nenhuma credencial de LLM mesmo com `ai`/`@ai-sdk/*` no `package.json`.
- Pasta `supabase/` e `src/integrations/supabase/` foram removidas — não existe backend Supabase neste projeto, apesar do scaffold original ter sido gerado com integração Supabase pelo Lovable.
