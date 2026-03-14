-- ============================================================
-- SINKRONISASI EMAIL KE TABEL PROFILES & UPDATE TRIGGER
-- ============================================================

-- 1. Tambah kolom email ke public.profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill email dari auth.users ke public.profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Perbarui fungsi handle_new_user untuk menyertakan email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT;
    v_onboarding_done BOOLEAN := false;
BEGIN
    -- Ambil role dari metadata jika ada, default 'owner'
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'owner');
    
    -- Jika operator, biasanya onboarding dilewati
    IF v_role = 'operator' THEN
        v_onboarding_done := true;
    END IF;

    INSERT INTO public.profiles (id, nama_pemilik, role, email, onboarding_done)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
        v_role,
        new.email,
        v_onboarding_done
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verifikasi
SELECT 'Sinkronisasi Email Berhasil!' as status;
