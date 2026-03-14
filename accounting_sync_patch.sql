-- ============================================================
-- PATCH: INTEGRASI AKUNTANSI PROFESIONAL (COA & BUKU KAS)
-- ============================================================

-- 1. Tambah kolom coa_id ke tabel biaya
ALTER TABLE public.biaya ADD COLUMN IF NOT EXISTS coa_id BIGINT REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

-- 2. Tambah kolom coa_id ke tabel panen
ALTER TABLE public.panen ADD COLUMN IF NOT EXISTS coa_id BIGINT REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

-- 3. Tambah kolom ref_id dan ref_type ke tabel cash_book jika belum ada (sudah ada di patch sebelumnya, tapi untuk keamanan)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cash_book' AND column_name='ref_id') THEN
        ALTER TABLE public.cash_book ADD COLUMN ref_id BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cash_book' AND column_name='ref_type') THEN
        ALTER TABLE public.cash_book ADD COLUMN ref_type TEXT CHECK (ref_type IN ('panen','biaya'));
    END IF;
END $$;

COMMENT ON COLUMN public.biaya.coa_id IS 'Link ke Chart of Accounts';
COMMENT ON COLUMN public.panen.coa_id IS 'Link ke Chart of Accounts untuk Revenue';
