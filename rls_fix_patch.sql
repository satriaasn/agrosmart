-- ============================================================
--  AgroSmart — SQL PATCH: Fix RLS untuk Supabase yang sudah ada datanya
--  Jalankan script ini TANPA menghapus data yang ada.
--  Cukup copy-paste ke SQL Editor Supabase → Run
-- ============================================================

-- 1. Buat function is_superadmin() SECURITY DEFINER
--    (menghindari infinite recursion di RLS profiles)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT role = 'superadmin' FROM public.profiles WHERE id = auth.uid()),
    FALSE
  )
$$;

-- 2. Hapus policy profiles yang rekursif (jika ada)
DROP POLICY IF EXISTS "superadmin_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "superadmin_profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- 3. Buat ulang policy profiles yang benar (tidak rekursif)
CREATE POLICY "superadmin_profiles_select" ON public.profiles FOR SELECT USING (
  public.is_superadmin()
);
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (
  auth.uid() = id OR
  id IN (SELECT owner_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "superadmin_profiles_update" ON public.profiles FOR UPDATE USING (
  public.is_superadmin()
);

-- 4. Pastikan is_my_operator() function juga ada
CREATE OR REPLACE FUNCTION public.is_my_operator(owner_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE owner_id = owner_uuid AND user_id = auth.uid() AND status = 'active'
  )
$$;

-- SELESAI. Coba login kembali ke aplikasi.
