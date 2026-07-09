import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { questionsFor } from "@/lib/job-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, MapPin, Briefcase, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/candidatar/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Candidatar-se — ${params.slug} — Azul Talent` },
      { name: "description", content: "Envie sua candidatura para uma vaga aberta na Azul." },
    ],
  }),
  component: CandidatarPage,
});

type Job = {
  id: string;
  slug: string;
  title: string;
  area: string;
  level: string | null;
  description: string;
  requirements: string;
  location: string;
  status: string;
  tags: string[] | null;
  custom_questions: unknown;
};

function CandidatarPage() {
  const { slug } = Route.useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    linkedin: "",
    summary: "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id,slug,title,area,level,description,requirements,location,status,tags,custom_questions")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      if (error) toast.error(error.message);
      setJob(data as Job | null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const questions = useMemo(
    () => (job ? questionsFor(job.area, job.custom_questions) : []),
    [job],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;
    if (!form.full_name || !form.email) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({
      job_id: job.id,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      city: form.city || null,
      state: form.state || null,
      linkedin: form.linkedin || null,
      behavioral_answers: { summary: form.summary, questions: answers },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job || job.status !== "open") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Vaga indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta vaga não está mais aberta ou o link é inválido.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm text-primary underline">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-4 text-2xl font-bold">Candidatura enviada!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Obrigado por se candidatar para <strong>{job.title}</strong>. Nossa equipe entrará em contato em breve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Azul Talent</div>
          <h1 className="mt-2 text-3xl font-extrabold text-foreground">{job.title}</h1>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" />{job.area}{job.level ? ` · ${job.level}` : ""}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{job.location}</span>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{job.description}</p>
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Requisitos</div>
            <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">{job.requirements}</p>
          </div>
        </header>

        <form onSubmit={submit} className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input id="full_name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input id="state" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
            </div>
          </div>

          <div>
            <Label htmlFor="summary">Resumo profissional</Label>
            <Textarea id="summary" rows={4} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Fale um pouco sobre sua trajetória, experiências e o que te motiva." />
          </div>

          {questions.length > 0 && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Perguntas para esta área</div>
                <div className="text-xs text-muted-foreground">Respostas ajudam a IA da Azul a avaliar seu fit.</div>
              </div>
              {questions.map((q, i) => (
                <div key={i}>
                  <Label htmlFor={`q-${i}`}>{q}</Label>
                  <Textarea
                    id={`q-${i}`}
                    rows={3}
                    value={answers[q] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Enviar candidatura
          </Button>
        </form>
      </div>
    </div>
  );
}
