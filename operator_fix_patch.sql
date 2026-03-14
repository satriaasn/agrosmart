-- ============================================================
-- AgroSmart — SQL PATCH: Operator Onboarding & Profile Fix
-- ============================================================

-- 1. Update handle_new_user to handle operator onboarding bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_onboarding_done BOOLEAN;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'owner');
  
  -- If role is 'operator', they don't need to do onboarding (setup business)
  -- because they are joining an existing one.
  v_onboarding_done := (v_role = 'operator');

  INSERT INTO public.profiles (id, nama_pemilik, role, onboarding_done)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    v_onboarding_done
  )
  ON CONFLICT (id) DO UPDATE 
  SET role = EXCLUDED.role,
      onboarding_done = EXCLUDED.onboarding_done;
      
  RETURN NEW;
END;
$$;

-- 2. Ensure existing operator profiles have onboarding_done = true
UPDATE public.profiles 
SET onboarding_done = TRUE 
WHERE role = 'operator' AND onboarding_done = FALSE;

-- 3. Update profiles RLS to allow operators to see their owner's profile (for business name)
-- This was already in schema.sql but let's ensure it's robust.
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (
  auth.uid() = id OR
  id IN (SELECT owner_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active')
);

-- SELESAI.
