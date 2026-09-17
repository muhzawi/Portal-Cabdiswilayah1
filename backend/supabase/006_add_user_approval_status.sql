-- 006_add_user_approval_status.sql
-- Menambahkan kolom status pada profiles untuk fitur konfirmasi / approval akun pengguna (pending, approved, rejected).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update trigger handle_new_user agar membaca status dari raw_user_meta_data (default 'pending' untuk registrasi mandiri)
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
