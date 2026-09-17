-- 007_allow_multiple_app_access.sql
-- Menghapus batasan 1 aplikasi untuk medium user sehingga Super Admin dapat memberikan akses ke lebih dari 1 aplikasi.

DROP TRIGGER IF EXISTS enforce_medium_user_app_access_limit ON public.user_application_access;
DROP FUNCTION IF EXISTS public.check_medium_user_app_access_limit();
