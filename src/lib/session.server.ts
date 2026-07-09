// Módulo server-only: lê o id do usuário a partir do cookie de sessão.
// Arquivo .server.ts — não é importado por nenhum código de cliente.
import { getRequest } from "@tanstack/react-start/server";

export function currentUserId(): string | null {
  const req = getRequest();
  const cookie = req?.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("azul_session="));
  if (!match) return null;
  const id = decodeURIComponent(match.split("=")[1] ?? "");
  return id || null;
}
