import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function j(v: unknown): string {
  return JSON.stringify(v ?? null);
}

export function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v !== "string") return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

type Row = Record<string, any>;

export function mapJob(row: Row): any {
  return {
    ...row,
    tags: parseJson(row.tags, []),
    custom_questions: parseJson(row.custom_questions, []),
    desired_skills: parseJson(row.desired_skills, []),
    required_languages: parseJson(row.required_languages, []),
    required_certifications: parseJson(row.required_certifications, []),
  };
}
