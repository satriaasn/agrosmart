-- ============================================================
-- PATCH: GRANULAR LAND ACCESS (LAHAN SPESIFIK)
-- ============================================================

-- 1. Tambah kolom assigned_lahan ke team_members jika belum ada
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS assigned_lahan JSONB DEFAULT '[]';

-- 2. Helper function untuk mengecek akses lahan
-- Mengembalikan true jika user adalah owner lahan tersebut,
-- ATAU jika user adalah operator yang diberi akses spesifik ke lahan tersebut,
-- ATAU jika user adalah superadmin.
CREATE OR REPLACE FUNCTION public.has_lahan_access(p_lahan_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_owner_id UUID;
    v_is_operator BOOLEAN;
    v_assigned JSONB;
BEGIN
    -- Ambil owner lahan
    SELECT user_id INTO v_owner_id FROM public.lahan WHERE id = p_lahan_id;
    
    -- Jika superadmin atau owner lahan itu sendiri
    IF public.is_superadmin() OR auth.uid() = v_owner_id THEN
        RETURN TRUE;
    END IF;

    -- Cek jika operator
    SELECT assigned_lahan INTO v_assigned
    FROM public.team_members
    WHERE user_id = auth.uid() AND owner_id = v_owner_id AND status = 'active';

    IF v_assigned IS NULL THEN RETURN FALSE; END IF;
    
    -- Jika '[]' (kosong) berarti akses semua lahan (default behavior agar tidak membatasi yang sudah ada)
    -- ATAU jika ID lahan ada di dalam array
    RETURN (v_assigned = '[]'::jsonb) OR (v_assigned ? p_lahan_id::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies untuk menggunakan has_lahan_access

-- Drop kebijakan lama yang bentrok
DROP POLICY IF EXISTS "lahan_select" ON public.lahan;
DROP POLICY IF EXISTS "lahan_update" ON public.lahan;
DROP POLICY IF EXISTS "tanaman_select" ON public.tanaman;
DROP POLICY IF EXISTS "tanaman_update" ON public.tanaman;
DROP POLICY IF EXISTS "panen_select" ON public.panen;
DROP POLICY IF EXISTS "panen_update" ON public.panen;
DROP POLICY IF EXISTS "biaya_select" ON public.biaya;
DROP POLICY IF EXISTS "biaya_update" ON public.biaya;

-- Create New Policies
-- LAHAN
CREATE POLICY "lahan_select" ON public.lahan FOR SELECT USING (
    auth.uid() = user_id OR public.is_superadmin() OR public.has_lahan_access(id)
);
CREATE POLICY "lahan_update" ON public.lahan FOR UPDATE USING (
    auth.uid() = user_id OR public.is_superadmin() OR public.has_lahan_access(id)
);

-- TANAMAN (linked via lahan name/id, but usually by user_id. We'll stick to user_id + check access if possible)
-- Because tanaman table doesn't have lahan_id (only 'lahan' text), it's harder to RLS strictly.
-- However, we can at least ensure they belong to the same business.
-- The real filtering will happen in the Frontend fetching.

-- PANEN
CREATE POLICY "panen_select" ON public.panen FOR SELECT USING (
    auth.uid() = user_id OR public.is_superadmin() OR public.is_my_operator(user_id)
);
-- Note: Strict RLS on Panen would require adding lahan_id to those tables. 
-- For now, we will rely on Frontend filtering & user_id check.

SELECT 'Patch Granular Access Berhasil!' as status;
