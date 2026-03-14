-- ============================================================
-- PATCH: FORCE SYNC NEWBIEGUBA OPERATOR (V2)
-- ============================================================

DO $$
DECLARE
    v_owner_id UUID;
    v_operator_id UUID;
    v_lahan_ids JSONB;
BEGIN
    -- 1. Identify Owner & Operator
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'satriaasn2025@gmail.com';
    SELECT id INTO v_operator_id FROM auth.users WHERE email = 'newbieguba@gmail.com';

    IF v_owner_id IS NULL THEN
        RAISE NOTICE 'Owner satriaasn2025@gmail.com not found.';
    ELSIF v_operator_id IS NULL THEN
        RAISE NOTICE 'Operator newbieguba@gmail.com not found.';
    ELSE
        -- 2. Ensure Profile is set to Operator
        UPDATE public.profiles 
        SET role = 'operator', 
            onboarding_done = true 
        WHERE id = v_operator_id;

        -- 3. Get all current land IDs for the owner
        SELECT jsonb_agg(id) INTO v_lahan_ids FROM public.lahan WHERE user_id = v_owner_id;

        -- 4. Ensure Team Member row exists, is ACTIVE, and has ALL lands assigned
        INSERT INTO public.team_members (owner_id, user_id, invited_email, status, role_label, permissions, assigned_lahan)
        VALUES (
            v_owner_id, 
            v_operator_id, 
            'newbieguba@gmail.com', 
            'active', 
            'Operator',
            '{
                "dashboard": {"view": true},
                "lahan": {"view": true, "add": true, "edit": true, "delete": true},
                "tanaman": {"view": true, "add": true, "edit": true, "delete": true},
                "karyawan": {"view": true, "add": true, "edit": true, "delete": true},
                "panen": {"view": true, "add": true, "edit": true, "delete": true},
                "keuangan": {"view": true, "add": true, "edit": true, "delete": true},
                "laporan": {"view": true},
                "cuaca": {"view": true},
                "peta": {"view": true}
            }'::jsonb,
            v_lahan_ids
        )
        ON CONFLICT (owner_id, invited_email) DO UPDATE 
        SET user_id = EXCLUDED.user_id, 
            status = 'active',
            role_label = COALESCE(team_members.role_label, EXCLUDED.role_label),
            permissions = EXCLUDED.permissions,
            assigned_lahan = EXCLUDED.assigned_lahan;
            
        RAISE NOTICE 'Sync successful for newbieguba@gmail.com with % lands assigned.', jsonb_array_length(v_lahan_ids);
    END IF;
END $$;
