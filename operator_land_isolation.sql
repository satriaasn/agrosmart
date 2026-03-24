-- ============================================================
-- AgroSmart Patch: Operator Isolation & Lahan Context in Cash Book
-- ============================================================

-- 1. Tambah kolom lahan dan season_id ke cash_book
ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS lahan TEXT;
ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS season_id BIGINT REFERENCES public.planting_seasons(id) ON DELETE SET NULL;

-- 2. Migrasi data lama dari Biaya ke Cash Book
UPDATE public.cash_book k
SET 
  lahan = b.lahan,
  season_id = b.season_id
FROM public.biaya b
WHERE k.ref_id = b.id AND k.ref_type = 'biaya'
AND k.lahan IS NULL;

-- 3. Migrasi data lama dari Panen ke Cash Book
UPDATE public.cash_book k
SET 
  lahan = p.lahan,
  season_id = p.season_id
FROM public.panen p
WHERE k.ref_id = p.id AND k.ref_type = 'panen'
AND k.lahan IS NULL;

-- 4. Update index untuk performa filter
CREATE INDEX IF NOT EXISTS idx_cash_book_lahan ON public.cash_book(lahan);
CREATE INDEX IF NOT EXISTS idx_cash_book_season ON public.cash_book(season_id);

COMMENT ON COLUMN public.cash_book.lahan IS 'Nama blok lahan untuk filtering operator';
COMMENT ON COLUMN public.cash_book.season_id IS 'ID periode tanam untuk filtering laporan';
