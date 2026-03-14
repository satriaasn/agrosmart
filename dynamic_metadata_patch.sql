-- ============================================================
--  AgroSmart — Dynamic Metadata (Categories & Units)
-- ============================================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT '📋',
  color       TEXT DEFAULT '#6b7280',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.units (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL, -- 'biaya', 'panen', 'tanaman'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Expense Categories Policies
DROP POLICY IF EXISTS "ec_select" ON public.expense_categories;
CREATE POLICY "ec_select" ON public.expense_categories FOR SELECT USING (
  auth.uid() = user_id OR 
  public.is_my_operator(user_id) OR 
  public.is_superadmin()
);

DROP POLICY IF EXISTS "ec_all_owner" ON public.expense_categories;
CREATE POLICY "ec_all_owner" ON public.expense_categories FOR ALL USING (auth.uid() = user_id);

-- Units Policies
DROP POLICY IF EXISTS "u_select" ON public.units;
CREATE POLICY "u_select" ON public.units FOR SELECT USING (
  auth.uid() = user_id OR 
  public.is_my_operator(user_id) OR 
  public.is_superadmin()
);

DROP POLICY IF EXISTS "u_all_owner" ON public.units;
CREATE POLICY "u_all_owner" ON public.units FOR ALL USING (auth.uid() = user_id);

-- 3. Pre-seed Function (Optional but helpful)
-- Can be called from frontend when list is empty
