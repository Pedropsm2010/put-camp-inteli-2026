
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'recruiter');
CREATE TYPE public.job_status AS ENUM ('open', 'closed');
CREATE TYPE public.employment_type AS ENUM ('clt', 'pj', 'estagio', 'temporario', 'freelancer');
CREATE TYPE public.education_level AS ENUM ('fundamental', 'medio', 'tecnico', 'superior', 'pos', 'mestrado', 'doutorado');
CREATE TYPE public.application_status AS ENUM ('new', 'reviewing', 'interview', 'offer', 'hired', 'rejected');

-- ============ UPDATED_AT helper ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  company TEXT DEFAULT 'Azul Linhas Aéreas',
  job_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select own or auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles read own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-create profile + recruiter role on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
          NEW.email,
          NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recruiter') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ JOBS ============
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  area TEXT NOT NULL,
  level TEXT,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  desired_skills TEXT[] DEFAULT '{}',
  required_languages TEXT[] DEFAULT '{}',
  required_certifications TEXT[] DEFAULT '{}',
  min_education public.education_level,
  min_experience_years INT DEFAULT 0,
  location TEXT NOT NULL,
  employment_type public.employment_type NOT NULL DEFAULT 'clt',
  salary_min NUMERIC,
  salary_max NUMERIC,
  status public.job_status NOT NULL DEFAULT 'open',
  deadline DATE,
  icon TEXT DEFAULT 'briefcase',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs public read open" ON public.jobs FOR SELECT TO anon USING (status = 'open');
CREATE POLICY "jobs auth read all" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "jobs recruiter insert" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'recruiter') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "jobs recruiter update" ON public.jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'recruiter') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "jobs recruiter delete" ON public.jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'recruiter') OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX jobs_status_idx ON public.jobs(status);
CREATE INDEX jobs_area_idx ON public.jobs(area);

-- ============ APPLICATIONS ============
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  -- Personal
  full_name TEXT NOT NULL,
  cpf TEXT,
  birth_date DATE,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  linkedin TEXT,
  -- Structured data
  education JSONB DEFAULT '[]'::jsonb,      -- [{level, course, institution, year}]
  experience JSONB DEFAULT '[]'::jsonb,     -- [{company, role, years, activities}]
  languages JSONB DEFAULT '[]'::jsonb,      -- [{name, level}]
  certifications JSONB DEFAULT '[]'::jsonb, -- [{name, type}]
  behavioral_answers JSONB DEFAULT '{}'::jsonb,
  resume_url TEXT,
  certificate_urls TEXT[] DEFAULT '{}',
  -- AI
  fit_score INT DEFAULT 0,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  status public.application_status NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT INSERT ON public.applications TO anon;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps public insert for open jobs" ON public.applications FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.status = 'open'));
CREATE POLICY "apps auth insert" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.status = 'open'));
CREATE POLICY "apps recruiter read" ON public.applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'recruiter') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "apps recruiter update" ON public.applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'recruiter') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "apps recruiter delete" ON public.applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'recruiter') OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER apps_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX apps_job_idx ON public.applications(job_id);
CREATE INDEX apps_score_idx ON public.applications(fit_score DESC);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null = broadcast to all recruiters
  kind TEXT NOT NULL, -- 'new_application', 'high_fit', 'job_closing', 'system'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif read own or broadcast" ON public.notifications FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "notif update own or broadcast" ON public.notifications FOR UPDATE TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "notif delete own or broadcast" ON public.notifications FOR DELETE TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE INDEX notif_user_idx ON public.notifications(user_id, created_at DESC);

-- ============ RECRUITER SETTINGS ============
CREATE TABLE public.recruiter_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_new_application BOOLEAN DEFAULT true,
  notify_high_fit BOOLEAN DEFAULT true,
  notify_deadline BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light',
  fit_weights JSONB DEFAULT '{"experience":30,"skills":25,"education":15,"languages":10,"certifications":10,"behavioral":10}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruiter_settings TO authenticated;
GRANT ALL ON public.recruiter_settings TO service_role;
ALTER TABLE public.recruiter_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings own" ON public.recruiter_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER rs_updated BEFORE UPDATE ON public.recruiter_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
