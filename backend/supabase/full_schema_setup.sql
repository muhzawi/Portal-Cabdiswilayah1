-- full_schema_setup.sql
-- Skrip lengkap untuk inisialisasi database Supabase baru dari nol.
-- Jalankan skrip ini sekali di menu SQL Editor pada Dashboard Supabase baru Anda.

-- 1. Ekstensi
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tipe Data Enum
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('super_user', 'medium_user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM ('available', 'maintenance', 'offline');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabel Profiles (User Pegawai / Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'medium_user',
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  institution text NOT NULL DEFAULT '',
  nip text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Tabel Katalog Aplikasi
CREATE TABLE IF NOT EXISTS public.applications (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  status public.application_status NOT NULL DEFAULT 'available',
  version text NOT NULL DEFAULT '1.0.0',
  url text NOT NULL CHECK (url ~ '^https?://'),
  icon_url text CHECK (icon_url IS NULL OR icon_url ~ '^https?://'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Tabel Akses Aplikasi untuk User / Pegawai
CREATE TABLE IF NOT EXISTS public.user_application_access (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id text NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, application_id)
);

-- 6. Tabel Master Sekolah (Login NPSN)
CREATE TABLE IF NOT EXISTS public.schools (
  npsn text PRIMARY KEY CHECK (npsn ~ '^\d{8}$'),
  name text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Tabel Akses Aplikasi untuk Sekolah
CREATE TABLE IF NOT EXISTS public.school_application_access (
  school_npsn text NOT NULL REFERENCES public.schools(npsn) ON DELETE CASCADE,
  application_id text NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (school_npsn, application_id)
);

-- 8. Fungsi & Trigger Otomatis Profil Pengguna
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.user_role;
  v_raw_role text;
  v_status text;
BEGIN
  v_raw_role := new.raw_user_meta_data->>'role';
  v_status := COALESCE(new.raw_user_meta_data->>'status', 'pending');

  IF v_raw_role = 'super_user' THEN
    v_role := 'super_user'::public.user_role;
  ELSE
    v_role := 'medium_user'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (
    new.id,
    COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), SPLIT_PART(new.email, '@', 1)),
    v_role,
    v_status
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger update user di auth.users
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.user_role;
  v_raw_role text;
BEGIN
  v_raw_role := new.raw_user_meta_data->>'role';

  IF v_raw_role IS NOT NULL THEN
    IF v_raw_role = 'super_user' THEN
      v_role := 'super_user'::public.user_role;
    ELSE
      v_role := 'medium_user'::public.user_role;
    END IF;

    UPDATE public.profiles
    SET
      full_name = COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), full_name),
      role = v_role,
      updated_at = NOW()
    WHERE id = new.id;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();

-- 9. Keamanan RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_application_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_application_access ENABLE ROW LEVEL SECURITY;

-- Policy (Akses via backend service_role otomatis bypass RLS)
DROP POLICY IF EXISTS "users can read own profile" ON public.profiles;
CREATE POLICY "users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "authenticated users can read applications" ON public.applications;
CREATE POLICY "authenticated users can read applications" ON public.applications
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users can read own application access" ON public.user_application_access;
CREATE POLICY "users can read own application access" ON public.user_application_access
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 10. Storage Bucket untuk Ikon Aplikasi
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-icons', 'application-icons', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 11. Data Awal Aplikasi
INSERT INTO public.applications (id, name, category, description, status, version, url)
VALUES
  ('e-arsip', 'E-Arsip', 'Administrasi', 'Kelola arsip digital secara aman dan terstruktur.', 'available', '1.0.0', 'https://example.com/e-arsip'),
  ('akademik', 'Akademik', 'Pendidikan', 'Akses informasi akademik dalam satu dashboard.', 'available', '2.4.1', 'https://example.com/akademik'),
  ('inventaris', 'Inventaris', 'Administrasi', 'Pantau aset dan inventaris sekolah dengan mudah.', 'maintenance', '1.8.0', 'https://example.com/inventaris'),
  ('kepegawaian', 'Kepegawaian', 'Kepegawaian', 'Informasi data dan layanan kepegawaian.', 'available', '1.2.0', 'https://example.com/kepegawaian')
ON CONFLICT (id) DO NOTHING;

-- 12. Bersihkan baris auth lama jika ada (akun admin dibuat resmi via backend/scripts/seed_users.js)
DELETE FROM auth.users WHERE email IN ('superuser@disdikwil1.go.id', 'mediumuser@disdikwil1.go.id');

