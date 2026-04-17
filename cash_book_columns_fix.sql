-- ============================================================
--  AgroSmart Patch: Cash Book Missing Columns Fix
--  Jalankan di Supabase SQL Editor untuk menambah kolom
--  yang dibutuhkan oleh sinkronisasi Biaya/Panen ke Buku Kas.
-- ============================================================

-- 1. Tambah kolom 'lahan' ke cash_book (untuk filter operator & tracking)
ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS lahan TEXT;

-- 2. Tambah kolom 'season_id' ke cash_book (untuk filter periode)
ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS season_id BIGINT REFERENCES public.planting_seasons(id) ON DELETE SET NULL;

-- 3. Tambah kolom 'coa_id' ke cash_book (untuk integrasi Chart of Accounts)
ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS coa_id BIGINT REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

-- 4. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_cash_book_lahan ON public.cash_book(lahan);
CREATE INDEX IF NOT EXISTS idx_cash_book_season ON public.cash_book(season_id);
CREATE INDEX IF NOT EXISTS idx_cash_book_coa ON public.cash_book(coa_id);

-- 5. Migrasi data lama: isi kolom lahan dan season_id dari tabel biaya
UPDATE public.cash_book k
SET 
  lahan = b.lahan,
  season_id = b.season_id
FROM public.biaya b
WHERE k.ref_id = b.id AND k.ref_type = 'biaya'
AND k.lahan IS NULL;

-- 6. Migrasi data lama: isi kolom lahan dan season_id dari tabel panen
UPDATE public.cash_book k
SET 
  lahan = p.lahan,
  season_id = p.season_id
FROM public.panen p
WHERE k.ref_id = p.id AND k.ref_type = 'panen'
AND k.lahan IS NULL;

-- 7. Komentar dokumentasi
COMMENT ON COLUMN public.cash_book.lahan IS 'Nama blok lahan untuk filtering operator';
COMMENT ON COLUMN public.cash_book.season_id IS 'ID periode tanam untuk filtering laporan';
COMMENT ON COLUMN public.cash_book.coa_id IS 'ID akun COA untuk integrasi akuntansi';

-- ============================================================
-- SELESAI — Refresh schema cache di Supabase Dashboard jika perlu
-- (Settings → API → Reload Schema Cache)
-- ============================================================
