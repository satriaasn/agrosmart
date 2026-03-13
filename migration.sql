-- ============================================================
--  AgroSmart — Non-Destructive Migration Script
--  Jalankan script ini di Supabase SQL Editor
--  Peringatan: Script ini HANYA menambah kolom dan kebijakan RLS,
--  TIDAK akan menghapus data yang sudah ada.
-- ============================================================

-- 1. Tambah kolom temp_password ke team_members jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_members' AND column_name='temp_password') THEN
        ALTER TABLE public.team_members ADD COLUMN temp_password TEXT;
    END IF;
END $$;

-- 2. Update RLS Policies untuk Superadmin Oversight
-- Kita gunakan DROP POLICY IF EXISTS agar tidak konflik

-- LAHAN
DROP POLICY IF EXISTS "lahan_select" ON public.lahan;
DROP POLICY IF EXISTS "lahan_insert" ON public.lahan;
DROP POLICY IF EXISTS "lahan_update" ON public.lahan;
DROP POLICY IF EXISTS "lahan_delete" ON public.lahan;
CREATE POLICY "lahan_select" ON public.lahan FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "lahan_insert" ON public.lahan FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "lahan_update" ON public.lahan FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "lahan_delete" ON public.lahan FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- TANAMAN
DROP POLICY IF EXISTS "tanaman_select" ON public.tanaman;
DROP POLICY IF EXISTS "tanaman_insert" ON public.tanaman;
DROP POLICY IF EXISTS "tanaman_update" ON public.tanaman;
DROP POLICY IF EXISTS "tanaman_delete" ON public.tanaman;
CREATE POLICY "tanaman_select" ON public.tanaman FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "tanaman_insert" ON public.tanaman FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "tanaman_update" ON public.tanaman FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "tanaman_delete" ON public.tanaman FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- KARYAWAN
DROP POLICY IF EXISTS "karyawan_select" ON public.karyawan;
DROP POLICY IF EXISTS "karyawan_insert" ON public.karyawan;
DROP POLICY IF EXISTS "karyawan_update" ON public.karyawan;
DROP POLICY IF EXISTS "karyawan_delete" ON public.karyawan;
CREATE POLICY "karyawan_select" ON public.karyawan FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "karyawan_insert" ON public.karyawan FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "karyawan_update" ON public.karyawan FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "karyawan_delete" ON public.karyawan FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- PANEN
DROP POLICY IF EXISTS "panen_select" ON public.panen;
DROP POLICY IF EXISTS "panen_insert" ON public.panen;
DROP POLICY IF EXISTS "panen_update" ON public.panen;
DROP POLICY IF EXISTS "panen_delete" ON public.panen;
CREATE POLICY "panen_select" ON public.panen FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "panen_insert" ON public.panen FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "panen_update" ON public.panen FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "panen_delete" ON public.panen FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- BIAYA
DROP POLICY IF EXISTS "biaya_select" ON public.biaya;
DROP POLICY IF EXISTS "biaya_insert" ON public.biaya;
DROP POLICY IF EXISTS "biaya_update" ON public.biaya;
DROP POLICY IF EXISTS "biaya_delete" ON public.biaya;
CREATE POLICY "biaya_select" ON public.biaya FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "biaya_insert" ON public.biaya FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "biaya_update" ON public.biaya FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "biaya_delete" ON public.biaya FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- PROFILES (Superadmin select)
DROP POLICY IF EXISTS "superadmin_profiles_select" ON public.profiles;
CREATE POLICY "superadmin_profiles_select" ON public.profiles FOR SELECT USING (
  public.is_superadmin()
);
DROP POLICY IF EXISTS "superadmin_profiles_update" ON public.profiles;
CREATE POLICY "superadmin_profiles_update" ON public.profiles FOR UPDATE USING (
  public.is_superadmin()
);

-- AKTIVITAS
DROP POLICY IF EXISTS "aktivitas_select" ON public.aktivitas;
DROP POLICY IF EXISTS "aktivitas_insert" ON public.aktivitas;
DROP POLICY IF EXISTS "aktivitas_delete" ON public.aktivitas;
CREATE POLICY "aktivitas_select" ON public.aktivitas FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "aktivitas_insert" ON public.aktivitas FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "aktivitas_delete" ON public.aktivitas FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());
