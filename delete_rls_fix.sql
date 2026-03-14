-- ============================================================
--  AgroSmart — RLS Delete Policy Fix Patch
--  Permit operators to delete records they or their owner owns
-- ============================================================

-- 1. LAHAN
DROP POLICY IF EXISTS "lahan_delete" ON public.lahan;
CREATE POLICY "lahan_delete" ON public.lahan FOR DELETE USING (
    auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin()
);

-- 2. TANAMAN
DROP POLICY IF EXISTS "tanaman_delete" ON public.tanaman;
CREATE POLICY "tanaman_delete" ON public.tanaman FOR DELETE USING (
    auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin()
);

-- 3. KARYAWAN
DROP POLICY IF EXISTS "karyawan_delete" ON public.karyawan;
CREATE POLICY "karyawan_delete" ON public.karyawan FOR DELETE USING (
    auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin()
);

-- 4. PANEN
DROP POLICY IF EXISTS "panen_delete" ON public.panen;
CREATE POLICY "panen_delete" ON public.panen FOR DELETE USING (
    auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin()
);

-- 5. BIAYA
DROP POLICY IF EXISTS "biaya_delete" ON public.biaya;
CREATE POLICY "biaya_delete" ON public.biaya FOR DELETE USING (
    auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin()
);

-- 6. AKTIVITAS
DROP POLICY IF EXISTS "aktivitas_delete" ON public.aktivitas;
CREATE POLICY "aktivitas_delete" ON public.aktivitas FOR DELETE USING (
    auth.uid() = user_id OR public.is_my_operator(user_id)
);
