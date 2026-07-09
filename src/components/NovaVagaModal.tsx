import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createJob, updateJob } from "@/lib/jobs.functions";

type JobRow = {
  id: string;
  title: string;
  area: string;
  level?: string | null;
  description: string;
  requirements: string;
  desired_skills: string[];
  required_languages: string[];
  required_certifications: string[];
  min_education: string | null;
  min_experience_years: number;
  location: string;
  employment_type: "clt" | "pj" | "estagio" | "temporario" | "freelancer";
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
};

const EMPTY = {
  title: "",
  area: "",
  level: "",
  description: "",
  requirements: "",
  desired_skills: "",
  required_languages: "",
  required_certifications: "",
  min_education: "" as "" | "fundamental" | "medio" | "tecnico" | "superior" | "pos" | "mestrado" | "doutorado",
  min_experience_years: "0",
  location: "",
  employment_type: "clt" as "clt" | "pj" | "estagio" | "temporario" | "freelancer",
  salary_min: "",
  salary_max: "",
  deadline: "",
};

export function NovaVagaModal({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: JobRow | null;
}) {
  const [form, setForm] = useState({ ...EMPTY });
  const qc = useQueryClient();
  const createFn = useServerFn(createJob);
  const updateFn = useServerFn(updateJob);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        area: editing.area,
        level: editing.level ?? "",
        description: editing.description,
        requirements: editing.requirements,
        desired_skills: editing.desired_skills.join(", "),
        required_languages: editing.required_languages.join(", "),
        required_certifications: editing.required_certifications.join(", "),
        min_education: (editing.min_education as (typeof EMPTY)["min_education"]) ?? "",
        min_experience_years: String(editing.min_experience_years ?? 0),
        location: editing.location,
        employment_type: editing.employment_type,
        salary_min: editing.salary_min?.toString() ?? "",
        salary_max: editing.salary_max?.toString() ?? "",
        deadline: editing.deadline ?? "",
      });
    } else {
      setForm({ ...EMPTY });
    }
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        area: form.area,
        level: form.level || null,
        description: form.description,
        requirements: form.requirements,
        desired_skills: form.desired_skills.split(",").map((s) => s.trim()).filter(Boolean),
        required_languages: form.required_languages.split(",").map((s) => s.trim()).filter(Boolean),
        required_certifications: form.required_certifications.split(",").map((s) => s.trim()).filter(Boolean),
        min_education: form.min_education || null,
        min_experience_years: Number(form.min_experience_years) || 0,
        location: form.location,
        employment_type: form.employment_type,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        deadline: form.deadline || null,
      };
      if (editing) return updateFn({ data: { id: editing.id, patch: payload } });
      return createFn({ data: payload });
    },
    onSuccess: () => {
      toast.success(editing ? "Vaga atualizada" : "Vaga criada com sucesso");
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar vaga"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-navy-deep">
            {editing ? "Editar vaga" : "Nova vaga"}
          </DialogTitle>
          <DialogDescription>Preencha as informações da vaga. Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
        >
          <div className="md:col-span-2">
            <Label>Título da vaga *</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Piloto Comercial A320" />
          </div>
          <div>
            <Label>Área *</Label>
            <Input required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Ex: Operações de Voo" />
          </div>
          <div>
            <Label>Nível</Label>
            <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="Sênior, Pleno, Júnior..." />
          </div>
          <div className="md:col-span-2">
            <Label>Descrição da vaga *</Label>
            <Textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Requisitos obrigatórios *</Label>
            <Textarea required rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Habilidades desejadas (separadas por vírgula)</Label>
            <Input value={form.desired_skills} onChange={(e) => setForm({ ...form, desired_skills: e.target.value })} placeholder="Liderança, Excel avançado, ..." />
          </div>
          <div>
            <Label>Idiomas exigidos</Label>
            <Input value={form.required_languages} onChange={(e) => setForm({ ...form, required_languages: e.target.value })} placeholder="Inglês avançado, ..." />
          </div>
          <div>
            <Label>Certificações exigidas</Label>
            <Input value={form.required_certifications} onChange={(e) => setForm({ ...form, required_certifications: e.target.value })} placeholder="ANAC PLA, ..." />
          </div>
          <div>
            <Label>Escolaridade mínima</Label>
            <Select value={form.min_education} onValueChange={(v) => setForm({ ...form, min_education: v as typeof form.min_education })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fundamental">Fundamental</SelectItem>
                <SelectItem value="medio">Ensino Médio</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="superior">Superior</SelectItem>
                <SelectItem value="pos">Pós-graduação</SelectItem>
                <SelectItem value="mestrado">Mestrado</SelectItem>
                <SelectItem value="doutorado">Doutorado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Experiência mínima (anos)</Label>
            <Input type="number" min={0} value={form.min_experience_years} onChange={(e) => setForm({ ...form, min_experience_years: e.target.value })} />
          </div>
          <div>
            <Label>Local de trabalho *</Label>
            <Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Campinas – SP" />
          </div>
          <div>
            <Label>Tipo de contratação *</Label>
            <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v as typeof form.employment_type })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="clt">CLT</SelectItem>
                <SelectItem value="pj">PJ</SelectItem>
                <SelectItem value="estagio">Estágio</SelectItem>
                <SelectItem value="temporario">Temporário</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Salário mínimo (R$)</Label>
            <Input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
          </div>
          <div>
            <Label>Salário máximo (R$)</Label>
            <Input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Prazo de candidatura</Label>
            <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-gradient-cta">
              {mutation.isPending ? "Salvando..." : editing ? "Salvar alterações" : "Publicar vaga"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
