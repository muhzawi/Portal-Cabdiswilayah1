-- Simpan alamat yang diminta secara sementara; email profil diisi hanya setelah verifikasi berhasil.
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS pending_email text;

CREATE UNIQUE INDEX IF NOT EXISTS schools_pending_email_unique
  ON public.schools (lower(pending_email)) WHERE pending_email IS NOT NULL;
