-- ============================================================
--  AgroSmart Patch: Buku Kas (Cash Book) & Neraca
-- ============================================================

-- 1. Create cash_book table
CREATE TABLE IF NOT EXISTS public.cash_book (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
  tipe        TEXT NOT NULL CHECK (tipe IN ('masuk','keluar')),
  jumlah      NUMERIC NOT NULL DEFAULT 0,
  kategori    TEXT NOT NULL DEFAULT 'Lainnya',
  deskripsi   TEXT,
  ref_id      BIGINT, -- Optional reference to panen or biaya
  ref_type    TEXT CHECK (ref_type IN ('panen','biaya')), -- Optional type
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.cash_book ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "cash_book_select" ON public.cash_book FOR SELECT USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "cash_book_insert" ON public.cash_book FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "cash_book_update" ON public.cash_book FOR UPDATE USING (auth.uid() = user_id OR public.is_my_operator(user_id) OR public.is_superadmin());
CREATE POLICY "cash_book_delete" ON public.cash_book FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- 4. Add default categories to units/categories system? 
-- The user didn't ask for dynamic cash categories yet, we can use simple text for now or link to expense_categories. 
-- For now, let's stick to simple text to keep it flexible as "Buku Kas" is different from operational "Biaya".

COMMENT ON TABLE public.cash_book IS 'Table to track actual cash flow (Income/Expense)';
