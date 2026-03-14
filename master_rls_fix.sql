-- ============================================================
-- AGROSMART: MASTER RLS & SCHEMA RECONSTRUCTION PATCH
-- ============================================================

-- 1. FIX COLUMN NAMES & GRANTS
-- Ensure authenticated users can do everything on public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. RE-ENABLE RLS FOR ALL OPERATIONS
ALTER TABLE public.tanaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biaya ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karyawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aktivitas ENABLE ROW LEVEL SECURITY;

-- 3. DROP ALL OLD POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "tanaman_select" ON public.tanaman;
DROP POLICY IF EXISTS "tanaman_insert" ON public.tanaman;
DROP POLICY IF EXISTS "tanaman_update" ON public.tanaman;
DROP POLICY IF EXISTS "tanaman_delete" ON public.tanaman;

DROP POLICY IF EXISTS "lahan_select" ON public.lahan;
DROP POLICY IF EXISTS "lahan_insert" ON public.lahan;
DROP POLICY IF EXISTS "lahan_update" ON public.lahan;
DROP POLICY IF EXISTS "lahan_delete" ON public.lahan;

DROP POLICY IF EXISTS "panen_select" ON public.panen;
DROP POLICY IF EXISTS "panen_insert" ON public.panen;
DROP POLICY IF EXISTS "panen_update" ON public.panen;
DROP POLICY IF EXISTS "panen_delete" ON public.panen;

DROP POLICY IF EXISTS "biaya_select" ON public.biaya;
DROP POLICY IF EXISTS "biaya_insert" ON public.biaya;
DROP POLICY IF EXISTS "biaya_update" ON public.biaya;
DROP POLICY IF EXISTS "biaya_delete" ON public.biaya;

-- 4. CREATE SIMPLIFIED BUT ROBUST POLICIES
-- We use a single policy per action for clarity

-- --- TANAMAN ---
CREATE POLICY "tanaman_all_owner" ON public.tanaman FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "tanaman_select_operator" ON public.tanaman FOR SELECT USING (public.is_my_operator(user_id));
CREATE POLICY "tanaman_insert_operator" ON public.tanaman FOR INSERT WITH CHECK (public.is_my_operator(user_id));
CREATE POLICY "tanaman_update_operator" ON public.tanaman FOR UPDATE USING (public.is_my_operator(user_id));

-- --- LAHAN ---
CREATE POLICY "lahan_all_owner" ON public.lahan FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "lahan_select_operator" ON public.lahan FOR SELECT USING (public.is_my_operator(user_id));
CREATE POLICY "lahan_insert_operator" ON public.lahan FOR INSERT WITH CHECK (public.is_my_operator(user_id));
CREATE POLICY "lahan_update_operator" ON public.lahan FOR UPDATE USING (public.is_my_operator(user_id));

-- --- PANEN ---
CREATE POLICY "panen_all_owner" ON public.panen FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "panen_select_operator" ON public.panen FOR SELECT USING (public.is_my_operator(user_id));
CREATE POLICY "panen_insert_operator" ON public.panen FOR INSERT WITH CHECK (public.is_my_operator(user_id));
CREATE POLICY "panen_update_operator" ON public.panen FOR UPDATE USING (public.is_my_operator(user_id));

-- --- BIAYA ---
CREATE POLICY "biaya_all_owner" ON public.biaya FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "biaya_select_operator" ON public.biaya FOR SELECT USING (public.is_my_operator(user_id));
CREATE POLICY "biaya_insert_operator" ON public.biaya FOR INSERT WITH CHECK (public.is_my_operator(user_id));
CREATE POLICY "biaya_update_operator" ON public.biaya FOR UPDATE USING (public.is_my_operator(user_id));

-- 5. VERIFY SCHEMA Mismatch (Run this to see if columns are correct)
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('tanaman', 'lahan', 'panen', 'biaya')
AND column_name IN ('user_id', 'owner_id');

-- Superadmin bypass
CREATE POLICY "admin_tanaman" ON public.tanaman FOR ALL USING (public.is_superadmin());
CREATE POLICY "admin_lahan" ON public.lahan FOR ALL USING (public.is_superadmin());
CREATE POLICY "admin_panen" ON public.panen FOR ALL USING (public.is_superadmin());
CREATE POLICY "admin_biaya" ON public.biaya FOR ALL USING (public.is_superadmin());

SELECT 'Master RLS Reconstruction Applied Successfully!' as status;
