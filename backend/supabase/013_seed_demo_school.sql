-- Akun sekolah demo untuk mencoba login NPSN dan alur verifikasi email.
-- Akun ini tidak memiliki akses aplikasi sampai email diverifikasi dan admin memberi persetujuan.
INSERT INTO public.schools (npsn, name, password_hash, status)
VALUES (
  '99999999',
  'Sekolah Demo',
  '$2b$10$PW1BP2IApftN8J4B7uBfH.2uNg7PDiW28gQOAaSG5W2n3x.9HbNZ.',
  'approved'
)
ON CONFLICT (npsn) DO NOTHING;
