
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS custom_questions jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS cultura_score integer,
  ADD COLUMN IF NOT EXISTS tecnica_score integer,
  ADD COLUMN IF NOT EXISTS fit_final integer,
  ADD COLUMN IF NOT EXISTS cultura_analysis jsonb,
  ADD COLUMN IF NOT EXISTS tecnica_analysis jsonb,
  ADD COLUMN IF NOT EXISTS summary_ai text,
  ADD COLUMN IF NOT EXISTS evaluated_at timestamptz;
