-- ============================================================
-- PATCH: GRANULAR PERMISSIONS PER MODULE
-- ============================================================

-- Gunakan JSONB untuk fleksibilitas izin per modul
-- Struktur baru 'permissions' akan seperti ini:
-- {
--   "lahan":   {"view": true, "add": true, "edit": true, "delete": false},
--   "tanaman": {"view": true, "add": false, "edit": false, "delete": false},
--   ...
-- }

-- Update trigger handle_new_user untuk set permission default yang lebih aman (granular)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_invite_id BIGINT;
    v_owner_id UUID;
    v_role_label TEXT;
    v_permissions JSONB;
    v_assigned_lahan JSONB;
BEGIN
    -- Sinkronisasi email ke profil
    INSERT INTO public.profiles (id, email, role, onboarding_done)
    VALUES (NEW.id, NEW.email, 'owner', false)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email;

    -- Cek jika ada undangan pending untuk email ini
    SELECT id, owner_id, role_label, permissions, assigned_lahan 
    INTO v_invite_id, v_owner_id, v_role_label, v_permissions, v_assigned_lahan
    FROM public.team_members 
    WHERE invited_email = NEW.email AND status = 'pending'
    LIMIT 1;

    IF v_invite_id IS NOT NULL THEN
        -- Link user ke team sebagai operator
        UPDATE public.team_members 
        SET user_id = NEW.id, status = 'active'
        WHERE id = v_invite_id;

        -- Update role di profile menjadi operator
        UPDATE public.profiles 
        SET role = 'operator', onboarding_done = true
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Script migrasi data lama (opsional jika ingin reset permission ke yang lebih aman)
-- UPDATE public.team_members SET permissions = '{
--   "dashboard": {"view": true},
--   "lahan": {"view": true, "add": false, "edit": false, "delete": false},
--   "tanaman": {"view": true, "add": false, "edit": false, "delete": false},
--   "karyawan": {"view": true, "add": false, "edit": false, "delete": false},
--   "panen": {"view": true, "add": false, "edit": false, "delete": false},
--   "keuangan": {"view": false, "add": false, "edit": false, "delete": false},
--   "laporan": {"view": true},
--   "cuaca": {"view": true},
--   "peta": {"view": true}
-- }'::jsonb WHERE permissions IS NULL OR permissions::text LIKE '%true%';

SELECT 'Patch Granular Permissions Berhasil!' as status;
