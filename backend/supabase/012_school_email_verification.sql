-- Email sekolah yang diverifikasi melalui Supabase Auth dan relasi identitasnya.
-- Email sekolah yang diverifikasi melalui Supabase Auth dan relasi identitasnya.
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS schools_email_unique
  ON public.schools (lower(email)) WHERE email IS NOT NULL;
