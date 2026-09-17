-- 004_sync_user_metadata_role.sql
-- Memungkinkan pembuatan dan perubahan user langsung dari Supabase Auth / Dashboard
-- dengan role ('super_user' atau 'medium_user') yang diset via User Metadata (raw_user_meta_data -> role).

-- 1. Perbarui fungsi handle_new_user agar membaca role dari raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.user_role;
  v_raw_role text;
BEGIN
  v_raw_role := new.raw_user_meta_data->>'role';

  IF v_raw_role = 'super_user' THEN
    v_role := 'super_user'::public.user_role;
  ELSE
    v_role := 'medium_user'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), SPLIT_PART(new.email, '@', 1)),
    v_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN new;
END;
$$;

-- 2. Buat fungsi & trigger untuk menyinkronkan perubahan metadata role saat user diupdate di Supabase Auth
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

-- Daftarkan trigger setelah user diupdate di auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();
