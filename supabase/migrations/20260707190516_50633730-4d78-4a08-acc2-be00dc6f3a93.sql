
-- Add 'analyst' role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'analyst';

-- Update handle_new_user trigger to honor role passed via signup metadata (recruiter | analyst).
-- Admin role can only be granted manually.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _requested_role text;
  _final_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
          NEW.email,
          NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  _requested_role := NEW.raw_user_meta_data->>'role';
  IF _requested_role = 'analyst' THEN
    _final_role := 'analyst'::public.app_role;
  ELSE
    _final_role := 'recruiter'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _final_role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;
