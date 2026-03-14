-- ============================================================
-- PATCH: AUTO-LINK OPERATOR & PERMISSION ENHANCEMENT
-- ============================================================

-- 1. Pastikan kolom email ada di profiles (untuk pencarian)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Perbarui handle_new_user agar otomatis mencari undangan (invitation)
-- Jika email user baru ada di team_members (pending), otomatis jadikan operator
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT;
    v_onboarding_done BOOLEAN := false;
    v_invite_record RECORD;
BEGIN
    -- Cek apakah ada undangan pending untuk email ini
    SELECT * INTO v_invite_record 
    FROM public.team_members 
    WHERE invited_email = LOWER(new.email) AND status = 'pending'
    LIMIT 1;

    IF v_invite_record.id IS NOT NULL THEN
        -- Jika ada undangan, paksa role jadi 'operator' dan tandai onboarding done
        v_role := 'operator';
        v_onboarding_done := true;
        
        -- Link-kan user_id ke team_members
        UPDATE public.team_members 
        SET user_id = new.id, 
            status = 'active', 
            temp_password = NULL -- bersihkan temp password
        WHERE id = v_invite_record.id;
    ELSE
        -- Flow normal (owner)
        v_role := COALESCE(new.raw_user_meta_data->>'role', 'owner');
        IF v_role = 'operator' THEN v_onboarding_done := true; END IF;
    END IF;

    INSERT INTO public.profiles (id, nama_pemilik, role, email, onboarding_done)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
        v_role,
        new.email,
        v_onboarding_done
    )
    ON CONFLICT (id) DO UPDATE 
    SET role = EXCLUDED.role,
        email = EXCLUDED.email,
        onboarding_done = EXCLUDED.onboarding_done;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix manual untuk newbieguba@gmail.com jika sudah terdaftar
-- Cari id untuk satriaasn2025@gmail.com (owner)
DO $$
DECLARE
    v_owner_id UUID;
    v_operator_id UUID;
BEGIN
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'satriaasn2025@gmail.com';
    SELECT id INTO v_operator_id FROM auth.users WHERE email = 'newbieguba@gmail.com';

    IF v_owner_id IS NOT NULL AND v_operator_id IS NOT NULL THEN
        -- Pastikan ada di team_members
        INSERT INTO public.team_members (owner_id, user_id, invited_email, status, role_label)
        VALUES (v_owner_id, v_operator_id, 'newbieguba@gmail.com', 'active', 'Operator')
        ON CONFLICT (owner_id, invited_email) DO UPDATE 
        SET user_id = EXCLUDED.user_id, status = 'active';

        -- Update profile newbieguba jadi operator
        UPDATE public.profiles SET role = 'operator', onboarding_done = true WHERE id = v_operator_id;
    END IF;
END $$;

SELECT 'Patch Team Management Berhasil!' as status;
