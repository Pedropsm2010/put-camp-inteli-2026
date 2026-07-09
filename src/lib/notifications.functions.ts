import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb } from "./db.server";

export const listNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50")
    .all() as any[];
  return rows.map((n) => ({
    ...n,
    read_at: n.read_at ?? null,
  }));
});

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    getDb()
      .prepare("UPDATE notifications SET read_at = ? WHERE id = ?")
      .run(new Date().toISOString(), data.id);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" }).handler(async () => {
  getDb().prepare("UPDATE notifications SET read_at = ? WHERE read_at IS NULL").run(new Date().toISOString());
  return { ok: true };
});

export const clearNotifications = createServerFn({ method: "POST" }).handler(async () => {
  getDb().prepare("DELETE FROM notifications").run();
  return { ok: true };
});

