import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, Sparkles, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { copilotoAsk } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/copiloto")({
  head: () => ({ meta: [{ title: "Copiloto IA — Azul Talent Hub" }] }),
  component: CopilotoPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Quais os melhores candidatos para Piloto A320?",
  "Quais candidatos têm inglês avançado?",
  "Quais candidatos têm experiência internacional?",
  "Compare os 2 candidatos com maior Fit Azul.",
  "Gere um resumo dos candidatos aprovados.",
];

function CopilotoPage() {
  const askFn = useServerFn(copilotoAsk);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const askMut = useMutation({
    mutationFn: (q: string) =>
      askFn({ data: { question: q, history: messages.slice(-10) } }),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", content: res.answer }]),
    onError: (e: Error) => {
      toast.error(e.message);
      setMessages((m) => [...m, { role: "assistant", content: "❌ Não consegui responder agora. Tente novamente." }]);
    },
  });

  function send(q?: string) {
    const text = (q ?? input).trim();
    if (!text || askMut.isPending) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    askMut.mutate(text);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <AppShell title="Copiloto IA de RH" subtitle="Pergunte sobre candidatos, vagas e recomendações">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 h-[calc(100vh-11rem)]">
        {/* Chat */}
        <div className="flex flex-col rounded-3xl bg-card border border-border shadow-card-soft overflow-hidden">
          <div ref={boxRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="h-full grid place-items-center text-center">
                <div>
                  <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-gradient-cta text-white shadow-glow-blue"><Bot className="size-8" /></div>
                  <h3 className="mt-4 text-xl font-extrabold text-navy-deep">Copiloto IA da Azul</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">Faça perguntas sobre suas vagas e candidatos. As respostas usam os dados atuais da plataforma.</p>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="size-8 shrink-0 rounded-xl bg-gradient-cta grid place-items-center text-white"><Bot className="size-4" /></div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-navy-deep"}`}>
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="size-8 shrink-0 rounded-xl bg-azul-yellow grid place-items-center text-navy-deep"><User className="size-4" /></div>
                )}
              </div>
            ))}
            {askMut.isPending && (
              <div className="flex gap-3">
                <div className="size-8 shrink-0 rounded-xl bg-gradient-cta grid place-items-center text-white"><Bot className="size-4" /></div>
                <div className="rounded-2xl px-4 py-3 bg-muted/60 text-navy-deep text-sm inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Pensando...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4 bg-card">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Pergunte algo... (Enter para enviar)"
                className="flex-1 resize-none rounded-2xl border border-border bg-muted/40 p-3 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => send()}
                disabled={askMut.isPending || !input.trim()}
                className="h-12 px-5 rounded-2xl bg-gradient-cta text-primary-foreground font-semibold inline-flex items-center gap-2 hover:opacity-95 transition disabled:opacity-60"
              >
                <Send className="size-4" /> Enviar
              </button>
            </div>
          </div>
        </div>

        {/* Sugestões */}
        <aside className="rounded-3xl bg-card border border-border shadow-card-soft p-5">
          <h3 className="text-sm font-bold text-navy-deep flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Sugestões</h3>
          <ul className="mt-4 space-y-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button onClick={() => send(s)} className="w-full text-left rounded-xl border border-border bg-muted/30 p-3 text-xs hover:bg-accent hover:border-primary/40 transition text-navy-deep">
                  {s}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed">
            O Copiloto usa os dados atuais das vagas e candidatos avaliados. Para respostas mais precisas, avalie mais candidatos com a IA.
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
