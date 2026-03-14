-- ============================================================
-- AgroSmart — SQL PATCH: Team Login Improvements
-- ============================================================

-- Function to safely check if an email + temp_password combination is valid
-- without exposing the whole team_members table to RLS
CREATE OR REPLACE FUNCTION public.check_operator_invite(p_email TEXT, p_password TEXT)
RETURNS TABLE (
    id UUID,
    owner_id UUID,
    role_label TEXT,
    permissions JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as postgres, bypassing RLS but strictly limited to this check
AS $$
BEGIN
    RETURN QUERY
    SELECT tm.id, tm.owner_id, tm.role_label, tm.permissions
    FROM public.team_members tm
    WHERE tm.invited_email = LOWER(p_email)
      AND tm.temp_password = p_password
      AND tm.status = 'pending';
END;
$$;

-- Grant execution to anon (login page)
GRANT EXECUTE ON FUNCTION public.check_operator_invite(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_operator_invite(TEXT, TEXT) TO authenticated;

-- Ensure RLS on team_members allows updates for completion (if needed by auth hook, but here we do it via client with session)
-- Actually, the signUp will trigger handle_new_user, but we need to link team_members.user_id.
-- Let's make a function for that too to keep it secure.
CREATE OR REPLACE FUNCTION public.link_team_member(p_invite_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.team_members
    SET user_id = auth.uid(),
        status = 'active',
        temp_password = NULL -- Clear security risk
    WHERE id = p_invite_id 
      AND status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_team_member(UUID) TO authenticated;

-- SELESAI.
