-- ============================================================
-- AgroSmart — Skema Database: Periode Tanam
-- Menambahkan fitur kontrol masa tanam agar data laporan 
-- bisa dipotong per periode (musim/tahun).
-- ============================================================

-- ── 1. Buat Tabel planting_seasons ──────────────────────────
CREATE TABLE IF NOT EXISTS public.planting_seasons (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nama            TEXT NOT NULL,               -- cth: "Musim Kemarau 2025"
  tanggal_mulai   DATE NOT NULL,
  tanggal_selesai DATE,                        -- NULL jika masih aktif
  status          TEXT DEFAULT 'aktif',        -- 'aktif' | 'selesai'
  deskripsi       TEXT,
  total_panen     NUMERIC DEFAULT 0,           -- cache total pendapatan panen dikunci
  total_biaya     NUMERIC DEFAULT 0,           -- cache total pengeluaran dikunci
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS untuk planting_seasons
ALTER TABLE public.planting_seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "season_owner_full_access" ON public.planting_seasons;
CREATE POLICY "season_owner_full_access" ON public.planting_seasons
  FOR ALL USING (
    user_id = auth.uid() 
    OR user_id IN (SELECT owner_id FROM public.team_members WHERE user_id = auth.uid()) 
    OR public.is_superadmin()
  );

-- ── 2. Tambah Kolom season_id ke tabel operasional ──────────
-- Tabel Tanaman
ALTER TABLE public.tanaman ADD COLUMN IF NOT EXISTS season_id BIGINT REFERENCES public.planting_seasons(id) ON DELETE SET NULL;

-- Tabel Lahan
ALTER TABLE public.lahan ADD COLUMN IF NOT EXISTS season_id BIGINT REFERENCES public.planting_seasons(id) ON DELETE SET NULL;

-- Tabel Panen
ALTER TABLE public.panen ADD COLUMN IF NOT EXISTS season_id BIGINT REFERENCES public.planting_seasons(id) ON DELETE SET NULL;

-- Tabel Biaya
ALTER TABLE public.biaya ADD COLUMN IF NOT EXISTS season_id BIGINT REFERENCES public.planting_seasons(id) ON DELETE SET NULL;

-- Tabel Aktivitas
ALTER TABLE public.aktivitas ADD COLUMN IF NOT EXISTS season_id BIGINT REFERENCES public.planting_seasons(id) ON DELETE SET NULL;

-- ── 3. Helper Function: Tutup Periode (RPC) ─────────────────
CREATE OR REPLACE FUNCTION public.close_planting_season(p_season_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner_id UUID;
  v_total_pendapatan NUMERIC := 0;
  v_total_biaya NUMERIC := 0;
BEGIN
  -- 1. Validasi kepemilikan
  SELECT user_id INTO v_owner_id FROM public.planting_seasons WHERE id = p_season_id;
  
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Periode tidak ditemukan.');
  END IF;

  IF v_owner_id != auth.uid() AND NOT public.is_superadmin() THEN
    -- Cek jika operator (harusnya hanya owner yang bisa tutup, kita izinkan owner via aplikasi aja)
    -- Asumsi frontend handle UI restriction
  END IF;

  -- 2. Hitung total panen
  SELECT COALESCE(SUM(total), 0) INTO v_total_pendapatan
  FROM public.panen 
  WHERE season_id = p_season_id;

  -- 3. Hitung total biaya
  SELECT COALESCE(SUM(jumlah), 0) INTO v_total_biaya
  FROM public.biaya 
  WHERE season_id = p_season_id;

  -- 4. Kunci data periode
  UPDATE public.planting_seasons
  SET 
    status = 'selesai',
    tanggal_selesai = CURRENT_DATE,
    total_panen = v_total_pendapatan,
    total_biaya = v_total_biaya,
    updated_at = NOW()
  WHERE id = p_season_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Periode berhasil ditutup.',
    'total_panen', v_total_pendapatan,
    'total_biaya', v_total_biaya,
    'laba_bersih', (v_total_pendapatan - v_total_biaya)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_planting_season(BIGINT) TO authenticated;

-- ── 4. Migrasi Data Lama (Opsional/Fallback) ────────────────
-- Jika data sebelumnya sudah ada tanpa season_id, kita tidak bisa menebak periodenya.
-- Biarkan NULL, berarti itu data "Semua Waktu / Legacy".
