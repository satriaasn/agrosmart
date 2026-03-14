-- ============================================================
--  AgroSmart Patch: Chart of Accounts (COA) / Daftar Akun
-- ============================================================

-- 1. Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  account_code    TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  account_type    TEXT NOT NULL CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  is_header       BOOLEAN DEFAULT FALSE,
  parent_id       BIGINT REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, account_code)
);

-- 2. Add relation to expense_categories
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS coa_id BIGINT REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

-- 3. Add relation to cash_book (optional but good for formal accounting)
ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS coa_id BIGINT REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "coa_select" ON public.chart_of_accounts FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "coa_insert" ON public.chart_of_accounts FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "coa_update" ON public.chart_of_accounts FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "coa_delete" ON public.chart_of_accounts FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

COMMENT ON TABLE public.chart_of_accounts IS 'Table for Chart of Accounts (COA) / Daftar Akun for accounting';
