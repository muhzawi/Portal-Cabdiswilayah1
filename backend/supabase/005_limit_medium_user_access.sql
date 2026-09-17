-- 005_limit_medium_user_access.sql
-- Memastikan bahwa super user dapat mengakses seluruh aplikasi,
-- dan medium user dibatasi hanya dapat memiliki akses ke maksimal 1 aplikasi di database.

CREATE OR REPLACE FUNCTION public.check_medium_user_app_access_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_role public.user_role;
  v_count integer;
BEGIN
  -- Dapatkan role dari user
  SELECT role INTO v_role FROM public.profiles WHERE id = NEW.user_id;

  -- Jika role adalah medium_user, pastikan tidak lebih dari 1 aplikasi
  IF v_role = 'medium_user' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.user_application_access
    WHERE user_id = NEW.user_id AND application_id <> NEW.application_id;

    IF v_count >= 1 THEN
      RAISE EXCEPTION 'Medium user hanya dapat diberikan akses ke maksimal 1 aplikasi.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_medium_user_app_access_limit ON public.user_application_access;
CREATE TRIGGER enforce_medium_user_app_access_limit
  BEFORE INSERT OR UPDATE ON public.user_application_access
  FOR EACH ROW EXECUTE PROCEDURE public.check_medium_user_app_access_limit();
