-- 011_add_schools_table.sql
-- Tabel master sekolah untuk login via NPSN dan tabel akses aplikasi sekolah.
-- Akun sekolah dibuat oleh super admin, login pakai NPSN + password.
-- Password di-hash oleh backend (bcrypt), bukan plaintext.

CREATE TABLE IF NOT EXISTS public.schools (
  npsn text PRIMARY KEY CHECK (npsn ~ '^\d{8}$'),
  name text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Aktifkan RLS sebagai lapisan keamanan tambahan
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Tabel akses aplikasi untuk sekolah
CREATE TABLE IF NOT EXISTS public.school_application_access (
  school_npsn text NOT NULL REFERENCES public.schools(npsn) ON DELETE CASCADE,
  application_id text NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (school_npsn, application_id)
);

ALTER TABLE public.school_application_access ENABLE ROW LEVEL SECURITY;

-- Hanya service_role (backend) yang mengakses tabel-tabel ini.
-- Tidak perlu policy untuk anon/authenticated karena semua akses melalui backend.
