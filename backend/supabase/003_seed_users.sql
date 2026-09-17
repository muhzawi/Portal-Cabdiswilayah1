-- Query SQL untuk menambahkan 1 akun super-user dan 1 akun medium-user di Supabase Database

-- 1. Pastikan ekstensi pgcrypto tersedia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_super_user_id UUID := gen_random_uuid();
  v_medium_user_id UUID := gen_random_uuid();
BEGIN

  ------------------------------------------------------------
  -- 1. AKUN SUPER USER
  ------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superuser@disdikwil1.go.id') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_super_user_id,
      'authenticated',
      'authenticated',
      'superuser@disdikwil1.go.id',
      crypt('SuperUser123!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super User Portal"}'::jsonb,
      NOW(),
      NOW()
    );

    -- Trigger otomatis membuat profile. Ubah role profile menjadi super_user.
    UPDATE public.profiles
    SET role = 'super_user'
    WHERE id = v_super_user_id;
  END IF;

  ------------------------------------------------------------
  -- 2. AKUN MEDIUM USER
  ------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mediumuser@disdikwil1.go.id') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_medium_user_id,
      'authenticated',
      'authenticated',
      'mediumuser@disdikwil1.go.id',
      crypt('MediumUser123!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Medium User Portal"}'::jsonb,
      NOW(),
      NOW()
    );

    -- Berikan hak akses aplikasi spesifik untuk medium user (contoh: E-Arsip dan Kepegawaian)
    INSERT INTO public.user_application_access (user_id, application_id)
    VALUES
      (v_medium_user_id, 'e-arsip'),
      (v_medium_user_id, 'kepegawaian')
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
